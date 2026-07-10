import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useVoiceChat(channel, profile, activeRoomId) {
  const [inVoice, setInVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState({}); // { username: { isMuted: boolean } }

  const localStreamRef = useRef(null);
  const pcsRef = useRef({}); // username -> RTCPeerConnection
  const audioElementsRef = useRef({}); // username -> HTMLAudioElement

  const broadcastVoiceState = useCallback((state) => {
    if (!channel || !profile) return;
    channel.publish('voice_state', {
      username: profile.username,
      roomId: activeRoomId,
      ...state,
    });
  }, [channel, profile, activeRoomId]);

  const cleanupAllConnections = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    // Close peer connections
    Object.keys(pcsRef.current).forEach((username) => {
      if (pcsRef.current[username]) {
        pcsRef.current[username].close();
      }
    });
    pcsRef.current = {};
    // Remove audio elements
    Object.keys(audioElementsRef.current).forEach((username) => {
      if (audioElementsRef.current[username]) {
        audioElementsRef.current[username].remove();
      }
    });
    audioElementsRef.current = {};
  }, []);

  const leaveVoice = useCallback(() => {
    cleanupAllConnections();
    setInVoice(false);
    broadcastVoiceState({ inVoice: false, isMuted: false });
    toast.success('Left voice chat.', { id: 'voice-toast' });
  }, [cleanupAllConnections, broadcastVoiceState]);

  // Reset voice state when room changes
  useEffect(() => {
    if (inVoice) {
      leaveVoice();
    }
    setVoiceUsers({});
  }, [activeRoomId, inVoice, leaveVoice]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupAllConnections();
    };
  }, [cleanupAllConnections]);

  // Play remote audio stream
  const playRemoteStream = (username, stream) => {
    // Remove existing audio element if any
    if (audioElementsRef.current[username]) {
      audioElementsRef.current[username].remove();
    }

    const audio = document.createElement('audio');
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.playsInline = true;
    document.body.appendChild(audio);
    audioElementsRef.current[username] = audio;
  };

  // Create peer connection
  const createPeerConnection = useCallback((peerUsername, isInitiator) => {
    if (pcsRef.current[peerUsername]) {
      pcsRef.current[peerUsername].close();
    }

    const pc = new RTCPeerConnection(rtcConfig);
    pcsRef.current[peerUsername] = pc;

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(peerUsername, { candidate: event.candidate });
      }
    };

    // Remote Track
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        playRemoteStream(peerUsername, event.streams[0]);
      }
    };

    // Negotiation needed (only for initiator)
    pc.onnegotiationneeded = async () => {
      try {
        if (isInitiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal(peerUsername, { sdp: offer });
        }
      } catch (err) {
        console.error('Error creating WebRTC offer:', err);
      }
    };

    return pc;
  }, [sendSignal]);

  const sendSignal = useCallback((to, signalData) => {
    if (!channel || !profile) return;
    channel.publish('voice_signal', {
      to,
      from: profile.username,
      roomId: activeRoomId,
      ...signalData,
    });
  }, [channel, profile, activeRoomId]);

  // Handle incoming signals
  const handleIncomingSignal = useCallback(async (data) => {
    if (!inVoice || !profile) return;
    if (data.to !== profile.username) return;

    const peerUsername = data.from;

    try {
      let pc = pcsRef.current[peerUsername];

      if (data.sdp) {
        // If we receive an offer, we are not the initiator (answerer)
        if (data.sdp.type === 'offer') {
          if (!pc) {
            pc = createPeerConnection(peerUsername, false);
          }
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal(peerUsername, { sdp: answer });
        } else if (data.sdp.type === 'answer') {
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          }
        }
      } else if (data.candidate) {
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      }
    } catch (err) {
      console.error('Error handling voice signal:', err);
    }
  }, [inVoice, profile, createPeerConnection, sendSignal]);

  // Handle voice state updates from others
  const handleVoiceState = useCallback((data) => {
    if (!profile || data.username === profile.username) return;

    setVoiceUsers((prev) => {
      const updated = { ...prev };
      if (data.inVoice) {
        updated[data.username] = { isMuted: data.isMuted };
        
        // If we are both in voice, initiate WebRTC connection
        // We use alphabetical comparison to decide who initiates (glare prevention)
        if (inVoice && !pcsRef.current[data.username]) {
          const isInitiator = profile.username > data.username;
          if (isInitiator) {
            createPeerConnection(data.username, true);
          }
        }
      } else {
        // Peer left voice
        delete updated[data.username];
        if (pcsRef.current[data.username]) {
          pcsRef.current[data.username].close();
          delete pcsRef.current[data.username];
        }
        if (audioElementsRef.current[data.username]) {
          audioElementsRef.current[data.username].remove();
          delete audioElementsRef.current[data.username];
        }
      }
      return updated;
    });
  }, [profile, inVoice, createPeerConnection]);

  // Listen for socket events
  useEffect(() => {
    if (!channel || !profile) return;

    channel.listen('voice_state', handleVoiceState);
    channel.listen('voice_signal', handleIncomingSignal);

    // Ask for voice states when joining room
    if (inVoice) {
      broadcastVoiceState({ inVoice: true, isMuted });
    }

    return () => {
      // Clean up listeners
    };
  }, [channel, profile, inVoice, isMuted, handleVoiceState, handleIncomingSignal, broadcastVoiceState]);

  // Join Voice Call
  const joinVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      
      // Ensure initial mute state is applied
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });

      setInVoice(true);
      broadcastVoiceState({ inVoice: true, isMuted });
      toast.success('Joined voice chat!', { id: 'voice-toast' });
    } catch (err) {
      console.error('Could not access microphone:', err);
      toast.error('Microphone access denied or unavailable.');
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMute;
      });
    }
    broadcastVoiceState({ inVoice: true, isMuted: nextMute });
  };

  return {
    inVoice,
    isMuted,
    voiceUsers,
    joinVoice,
    leaveVoice,
    toggleMute,
  };
}

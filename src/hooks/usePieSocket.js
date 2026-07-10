import { useEffect, useState, useRef, useCallback } from 'react';
import pieSocketService from '../services/piesocket';
import { playNotificationSound } from '../utils/helpers';
import toast from 'react-hot-toast';

/**
 * Parses a raw PieSocket member object into a usable { username, avatarColor, uuid }.
 * The `user` field corresponds to the userId (serialized JSON containing username & email).
 */
const parseMember = (member) => {
  try {
    const data = JSON.parse(member.user);
    return {
      username: data.username || 'Anonymous',
      email: data.email || '',
      avatarColor: 'from-violet-500 to-purple-600',
      uuid: member.uuid,
    };
  } catch (e) {
    return {
      username: member.user || 'Anonymous',
      email: '',
      avatarColor: 'from-violet-500 to-purple-600',
      uuid: member.uuid,
    };
  }
};

/**
 * Custom hook to manage PieSocket channel lifecycle and pub/sub messaging.
 * @param {string|null} roomId - Room name exactly as defined in constants (e.g. "general-lounge")
 * @param {object|null} profile - Local user profile { username, avatarColor, email }
 * @param {object} options - { onMessage }
 */
export function usePieSocket(roomId, profile, options = {}) {
  const { onMessage, onReaction } = options;

  const [connectionStatus, setConnectionStatus] = useState('offline');
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});

  const channelRef = useRef(null);
  const typingTimeoutsRef = useRef({});

  // Remove a user from the typing map and clear their timeout
  const removeTypingUser = useCallback((uuid) => {
    setTypingUsers((prev) => {
      const updated = { ...prev };
      delete updated[uuid];
      return updated;
    });
    if (typingTimeoutsRef.current[uuid]) {
      clearTimeout(typingTimeoutsRef.current[uuid]);
      delete typingTimeoutsRef.current[uuid];
    }
  }, []);

  // Add/remove typing users — never show self
  const handleTypingEvent = useCallback((senderUuid, senderProfile, isTyping) => {
    if (channelRef.current && channelRef.current.uuid === senderUuid) return;

    if (isTyping) {
      setTypingUsers((prev) => ({ ...prev, [senderUuid]: senderProfile }));

      // Auto-clear after 3 s as a safety net
      if (typingTimeoutsRef.current[senderUuid]) {
        clearTimeout(typingTimeoutsRef.current[senderUuid]);
      }
      typingTimeoutsRef.current[senderUuid] = setTimeout(() => {
        removeTypingUser(senderUuid);
      }, 3000);
    } else {
      removeTypingUser(senderUuid);
    }
  }, [removeTypingUser]);

  // Use mutable refs for handlers to prevent callback changes from triggering re-connections
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const onReactionRef = useRef(onReaction);
  useEffect(() => {
    onReactionRef.current = onReaction;
  }, [onReaction]);

  const handleTypingEventRef = useRef(handleTypingEvent);
  useEffect(() => {
    handleTypingEventRef.current = handleTypingEvent;
  }, [handleTypingEvent]);

  useEffect(() => {
    if (!profile?.username || !roomId) return;

    let isSubscribed = true;
    setConnectionStatus('reconnecting');

    // Init SDK with username and email
    pieSocketService.init(profile.username, profile.email || '');

    // Subscribe to plain room name: e.g. "general-lounge"
    pieSocketService
      .subscribe(roomId)
      .then((channel) => {
        if (!isSubscribed) {
          pieSocketService.unsubscribe(roomId);
          return;
        }

        channelRef.current = channel;
        setConnectionStatus('connected');

        /* ── Lifecycle callbacks ─────────────────────────────────── */
        channel.on('error', () => {
          if (isSubscribed) setConnectionStatus('offline');
        });

        channel.on('close', () => {
          if (isSubscribed) setConnectionStatus('reconnecting');
        });

        /* ── Presence: sync member list ──────────────────────────── */
        const syncMembers = () => {
          if (!channel.members) return;
          const decoded = channel.members.map(parseMember);
          setOnlineMembers(decoded);
        };

        channel.listen('system:member_list', syncMembers);

        channel.listen('system:member_joined', (data) => {
          syncMembers();
          if (data.member && data.member.uuid !== channel.uuid) {
            const m = parseMember(data.member);
            toast.success(`${m.username} joined`, {
              duration: 2000,
              icon: '👋',
              style: { borderRadius: '12px', background: '#333', color: '#fff' },
            });
          }
        });

        channel.listen('system:member_left', (data) => {
          syncMembers();
          if (data.member) {
            removeTypingUser(data.member.uuid);
            const m = parseMember(data.member);
            toast(`${m.username} left`, {
              duration: 2000,
              icon: '🚪',
              style: { borderRadius: '12px', background: '#333', color: '#fff' },
            });
          }
        });

        /* ── Chat events ─────────────────────────────────────────── */
        channel.listen('new_message', (data, meta) => {
          // Play sound for others' messages only
          if (channel.uuid !== (meta && meta.from)) {
            playNotificationSound();
          }
          if (onMessageRef.current) {
            onMessageRef.current({
              id: data.id,
              sender: data.sender,
              avatarColor: data.avatarColor,
              text: data.text,
              timestamp: data.timestamp,
              roomId,
            });
          }
        });

        /* ── Reaction events ─────────────────────────────────────── */
        channel.listen('message_reaction', (data, meta) => {
          if (onReactionRef.current) {
            onReactionRef.current(data);
          }
        });

        /* ── Typing events ───────────────────────────────────────── */
        channel.listen('typing_start', (data, meta) => {
          if (handleTypingEventRef.current) {
            handleTypingEventRef.current(
              meta && meta.from,
              { username: data.username, avatarColor: data.avatarColor },
              true
            );
          }
        });

        channel.listen('typing_stop', (data, meta) => {
          if (handleTypingEventRef.current) {
            handleTypingEventRef.current(meta && meta.from, null, false);
          }
        });

        // Trigger initial member sync
        syncMembers();
      })
      .catch((err) => {
        console.error('PieSocket subscription error:', err);
        if (isSubscribed) setConnectionStatus('offline');
        toast.error('Failed to connect. Retrying...');
      });

    return () => {
      isSubscribed = false;
      Object.keys(typingTimeoutsRef.current).forEach((uuid) => {
        clearTimeout(typingTimeoutsRef.current[uuid]);
      });
      typingTimeoutsRef.current = {};
      pieSocketService.unsubscribe(roomId);
      channelRef.current = null;
      setConnectionStatus('offline');
      setOnlineMembers([]);
      setTypingUsers({});
    };
  }, [roomId, profile?.username, profile?.email, removeTypingUser]);



  /* ── Publish helper ──────────────────────────────────────────── */
  const publish = useCallback((event, data) => {
    if (channelRef.current && connectionStatus === 'connected') {
      channelRef.current.publish(event, data).catch((err) => {
        console.error(`Publish error [${event}]:`, err);
        toast.error('Failed to send. Check your connection.');
      });
    } else {
      toast.error('Socket is offline. Cannot send.');
    }
  }, [connectionStatus]);

  return {
    channel: channelRef.current,
    connectionStatus,
    onlineMembers,
    typingUsers: Object.values(typingUsers),
    publish,
  };
}

import { format, isToday, isYesterday } from 'date-fns';

/**
 * Extracts initials from a username (up to 2 characters).
 * @param {string} username 
 * @returns {string}
 */
export const getInitials = (username) => {
  if (!username) return '??';
  const parts = username.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
};

/**
 * Formats a message timestamp into a human-readable string.
 * @param {Date|number|string} timestamp 
 * @returns {string}
 */
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'h:mm a')}`;
  }
  return format(date, 'MMM d, h:mm a');
};

/**
 * Generates a random alphanumeric ID.
 * @returns {string}
 */
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Plays a polite notification chime using the Web Audio API.
 * Bypasses need for external static assets.
 */
export const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    
    // Play a dual-tone gentle notification beep
    const playTone = (freq, startTime, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0.06, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    
    const now = audioCtx.currentTime;
    // Pleasant high-quality alert (E5 then A5 note)
    playTone(659.25, now, 0.15);
    playTone(880.00, now + 0.08, 0.25);
  } catch (err) {
    console.warn('Unable to play notification sound', err);
  }
};

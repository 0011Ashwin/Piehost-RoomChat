import { useState, useRef, useEffect } from 'react';

/**
 * Custom hook to track local user typing status and dispatch start/stop typing events.
 * @param {Function} onStartTyping - Callback triggered when typing starts
 * @param {Function} onStopTyping - Callback triggered when typing stops after inactivity
 * @param {number} delay - Debounce duration in milliseconds (default 700ms)
 * @returns {object} { handleKeyPress, resetTyping }
 */
export function useTyping(onStartTyping, onStopTyping, delay = 700) {
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef(null);

  // Call this function on keydown / inputs
  const handleKeyPress = () => {
    if (!isTyping) {
      setIsTyping(true);
      if (onStartTyping) onStartTyping();
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to detect when user stops typing
    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (onStopTyping) onStopTyping();
    }, delay);
  };

  // Reset typing state immediately (e.g. when message is sent)
  const resetTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (onStopTyping) onStopTyping();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isTyping]);

  return { handleKeyPress, resetTyping };
}

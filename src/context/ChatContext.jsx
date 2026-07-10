/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePieSocket } from '../hooks/usePieSocket';
import { DEFAULT_ROOMS, LOCAL_STORAGE_KEYS } from '../utils/constants';
import { generateId } from '../utils/helpers';
import toast from 'react-hot-toast';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  // 1. Profile state
  const [profile, setProfile] = useLocalStorage(LOCAL_STORAGE_KEYS.PROFILE, null);

  // 2. Theme state (light / dark / system)
  const [theme, setTheme] = useLocalStorage(LOCAL_STORAGE_KEYS.THEME, 'system');

  // 3. Active room state
  const [lastRoomId, setLastRoomId] = useLocalStorage(LOCAL_STORAGE_KEYS.LAST_ROOM, 'general-lounge');
  const [activeRoomId, setActiveRoomId] = useState(lastRoomId);
  const activeRoom = DEFAULT_ROOMS.find((r) => r.id === activeRoomId) || DEFAULT_ROOMS[0];

  // 4. Messages state (persisted per room in local storage)
  const [roomMessages, setRoomMessages] = useLocalStorage('piechat_messages_history', {});

  // Get messages for current room
  const currentRoomMessages = roomMessages[activeRoomId] || [];

  // Theme synchronization with DOM
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Handler for incoming messages from PieSocket hook
  const handleIncomingMessage = useCallback((msg) => {
    setRoomMessages((prevHistory) => {
      const historyForRoom = prevHistory[msg.roomId] || [];
      // Prevent duplicate messages
      if (historyForRoom.some((m) => m.id === msg.id)) {
        return prevHistory;
      }
      return {
        ...prevHistory,
        [msg.roomId]: [...historyForRoom, { ...msg, reactions: {} }],
      };
    });
  }, [setRoomMessages]);

  // Handler for incoming reactions
  const handleIncomingReaction = useCallback((reaction) => {
    setRoomMessages((prevHistory) => {
      const historyForRoom = prevHistory[reaction.roomId] || [];
      const updatedHistory = historyForRoom.map((msg) => {
        if (msg.id === reaction.messageId) {
          const currentReactions = msg.reactions || {};
          const usersForEmoji = currentReactions[reaction.emoji] || [];
          
          let newUsers;
          if (usersForEmoji.includes(reaction.username)) {
            // Toggle off
            newUsers = usersForEmoji.filter((u) => u !== reaction.username);
          } else {
            // Toggle on
            newUsers = [...usersForEmoji, reaction.username];
          }

          return {
            ...msg,
            reactions: {
              ...currentReactions,
              [reaction.emoji]: newUsers,
            },
          };
        }
        return msg;
      });

      return {
        ...prevHistory,
        [reaction.roomId]: updatedHistory,
      };
    });
  }, [setRoomMessages]);

  // Connect to PieSocket for the active room
  const {
    channel,
    connectionStatus,
    onlineMembers,
    typingUsers,
    publish,
  } = usePieSocket(
    profile ? activeRoomId : null, // Only connect if profile exists
    profile,
    {
      onMessage: handleIncomingMessage,
      onReaction: handleIncomingReaction,
    }
  );

  // Send message action
  const sendMessage = useCallback((text) => {
    if (!profile) return;
    
    const messagePayload = {
      id: generateId(),
      sender: profile.username,
      avatarColor: profile.avatarColor,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    publish('new_message', messagePayload);
  }, [profile, publish]);

  // Send reaction action
  const sendReaction = useCallback((messageId, emoji) => {
    if (!profile) return;
    const payload = {
      messageId,
      emoji,
      username: profile.username,
      roomId: activeRoomId,
    };
    publish('message_reaction', payload);
    // Optimistic update
    handleIncomingReaction(payload);
  }, [profile, publish, activeRoomId, handleIncomingReaction]);

  // Send typing start notification
  const sendTypingStart = useCallback(() => {
    if (!profile) return;
    publish('typing_start', {
      username: profile.username,
      avatarColor: profile.avatarColor,
    });
  }, [profile, publish]);

  // Send typing stop notification
  const sendTypingStop = useCallback(() => {
    if (!profile) return;
    publish('typing_stop', {
      username: profile.username,
    });
  }, [profile, publish]);

  // Switch rooms
  const changeRoom = useCallback((roomId) => {
    setActiveRoomId(roomId);
    setLastRoomId(roomId);
  }, [setLastRoomId]);

  // Clear chat history for the active room
  const clearCurrentMessages = useCallback(() => {
    setRoomMessages((prev) => ({
      ...prev,
      [activeRoomId]: [],
    }));
    toast.success('Chat history cleared', {
      style: {
        borderRadius: '12px',
        background: '#333',
        color: '#fff',
      },
    });
  }, [activeRoomId, setRoomMessages]);

  // Removed unused getRoomUnreadCount

  const value = {
    profile,
    setProfile,
    theme,
    setTheme,
    activeRoom,
    changeRoom,
    messages: currentRoomMessages,
    sendMessage,
    sendReaction,
    sendTypingStart,
    sendTypingStop,
    clearCurrentMessages,
    onlineUsers: onlineMembers,
    typingUsers,
    connectionStatus,
    rooms: DEFAULT_ROOMS,
    channel,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { MessageSquareOff, SearchCode } from 'lucide-react';

/**
 * Message history feed with auto-scrolling and search filtering.
 * @param {Array} messages - Message array
 * @param {object} currentUser - Local profile object
 * @param {string} searchQuery - Message text/sender search filter
 */
export default function MessageList({ messages = [], currentUser, searchQuery = '' }) {
  const listEndRef = useRef(null);

  // Filter messages based on search query
  const filteredMessages = messages.filter((msg) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      msg.text.toLowerCase().includes(query) ||
      msg.sender.toLowerCase().includes(query)
    );
  });

  // Auto scroll to bottom
  const scrollToBottom = (behavior = 'smooth') => {
    listEndRef.current?.scrollIntoView({ behavior });
  };

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

  // Scroll instantly on search term changes to show results
  useEffect(() => {
    scrollToBottom('auto');
  }, [searchQuery]);

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
      {filteredMessages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3 select-none">
          {searchQuery ? (
            <>
              <SearchCode className="w-12 h-12 stroke-[1.5]" />
              <div className="text-center">
                <p className="font-semibold text-sm">No matches found</p>
                <p className="text-xs mt-1">Try searching for something else</p>
              </div>
            </>
          ) : (
            <>
              <MessageSquareOff className="w-12 h-12 stroke-[1.5]" />
              <div className="text-center">
                <p className="font-semibold text-sm font-display">No messages yet</p>
                <p className="text-xs mt-1">Be the first to say hi!</p>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {filteredMessages.map((msg) => {
            const isMe = msg.sender === currentUser?.username;
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMe={isMe}
              />
            );
          })}
          {/* Scroll Target anchor */}
          <div ref={listEndRef} />
        </>
      )}
    </div>
  );
}

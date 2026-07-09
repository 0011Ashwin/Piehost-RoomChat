import React from 'react';

/**
 * WhatsApp-style Typing indicator.
 * @param {Array} typingUsers - Array of user profiles currently typing [{ username, avatarColor }]
 */
export default function TypingIndicator({ typingUsers = [] }) {
  if (typingUsers.length === 0) return null;

  let text = '';
  if (typingUsers.length === 1) {
    text = `${typingUsers[0].username} is typing`;
  } else if (typingUsers.length === 2) {
    text = `${typingUsers[0].username} and ${typingUsers[1].username} are typing`;
  } else {
    text = 'Several people are typing';
  }

  return (
    <div className="flex items-center gap-2.5 px-5 py-2 text-xs text-slate-400 dark:text-slate-500 font-medium font-display select-none">
      {/* 3 bouncing dots */}
      <div className="flex gap-1 items-center shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 typing-dot" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 typing-dot" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 typing-dot" />
      </div>
      <span>{text}</span>
    </div>
  );
}

import React, { useState } from 'react';
import Avatar from '../Common/Avatar';
import { formatMessageTime } from '../../utils/helpers';
import { Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Message bubble with slide-up animations and copy-to-clipboard utilities.
 * @param {object} message - Message object { id, sender, text, timestamp, avatarColor }
 * @param {boolean} isMe - True if the message was sent by the local user
 */
export default function MessageBubble({ message, isMe }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex gap-3 max-w-[85%] sm:max-w-[75%] group ${
        isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
      }`}
    >
      {/* Sender Avatar */}
      <Avatar
        username={message.sender}
        avatarColor={message.avatarColor}
        size="sm"
      />

      {/* Message Info Column */}
      <div className={`flex flex-col gap-1 min-w-0 ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Author Header */}
        <div className="flex items-center gap-2 px-1 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {message.sender}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            {formatMessageTime(message.timestamp)}
          </span>
        </div>

        {/* Text Area bubble container */}
        <div className="relative group/bubble flex items-center">
          <div
            className={`px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words leading-relaxed select-text ${
              isMe
                ? 'bg-gradient-to-tr from-brand-600 to-purple-600 text-white rounded-tr-xs shadow-sm shadow-brand-500/10'
                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-tl-xs'
            }`}
          >
            {message.text}
          </div>

          {/* Copy Message Overlay Button */}
          <button
            onClick={handleCopy}
            className={`absolute top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-150 dark:border-slate-650 shadow-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover/bubble:opacity-100 focus:opacity-100 transition-all duration-150 cursor-pointer ${
              isMe ? 'right-full mr-2' : 'left-full ml-2'
            }`}
            title="Copy message"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

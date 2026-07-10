import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import Avatar from '../Common/Avatar';
import { formatMessageTime } from '../../utils/helpers';
import { Copy, Check, SmilePlus } from 'lucide-react';
import { motion } from 'framer-motion';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '😮'];

/**
 * Message bubble with slide-up animations and copy-to-clipboard utilities.
 * @param {object} message - Message object { id, sender, text, timestamp, avatarColor }
 * @param {boolean} isMe - True if the message was sent by the local user
 */
export default function MessageBubble({ message, isMe }) {
  const [copied, setCopied] = useState(false);
  const { sendReaction, profile } = useChat();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleReact = (emoji) => {
    sendReaction(message.id, emoji);
  };

  const renderTextWithEmbeds = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    const matches = text.match(urlRegex) || [];
    
    const content = [];
    let matchIndex = 0;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (urlRegex.test(part) || matches.includes(part)) {
        const url = matches[matchIndex++];
        
        // YouTube Embed
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        if (ytMatch) {
          content.push(
            <div key={i} className="mt-2 w-full overflow-hidden rounded-xl shadow-sm border border-black/5 dark:border-white/5">
              <iframe
                width="100%"
                height="200"
                src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        } 
        // Image Embed
        else if (url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i)) {
          content.push(
            <div key={i} className="mt-2 block">
              <img src={url} alt="Embed" className="max-w-full rounded-xl max-h-64 object-cover shadow-sm cursor-pointer hover:opacity-90 transition-opacity border border-black/5 dark:border-white/5" onClick={() => window.open(url, '_blank')} />
            </div>
          );
        } 
        // Normal Link
        else {
          content.push(
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 opacity-90 hover:opacity-100 transition-opacity">
              {url}
            </a>
          );
        }
      } else if (part) {
        content.push(<span key={i}>{part}</span>);
      }
    }
    return content;
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
            className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words leading-relaxed select-text ${
              isMe
                ? 'bg-gradient-to-tr from-brand-600 to-purple-600 text-white rounded-tr-xs shadow-sm shadow-brand-500/10'
                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-tl-xs'
            }`}
          >
            {renderTextWithEmbeds(message.text)}
          </div>

          {/* Action Menu Overlay */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 focus-within:opacity-100 transition-all duration-150 ${
              isMe ? 'right-full mr-2 flex-row-reverse' : 'left-full ml-2'
            }`}
          >
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-150 dark:border-slate-650 shadow-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Copy message"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            
            <div className="group/react relative">
              <button
                className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-150 dark:border-slate-650 shadow-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Add Reaction"
              >
                <SmilePlus className="w-3.5 h-3.5" />
              </button>
              
              <div className={`absolute top-full mt-1 ${isMe ? 'right-0' : 'left-0'} hidden group-hover/react:flex items-center gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-xl border border-slate-150 dark:border-slate-700 z-10`}>
                {QUICK_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-base cursor-pointer hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reaction Badges */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className={`flex flex-wrap items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(message.reactions).map(([emoji, users]) => {
              if (!users || users.length === 0) return null;
              const hasReacted = profile && users.includes(profile.username);
              return (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                    hasReacted 
                      ? 'bg-brand-50 border-brand-200 text-brand-600 dark:bg-brand-500/20 dark:border-brand-500/30 dark:text-brand-300' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/50'
                  }`}
                  title={users.join(', ')}
                >
                  <span className="text-sm">{emoji}</span>
                  <span>{users.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

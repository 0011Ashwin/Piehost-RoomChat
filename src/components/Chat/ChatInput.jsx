import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import { useTyping } from '../../hooks/useTyping';

const POPULAR_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃',
  '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔',
  '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤',
  '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
  '🤗', '🤔', '🫣', '🤭', '🫢', '🫣', '🤫', '🤥', '😶', '😐', '😑', '😬',
  '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '😵‍💫',
  '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿',
  '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺',
  '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐️', '✋',
  '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉',
  '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌',
  '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶',
  '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄',
  '💋', '🩸', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💬',
  '🔥', '✨', '🎉', '🚀', '💡', '💯', '⭐', '🎈', '🎁', '🔔', '📢', '📌'
];

/**
 * Message text box with keyboard shortcuts, emoji panel, and typing indicators.
 * @param {Function} onSendMessage - Function to send a text message
 * @param {Function} onTypingStart - Callback when typing starts
 * @param {Function} onTypingStop - Callback when typing stops
 * @param {boolean} disabled - True when socket is disconnected
 */
export default function ChatInput({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
}) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const textareaRef = useRef(null);
  const emojiBtnRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Initialize typing detection hook
  const { handleKeyPress, resetTyping } = useTyping(onTypingStart, onTypingStop, 700);

  // Adjust textarea height dynamically to fit content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  // Click outside listener for emoji picker closure
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target) &&
        emojiBtnRef.current && 
        !emojiBtnRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextChange = (e) => {
    setText(e.target.value);
    handleKeyPress(); // Trigger typing status
  };

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSendMessage(text);
    setText('');
    resetTyping(); // Stop typing immediately on send
    
    // Focus back on text area
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    // Enter sends message, Shift+Enter adds new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emoji) => {
    const cursor = textareaRef.current?.selectionStart || 0;
    const newText = text.slice(0, cursor) + emoji + text.slice(cursor);
    setText(newText);
    
    // Position cursor after inserted emoji (after React re-renders)
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = cursor + emoji.length;
        textareaRef.current.focus();
      }
    }, 0);
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 relative flex flex-col gap-2">
      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full left-4 mb-2 w-72 h-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-20 flex flex-col overflow-hidden"
        >
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-display">
              Emojis
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2.5 grid grid-cols-8 gap-1.5 justify-items-center">
            {POPULAR_EMOJIS.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(emoji)}
                className="text-lg hover:scale-125 transition-transform p-0.5 cursor-pointer rounded hover:bg-slate-100 dark:hover:bg-slate-700 select-none"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Row */}
      <div className="flex items-end gap-2.5 max-w-full">
        {/* Emoji Button */}
        <button
          ref={emojiBtnRef}
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={disabled}
          className="p-2.5 rounded-xl text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-all cursor-pointer disabled:opacity-50 shrink-0"
          title="Insert Emoji"
        >
          <Smile className="w-5.5 h-5.5" />
        </button>

        {/* Input Field */}
        <div className="flex-1 relative bg-slate-100 dark:bg-slate-850 rounded-2xl border border-transparent focus-within:border-brand-500/35 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all min-w-0">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={disabled ? 'Connecting to server...' : 'Type a message...'}
            className="w-full bg-transparent border-0 outline-none resize-none py-3 px-4 text-sm max-h-[120px] text-slate-850 dark:text-slate-150 leading-relaxed placeholder-slate-400"
            style={{ minHeight: '44px' }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 text-white shadow-sm hover:shadow hover:from-brand-500 hover:to-purple-500 disabled:from-slate-200 disabled:to-slate-200 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:shadow-none transition-all cursor-pointer shrink-0 active:scale-95 flex items-center justify-center"
          title="Send Message"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
}

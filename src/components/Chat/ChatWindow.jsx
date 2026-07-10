import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';
import WhiteboardModal from './WhiteboardModal';
import { Menu, Search, X, Trash2, Hash, Palette } from 'lucide-react';

/**
 * Chat window container.
 * @param {Function} onToggleSidebar - Triggered by mobile drawer menu button
 */
export default function ChatWindow({ onToggleSidebar }) {
  const {
    activeRoom,
    messages,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    clearCurrentMessages,
    typingUsers,
    connectionStatus,
    profile,
    channel,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);

  const handleSearchToggle = () => {
    if (showSearch) {
      setSearchQuery('');
    }
    setShowSearch(!showSearch);
  };

  const isDisconnected = connectionStatus === 'offline';

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 relative min-w-0">
      {/* Header */}
      <header className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10 select-none">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Hamburguer Menu */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Open navigation"
          >
            <Menu className="w-5.5 h-5.5" />
          </button>

          {/* Channel Name */}
          <div className="flex items-center gap-1.5 min-w-0">
            <Hash className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-850 dark:text-slate-100 truncate font-display">
                {activeRoom.name}
              </h2>
              <p className="hidden sm:block text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {activeRoom.description}
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1">
          {/* Expanded Search Bar */}
          {showSearch && (
            <div className="relative flex items-center bg-slate-100 dark:bg-slate-850 border border-transparent focus-within:border-brand-500/20 rounded-xl px-2.5 py-1 w-40 sm:w-64 transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-1.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="bg-transparent text-xs border-0 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 w-full"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Search Toggle Icon */}
          <button
            onClick={handleSearchToggle}
            className={`p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
              showSearch ? 'bg-slate-100 dark:bg-slate-800' : ''
            }`}
            title="Search messages"
          >
            {showSearch ? <X className="w-5.5 h-5.5" /> : <Search className="w-5.5 h-5.5" />}
          </button>

          {/* Whiteboard Toggle */}
          <button
            onClick={() => setShowWhiteboard(true)}
            className="p-2 rounded-xl text-brand-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/20 cursor-pointer transition-colors"
            title="Shared Whiteboard"
          >
            <Palette className="w-5.5 h-5.5" />
          </button>

          {/* Clear Chat Button */}
          {messages.length > 0 && (
            <button
              onClick={clearCurrentMessages}
              className="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
              title="Clear channel history"
            >
              <Trash2 className="w-5.5 h-5.5" />
            </button>
          )}
        </div>
      </header>

      {/* Connection Offline Banner */}
      {isDisconnected && (
        <div className="bg-rose-550 text-white px-4 py-2 text-xs font-semibold text-center animate-pulse flex items-center justify-center gap-2 select-none z-10 shrink-0">
          <span>⚠️ Socket Disconnected. Trying to restore connection...</span>
        </div>
      )}

      {/* Messages Feed */}
      <MessageList
        messages={messages}
        currentUser={profile}
        searchQuery={searchQuery}
      />

      {/* Typing indicators */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Input panel */}
      <ChatInput
        onSendMessage={sendMessage}
        onTypingStart={sendTypingStart}
        onTypingStop={sendTypingStop}
        disabled={isDisconnected}
      />

      {/* Shared Whiteboard Modal */}
      {showWhiteboard && (
        <WhiteboardModal
          channel={channel}
          onClose={() => setShowWhiteboard(false)}
        />
      )}
    </div>
  );
}

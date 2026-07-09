import React from 'react';
import { useChat } from '../../context/ChatContext';
import ChannelList from './ChannelList';
import OnlineUsers from './OnlineUsers';
import Avatar from '../Common/Avatar';
import { Settings, MessageSquare, ShieldAlert, Radio } from 'lucide-react';

/**
 * Sidebar container component.
 * @param {Function} onOpenSettings - Function to open settings modal
 * @param {Function} onCloseDrawer - Mobile drawer closure callback
 */
export default function Sidebar({ onOpenSettings, onCloseDrawer }) {
  const {
    profile,
    rooms,
    activeRoom,
    changeRoom,
    onlineUsers,
    connectionStatus,
  } = useChat();

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected
          </span>
        );
      case 'reconnecting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Reconnecting
          </span>
        );
      case 'offline':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Offline
          </span>
        );
    }
  };

  return (
    <aside className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-purple-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/25">
            <Radio className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight">
            PieChat Room
          </span>
        </div>
      </div>

      {/* Connection Indicator Section */}
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/50 shrink-0 flex items-center justify-between">
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Socket Connection</span>
        {getStatusBadge()}
      </div>

      {/* Main Navigation (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {/* Room Navigation */}
        <ChannelList
          rooms={rooms}
          activeRoom={activeRoom}
          onChangeRoom={changeRoom}
          onCloseDrawer={onCloseDrawer}
        />

        {/* Separator */}
        <div className="h-px bg-slate-200 dark:bg-slate-800 mx-3" />

        {/* Member Directory */}
        <OnlineUsers users={onlineUsers} currentUser={profile} />
      </div>

      {/* Profile Card Footer */}
      {profile && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                username={profile.username}
                avatarColor={profile.avatarColor}
                size="md"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {profile.username}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  {profile.email}
                </p>
              </div>
            </div>
            
            {/* Settings trigger */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer focus:outline-none transition-all"
              title="Edit Profile & Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

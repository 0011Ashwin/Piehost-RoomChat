import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import Modal from '../components/Common/Modal';
import Button from '../components/Common/Button';
import Avatar from '../components/Common/Avatar';
import { AVATAR_COLORS } from '../utils/constants';
import { Sun, Moon, Laptop, User, LogOut, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatRoom() {
  const {
    profile,
    setProfile,
    theme,
    setTheme,
  } = useChat();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Settings form temporary states
  const [tempUsername, setTempUsername] = useState('');
  const [tempAvatarColor, setTempAvatarColor] = useState('');

  // Sync settings inputs when opening settings modal
  useEffect(() => {
    if (profile) {
      setTempUsername(profile.username);
      setTempAvatarColor(profile.avatarColor);
    }
  }, [profile, isSettingsOpen]);

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    if (!tempUsername.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    setProfile({
      ...profile,
      username: tempUsername.trim(),
      avatarColor: tempAvatarColor,
    });
    setIsSettingsOpen(false);
    toast.success('Settings updated');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out? This deletes your local profile settings.')) {
      setProfile(null);
      setIsSettingsOpen(false);
      toast.success('Logged out');
    }
  };

  return (
    <div className="flex w-full h-full overflow-hidden bg-slate-50 dark:bg-slate-950 relative">
      {/* 1. Desktop Sidebar (Lg screens only) */}
      <div className="hidden lg:block w-72 h-full shrink-0">
        <Sidebar onOpenSettings={handleOpenSettings} />
      </div>

      {/* 2. Mobile/Tablet Drawer Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />
          {/* Slide-out Panel */}
          <div className="relative w-72 max-w-[80vw] h-full z-10 shadow-2xl bg-white dark:bg-slate-900 transition-transform">
            <Sidebar
              onOpenSettings={handleOpenSettings}
              onCloseDrawer={() => setIsSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 3. Main Chat Viewport */}
      <ChatWindow onToggleSidebar={() => setIsSidebarOpen(true)} />

      {/* 4. Profile & Preferences Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Settings & Preferences"
        footer={
          <div className="flex w-full justify-between items-center">
            {/* Delete Account / Logout */}
            <Button
              variant="ghost"
              onClick={handleLogout}
              icon={LogOut}
              className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            >
              Sign Out
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveSettings}>
                Save Changes
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Avatar live preview */}
          <div className="flex flex-col items-center gap-2 py-2">
            <Avatar
              username={tempUsername || 'A'}
              avatarColor={tempAvatarColor}
              size="lg"
            />
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-display">
              Avatar Preview
            </span>
          </div>

          {/* Edit Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display">
              Username
            </label>
            <div className="relative flex items-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-2.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all">
              <User className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                type="text"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                maxLength={20}
                required
                className="bg-transparent text-sm outline-none text-slate-850 dark:text-slate-100 placeholder-slate-400 w-full"
              />
            </div>
          </div>

          {/* Edit Avatar Theme */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display">
              Avatar Background Theme
            </label>
            <div className="flex flex-wrap gap-2 justify-center py-1">
              {AVATAR_COLORS.map((color) => {
                const isSelected = tempAvatarColor === color.value;
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setTempAvatarColor(color.value)}
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
                      color.value
                    } transition-all duration-150 relative shrink-0 cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-slate-900 scale-105 shadow-md shadow-brand-500/25'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    title={color.name}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 m-auto w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edit Display Theme */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display">
              Display Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', name: 'Light', icon: Sun },
                { id: 'dark', name: 'Dark', icon: Moon },
                { id: 'system', name: 'System', icon: Laptop },
              ].map((item) => {
                const isSelected = theme === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTheme(item.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer font-display text-xs font-semibold ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/5 text-brand-600 dark:border-brand-400 dark:bg-brand-400/5 dark:text-brand-400'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

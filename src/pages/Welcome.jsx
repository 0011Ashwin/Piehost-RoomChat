import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { AVATAR_COLORS } from '../utils/constants';
import Button from '../components/Common/Button';
import Avatar from '../components/Common/Avatar';
import { Radio, ArrowRight, UserCheck, User } from 'lucide-react';
import toast from 'react-hot-toast';
import PieSocket from 'piesocket-js';

export default function Welcome() {
  const { profile, setProfile } = useChat();

  // Form states
  const [username, setUsername] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0].value);
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Helper to check if username already exists in PieSocket presence
  const checkAvailability = (targetUsername) => {
    return new Promise((resolve) => {
      const apiKey = import.meta.env.VITE_PIESOCKET_API_KEY || '';
      const clusterId = import.meta.env.VITE_PIESOCKET_CLUSTER_ID || 'demo';

      // Use a random temp user ID to avoid colliding with ourselves during the presence check
      const tempUserId = JSON.stringify({
        username: `system_check_${Math.random().toString(36).substring(2, 9)}`,
      });

      let resolved = false;
      let tempClient = null;

      const cleanup = () => {
        if (tempClient) {
          try {
            tempClient.unsubscribe('general-lounge');
          } catch (e) {
            console.error('Error during cleanup:', e);
          }
        }
      };

      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve({ available: true });
        }
      }, 3000); // 3 seconds fallback safety net

      try {
        tempClient = new PieSocket({
          apiKey,
          clusterId,
          notifySelf: true,
          presence: true,
          userId: tempUserId,
        });

        tempClient.subscribe('general-lounge').then((channel) => {
          channel.listen('system:member_list', () => {
            if (resolved) return;
            resolved = true;
            clearTimeout(timeoutId);
            cleanup();

            const membersList = channel.members || [];
            const duplicate = membersList.find((m) => {
              try {
                const data = JSON.parse(m.user);
                return data.username?.toLowerCase() === targetUsername.toLowerCase();
              } catch (_e) {
                // Fallback for plain-text usernames
                return m.user?.toLowerCase() === targetUsername.toLowerCase();
              }
            });

            if (duplicate) {
              resolve({ available: false, reason: 'Username is already active in the chatroom.' });
            } else {
              resolve({ available: true });
            }
          });
        }).catch((_err) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            cleanup();
            resolve({ available: true }); // Proceed on subscription errors
          }
        });
      } catch (_err) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          cleanup();
          resolve({ available: true });
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    setIsChecking(true);
    const checkToastId = toast.loading('Verifying identity availability...');

    const res = await checkAvailability(username.trim());

    toast.dismiss(checkToastId);
    setIsChecking(false);

    if (!res.available) {
      toast.error(res.reason, { duration: 4000 });
      return;
    }

    const newProfile = {
      username: username.trim(),
      avatarColor: selectedColor,
    };

    setProfile(newProfile);
    toast.success(`Welcome, ${newProfile.username}!`);
  };

  const handleContinue = async () => {
    if (!profile) return;

    setIsChecking(true);
    const checkToastId = toast.loading('Verifying session availability...');

    const res = await checkAvailability(profile.username);

    toast.dismiss(checkToastId);
    setIsChecking(false);

    if (!res.available) {
      toast.error(res.reason, { duration: 4000 });
      return;
    }

    toast.success(`Continuing as ${profile.username}`);
    setProfile({ ...profile });
  };


  const handleUseAnother = () => {
    setIsNewAccount(true);
  };

  // Show "Continue as..." screen if profile exists and user hasn't opted to create a new one
  if (profile && !isNewAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 select-none">
        {/* Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-brand-500/10 blur-[120px] dark:bg-brand-500/5" />
          <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-purple-500/10 blur-[120px] dark:bg-purple-500/5" />
        </div>

        {/* Card Container */}
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-8 relative flex flex-col items-center text-center">
          {/* Logo */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-brand-500/25 mb-6">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>

          <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100 tracking-tight">
            Welcome back!
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 mb-8">
            You're signed in locally on this browser.
          </p>

          {/* User Profile Info Card */}
          <div className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 mb-8 flex flex-col items-center gap-4">
            <Avatar username={profile.username} avatarColor={profile.avatarColor} size="xl" />
            <div>
              <h2 className="font-display font-bold text-xl text-slate-800 dark:text-slate-100">
                {profile.username}
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3">
            <Button
              onClick={handleContinue}
              icon={UserCheck}
              size="lg"
              className="w-full"
              disabled={isChecking}
            >
              {isChecking ? 'Verifying...' : `Continue as ${profile.username}`}
            </Button>
            <button
              onClick={handleUseAnother}
              disabled={isChecking}
              className="text-xs font-semibold text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors py-1 cursor-pointer focus:outline-none disabled:opacity-50"
            >
              Use another account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show "Create Profile" onboarding screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-brand-500/10 blur-[120px] dark:bg-brand-500/5" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-purple-500/10 blur-[120px] dark:bg-purple-500/5" />
      </div>

      {/* Card Container */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-8 relative flex flex-col items-center">
        {/* Logo */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-brand-500/25 mb-6">
          <Radio className="w-6 h-6" />
        </div>

        <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100 tracking-tight text-center">
          Join PieChat Room
        </h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 mb-8 text-center">
          Configure a local chat identity. No registration or password required.
        </p>

        {/* Avatar Live Preview */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <Avatar
            username={username || 'A'}
            avatarColor={selectedColor}
            size="lg"
          />
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Live Preview
          </span>
        </div>

        {/* Onboarding Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display">
              Username
            </label>
            <div className="relative flex items-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl px-3.5 py-2.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all">
              <User className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Ashwin"
                maxLength={20}
                required
                disabled={isChecking}
                className="bg-transparent text-sm outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 w-full disabled:opacity-50"
              />
            </div>
          </div>

          {/* Avatar Color Choices */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display">
              Choose Avatar Theme
            </label>
            <div className="flex flex-wrap gap-2 justify-center py-1">
              {AVATAR_COLORS.map((color) => {
                const isSelected = selectedColor === color.value;
                return (
                  <button
                    key={color.name}
                    type="button"
                    disabled={isChecking}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
                      color.value
                    } transition-all duration-150 relative shrink-0 cursor-pointer disabled:opacity-50 ${
                      isSelected
                        ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-slate-900 scale-105 shadow-md shadow-brand-500/25'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    title={color.name}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 m-auto w-1.5 h-1.5 bg-white rounded-full shadow" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex flex-col gap-3">
            <Button
              type="submit"
              icon={ArrowRight}
              size="lg"
              className="w-full flex-row-reverse"
              disabled={isChecking}
            >
              {isChecking ? 'Verifying...' : 'Enter Chatroom'}
            </Button>
            
            {profile && (
              <button
                type="button"
                onClick={() => setIsNewAccount(false)}
                disabled={isChecking}
                className="text-xs font-semibold text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors py-1 cursor-pointer focus:outline-none disabled:opacity-50"
              >
                Go back to saved profile
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}

import React from 'react';
import { getInitials } from '../../utils/helpers';

/**
 * Reusable Avatar Component.
 * @param {string} username - User's name
 * @param {string} avatarColor - Tailwind gradient class (e.g. 'from-purple-500 to-indigo-600')
 * @param {'sm'|'md'|'lg'|'xl'} size - Avatar size
 * @param {boolean} isOnline - Show active green dot
 * @param {boolean} showIndicator - Toggle the online indicator badge
 */
export default function Avatar({
  username,
  avatarColor,
  size = 'md',
  isOnline = false,
  showIndicator = false,
}) {
  const initials = getInitials(username);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-14 h-14 text-lg font-semibold',
    xl: 'w-20 h-20 text-2xl font-bold',
  };

  const indicatorSizes = {
    sm: 'w-2.5 h-2.5 border-1.5',
    md: 'w-3 h-3 border-2',
    lg: 'w-4 h-4 border-2',
    xl: 'w-5 h-5 border-3',
  };

  return (
    <div className="relative inline-flex items-center justify-center shrink-0 select-none">
      <div
        className={`rounded-xl bg-gradient-to-br ${avatarColor || 'from-violet-500 to-purple-600'} text-white flex items-center justify-center shadow-sm uppercase ${sizeClasses[size]}`}
      >
        {initials}
      </div>
      {showIndicator && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full border-slate-50 dark:border-dark-900 ${
            isOnline ? 'bg-emerald-500 animate-status-pulse' : 'bg-slate-400'
          } ${indicatorSizes[size]}`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}

import React from 'react';
import Avatar from '../Common/Avatar';

/**
 * Renders the list of currently online channel members in the sidebar.
 * @param {Array} users - Online users list [{ username, avatarColor, uuid }]
 * @param {object} currentUser - The local user profile
 */
export default function OnlineUsers({ users = [], currentUser }) {
  // Deduplicate users by username to handle multiple connections/stale tabs
  const uniqueUsersMap = new Map();
  users.forEach((user) => {
    // Keep the local user preference, or just any connection
    if (!uniqueUsersMap.has(user.username) || user.username === currentUser?.username) {
      uniqueUsersMap.set(user.username, user);
    }
  });
  const uniqueUsersList = Array.from(uniqueUsersMap.values());

  // Sort users so that the local user is always at the top, then alphabetically
  const sortedUsers = [...uniqueUsersList].sort((a, b) => {
    const aIsMe = a.username === currentUser?.username;
    const bIsMe = b.username === currentUser?.username;
    if (aIsMe) return -1;
    if (bIsMe) return 1;
    return a.username.localeCompare(b.username);
  });


  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display">
          Online Users
        </h3>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          {uniqueUsersList.length}
        </span>
      </div>

      <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
        {sortedUsers.length === 0 ? (
          <p className="px-3 text-xs text-slate-400 dark:text-slate-500 italic">
            Connecting to channel...
          </p>
        ) : (
          sortedUsers.map((user) => {
            const isMe = user.username === currentUser?.username;
            return (
              <div
                key={user.uuid || user.username}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all select-none"
              >
                <Avatar
                  username={user.username}
                  avatarColor={user.avatarColor}
                  size="sm"
                  isOnline={true}
                  showIndicator={true}
                />
                <span className="truncate flex-1 font-medium">
                  {user.username}
                  {isMe && (
                    <span className="text-[10px] ml-1.5 font-normal text-slate-400 dark:text-slate-500">
                      (you)
                    </span>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { Hash } from 'lucide-react';

/**
 * Lists available chat rooms/channels in the sidebar.
 * @param {Array} rooms - Array of room objects
 * @param {object} activeRoom - Currently active room object
 * @param {Function} onChangeRoom - Callback to switch rooms
 * @param {Function} onCloseDrawer - Mobile drawer closure callback
 */
export default function ChannelList({
  rooms,
  activeRoom,
  onChangeRoom,
  onCloseDrawer,
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display">
        Text Channels
      </h3>
      <div className="space-y-1">
        {rooms.map((room) => {
          const isActive = room.id === activeRoom.id;
          return (
            <button
              key={room.id}
              onClick={() => {
                onChangeRoom(room.id);
                if (onCloseDrawer) onCloseDrawer();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                isActive
                  ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Hash
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? 'text-brand-500 dark:text-brand-400'
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-300'
                }`}
              />
              <span className="truncate flex-1 text-left">{room.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const LOCAL_STORAGE_KEYS = {
  PROFILE: 'piechat_profile',
  THEME: 'piechat_theme',
  LAST_ROOM: 'piechat_last_room',
};

export const DEFAULT_ROOMS = [
  { id: 'general-lounge', name: 'General Lounge', description: 'Chat about anything and everything' },
  { id: 'tech-talk', name: 'Tech Talk', description: 'Programming, hardware, and tech trends' },
  { id: 'random-thoughts', name: 'Random Thoughts', description: 'Shower thoughts and random musings' },
  { id: 'announcements', name: 'Announcements', description: 'Important updates and news' },
];

export const AVATAR_COLORS = [
  { name: 'Purple Gradient', value: 'from-violet-500 to-purple-600', text: 'text-purple-500', bg: 'bg-purple-500' },
  { name: 'Blue Gradient', value: 'from-blue-500 to-indigo-600', text: 'text-blue-500', bg: 'bg-blue-500' },
  { name: 'Emerald Gradient', value: 'from-emerald-400 to-teal-600', text: 'text-teal-500', bg: 'bg-teal-500' },
  { name: 'Rose Gradient', value: 'from-rose-500 to-pink-600', text: 'text-pink-500', bg: 'bg-pink-500' },
  { name: 'Amber Gradient', value: 'from-amber-400 to-orange-600', text: 'text-orange-500', bg: 'bg-orange-500' },
  { name: 'Cyan Gradient', value: 'from-cyan-400 to-blue-500', text: 'text-cyan-500', bg: 'bg-cyan-500' },
];

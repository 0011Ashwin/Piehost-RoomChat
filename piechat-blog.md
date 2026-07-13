# Building PieChat Room: A Real-Time Multi-Room Chat App with PieSocket JS and React

> **Let's Build a Production-Ready Real-Time Chat from the Ground Up**

---

## On This Page

1. [Introduction](#1-introduction)
2. [What We Are Building](#2-what-we-are-building)
3. [Tech Stack and Project Setup](#3-tech-stack-and-project-setup)
4. [Connecting to PieSocket](#4-connecting-to-piesocket)
5. [Presence and Online Users](#5-presence-and-online-users)
6. [Sending and Receiving Messages](#6-sending-and-receiving-messages)
7. [Real-Time Typing Indicators](#7-real-time-typing-indicators)
8. [Emoji Reactions on Messages](#8-emoji-reactions-on-messages)
9. [Username Availability Checking](#9-username-availability-checking)
10. [The System Validator Pattern](#10-the-system-validator-pattern)
11. [State Management with React Context](#11-state-management-with-react-context)
12. [Lessons Learned](#12-lessons-learned)

---

## 1. Introduction

Real-time chat is one of the most common features developers need to build today. Whether it is a support widget, a community lounge, or a team collaboration tool, users now expect messages to appear instantly without a page refresh.

WebSockets make this possible. Instead of polling a server every few seconds, a WebSocket keeps a persistent, two-way connection open between the browser and the server. Messages flow in both directions as soon as they are ready.

The challenge is that managing raw WebSocket connections in production is complex. You have to handle reconnections, presence tracking, pub/sub channel routing, and scaling across multiple server instances. This is exactly the problem PieSocket solves. It gives you a hosted WebSocket service with a clean JavaScript SDK so you can focus on building features rather than infrastructure.

In this post, I will walk through how I built **PieChat Room** — a full-featured, real-time multi-room chat application — using PieSocket JS as the backbone. Along the way, I will share the real implementation decisions, including one clever pattern for solving a tricky race condition during username availability checks.

---

## 2. What We Are Building

PieChat Room has the following features:

- **Multiple chat rooms** — Users can switch between General Lounge, Tech Talk, Random Thoughts, and Announcements.
- **Presence tracking** — A live sidebar shows who is currently online in the active room.
- **Typing indicators** — Users see a real-time "Ashwin is typing..." banner.
- **Emoji reactions** — Any message can be reacted to with emoji, and reactions are visible to everyone in the room.
- **Username uniqueness** — Before joining, the app checks if the chosen username is already in use by an active connection.
- **Persistent local identity** — Profile settings (username, avatar theme) are saved in browser local storage so returning users skip the onboarding screen.
- **Light and dark mode** — Respects the system preference with an option to override.

---

## 3. Tech Stack and Project Setup

The project is built with:

| Tool | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 6** | Build tool and dev server |
| **Tailwind CSS v4** | Utility-first styling |
| **PieSocket JS v5** | WebSocket pub/sub and presence |
| **react-router-dom v7** | Client-side routing |
| **framer-motion** | Animations |
| **react-hot-toast** | Notification toasts |
| **lucide-react** | Icons |
| **date-fns** | Timestamp formatting |

Scaffold the project with Vite and add PieSocket:

```bash
npm create vite@latest piechat -- --template react
cd piechat
npm install piesocket-js react-router-dom react-hot-toast lucide-react framer-motion date-fns
```

Create a `.env` file at the project root with your PieSocket credentials:

```env
VITE_PIESOCKET_API_KEY=your_api_key_here
VITE_PIESOCKET_CLUSTER_ID=demo
```

Get your free API key at [piesocket.com](https://www.piesocket.com).

---

## 4. Connecting to PieSocket

The connection to PieSocket lives in a thin service class that wraps the SDK. Centralizing it means the same authenticated client is reused across the app without creating duplicate connections.

```js
// src/services/piesocket.js
import PieSocket from 'piesocket-js';

class PieSocketService {
  constructor() {
    this.client = null;
  }

  init(username, avatarColor = '') {
    const apiKey = import.meta.env.VITE_PIESOCKET_API_KEY || '';
    const clusterId = import.meta.env.VITE_PIESOCKET_CLUSTER_ID || 'demo';

    // Clean up any previous connections
    if (this.client) {
      const connections = this.client.getConnections();
      Object.keys(connections).forEach((channelId) => {
        this.client.unsubscribe(channelId);
      });
    }

    // Serialize username and avatarColor as the userId so other presence members
    // can parse and display this user's identity correctly.
    this.client = new PieSocket({
      apiKey,
      clusterId,
      notifySelf: true,
      presence: true,
      userId: JSON.stringify({ username, avatarColor }),
    });

    return this.client;
  }

  subscribe(roomName) {
    if (!this.client) throw new Error('Call init() first.');
    return this.client.subscribe(roomName);
  }

  unsubscribe(roomName) {
    if (!this.client) return;
    this.client.unsubscribe(roomName);
  }
}

export default new PieSocketService();
```

Two things to highlight here:

1. **`notifySelf: true`** — This makes the SDK echo your own published events back to your own listeners. It is important for keeping the chat window consistent without writing a separate local state update path.
2. **`userId` as serialized JSON** — PieSocket lets you attach any string as the `userId`. By using `JSON.stringify({ username, avatarColor })`, every presence member object carries the identity data needed to render an avatar. Other clients can call `JSON.parse(member.user)` to get the display name and theme.

---

## 5. Presence and Online Users

Presence is one of the most powerful features PieSocket provides out of the box. When you subscribe to a channel with `presence: true`, PieSocket maintains a list of all connected members and fires events when anyone joins or leaves.

The `usePieSocket` custom hook handles the full channel lifecycle:

```js
// src/hooks/usePieSocket.js (presence section)

const parseMember = (member) => {
  try {
    const data = JSON.parse(member.user);
    return {
      username: data.username || 'Anonymous',
      avatarColor: data.avatarColor || 'from-violet-500 to-purple-600',
      isSystem: !!data.isSystem,
      uuid: member.uuid,
    };
  } catch {
    return {
      username: member.user || 'Anonymous',
      avatarColor: 'from-violet-500 to-purple-600',
      isSystem: false,
      uuid: member.uuid,
    };
  }
};

// Inside the channel subscription:
const syncMembers = () => {
  if (!channel.members) return;
  // Filter out system validator accounts (explained in Section 10)
  const decoded = channel.members.map(parseMember).filter((m) => !m.isSystem);
  setOnlineMembers(decoded);
};

channel.listen('system:member_list', syncMembers);

channel.listen('system:member_joined', (data) => {
  syncMembers();
  if (data.member && data.member.uuid !== channel.uuid) {
    const m = parseMember(data.member);
    if (m.isSystem) return; // Suppress system validator notifications
    toast.success(`${m.username} joined`, { icon: '👋' });
  }
});

channel.listen('system:member_left', (data) => {
  syncMembers();
  if (data.member) {
    removeTypingUser(data.member.uuid);
    const m = parseMember(data.member);
    if (m.isSystem) return;
    toast(`${m.username} left`, { icon: '🚪' });
  }
});
```

The `system:member_list` event fires immediately after subscription with the full current member snapshot. `system:member_joined` and `system:member_left` fire on changes. Calling `syncMembers()` on every change means the online users list is always accurate.

---

## 6. Sending and Receiving Messages

Every message is a plain JavaScript object published to the `new_message` event on the active channel:

```js
// src/context/ChatContext.jsx
const sendMessage = useCallback((text) => {
  if (!profile) return;

  const messagePayload = {
    id: generateId(),           // Unique ID for deduplication
    sender: profile.username,
    avatarColor: profile.avatarColor,
    text: text.trim(),
    timestamp: new Date().toISOString(),
  };

  publish('new_message', messagePayload);
}, [profile, publish]);
```

And on the receiving side, the hook listens for incoming messages. Because `notifySelf: true` is set, your own sent message also triggers this listener, which keeps the UI consistent:

```js
channel.listen('new_message', (data, meta) => {
  // Play a notification sound only for others' messages
  if (channel.uuid !== (meta && meta.from)) {
    playNotificationSound();
  }

  if (onMessageRef.current) {
    onMessageRef.current({
      id: data.id,
      sender: data.sender,
      avatarColor: data.avatarColor,
      text: data.text,
      timestamp: data.timestamp,
      roomId,
    });
  }
});
```

A deduplication check runs in the context before adding a message to state, guarding against any scenario where the same message ID arrives twice:

```js
const handleIncomingMessage = useCallback((msg) => {
  setRoomMessages((prevHistory) => {
    const historyForRoom = prevHistory[msg.roomId] || [];
    if (historyForRoom.some((m) => m.id === msg.id)) {
      return prevHistory; // Already exists, skip
    }
    return {
      ...prevHistory,
      [msg.roomId]: [...historyForRoom, { ...msg, reactions: {} }],
    };
  });
}, [setRoomMessages]);
```

---

## 7. Real-Time Typing Indicators

Typing indicators need to be debounced. You want to send a `typing_start` event when the user first presses a key, and a `typing_stop` event once they pause for a moment. The `useTyping` hook handles this cleanly:

```js
// src/hooks/useTyping.js
export function useTyping(onStartTyping, onStopTyping, delay = 700) {
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef(null);

  const handleKeyPress = () => {
    if (!isTyping) {
      setIsTyping(true);
      if (onStartTyping) onStartTyping();
    }

    // Reset the debounce timer on every keystroke
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (onStopTyping) onStopTyping();
    }, delay);
  };

  const resetTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      clearTimeout(timeoutRef.current);
      if (onStopTyping) onStopTyping();
    }
  };

  return { handleKeyPress, resetTyping };
}
```

The chat input calls `handleKeyPress` on every `onKeyDown`, and `resetTyping` when the message is sent. This ensures the typing indicator clears instantly on send, not after the 700ms delay.

On the receiving end, the hook in `usePieSocket` automatically removes a typing user after 3 seconds as a safety net, in case a `typing_stop` event gets lost:

```js
channel.listen('typing_start', (data, meta) => {
  handleTypingEvent(meta?.from, { username: data.username, avatarColor: data.avatarColor }, true);
});

channel.listen('typing_stop', (_data, meta) => {
  handleTypingEvent(meta?.from, null, false);
});
```

---

## 8. Emoji Reactions on Messages

Emoji reactions are stored per message as a map of `emoji → [username, ...]`. When a user clicks a reaction, the app publishes a `message_reaction` event and also applies an **optimistic update** locally so the UI responds immediately without waiting for the round trip:

```js
const sendReaction = useCallback((messageId, emoji) => {
  if (!profile) return;

  const payload = {
    messageId,
    emoji,
    username: profile.username,
    roomId: activeRoomId,
  };

  publish('message_reaction', payload);
  handleIncomingReaction(payload); // Optimistic local update
}, [profile, publish, activeRoomId, handleIncomingReaction]);
```

Reactions are toggled — clicking an emoji you already reacted to removes your reaction:

```js
const handleIncomingReaction = useCallback((reaction) => {
  setRoomMessages((prevHistory) => {
    const historyForRoom = prevHistory[reaction.roomId] || [];
    const updatedHistory = historyForRoom.map((msg) => {
      if (msg.id !== reaction.messageId) return msg;

      const currentReactions = msg.reactions || {};
      const usersForEmoji = currentReactions[reaction.emoji] || [];

      const newUsers = usersForEmoji.includes(reaction.username)
        ? usersForEmoji.filter((u) => u !== reaction.username) // Toggle off
        : [...usersForEmoji, reaction.username];               // Toggle on

      return {
        ...msg,
        reactions: { ...currentReactions, [reaction.emoji]: newUsers },
      };
    });

    return { ...prevHistory, [reaction.roomId]: updatedHistory };
  });
}, [setRoomMessages]);
```

---

## 9. Username Availability Checking

Before a user can enter the chatroom, the welcome screen checks whether the chosen username is already taken by an active connection. This is done by briefly connecting to PieSocket as a temporary observer and reading the current presence member list.

```js
const checkAvailability = (targetUsername) => {
  return new Promise((resolve) => {
    const apiKey = import.meta.env.VITE_PIESOCKET_API_KEY || '';
    const clusterId = import.meta.env.VITE_PIESOCKET_CLUSTER_ID || 'demo';

    const checkUserId = JSON.stringify({
      username: `System-Validator-${Math.random().toString(36).substring(2, 8)}`,
      avatarColor: '',
      isSystem: true,
    });

    let resolved = false;
    let tempClient = null;

    const timeoutId = setTimeout(() => {
      if (!resolved) { resolved = true; resolve({ available: true }); }
    }, 3000);

    tempClient = new PieSocket({ apiKey, clusterId, notifySelf: true, presence: true, userId: checkUserId });

    tempClient.subscribe('general-lounge').then((channel) => {
      channel.listen('system:member_list', () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);
        tempClient.unsubscribe('general-lounge');

        const membersList = channel.members || [];
        const conflict = membersList.some((m) => {
          try {
            const data = JSON.parse(m.user);
            if (data.isSystem) return false;
            return data.username?.toLowerCase() === targetUsername.toLowerCase();
          } catch {
            return m.user?.toLowerCase() === targetUsername.toLowerCase();
          }
        });

        resolve(
          conflict
            ? { available: false, reason: 'Username is already active. Please choose another.' }
            : { available: true }
        );
      });
    });
  });
};
```

If no `system:member_list` event arrives within 3 seconds (for example, if the room has zero members), the promise resolves as available. This prevents the user from getting stuck.

---

## 10. The System Validator Pattern

The availability check described above creates a real problem if not handled carefully. When the temporary observer connects to the room, it triggers `system:member_joined` for all existing users in the room. They would see a toast notification like **"System-Validator-a3f8g joined"** — which is confusing and looks like a bug.

The fix is to mark the validator identity with an `isSystem: true` flag in its userId JSON. The receiving clients parse this flag and skip the notification:

```js
// In usePieSocket.js — member_joined listener
channel.listen('system:member_joined', (data) => {
  syncMembers();
  if (data.member && data.member.uuid !== channel.uuid) {
    const m = parseMember(data.member);
    if (m.isSystem) return; // ← Skip the toast
    toast.success(`${m.username} joined`, { icon: '👋' });
  }
});
```

The same guard applies to `system:member_left` and to the `syncMembers` function, which filters system accounts out of the online users list entirely:

```js
const decoded = channel.members.map(parseMember).filter((m) => !m.isSystem);
setOnlineMembers(decoded);
```

This pattern is clean because it does not require any server-side changes or special API flags. The `isSystem` contract is just an agreed-upon field inside the serialized userId string, and it works purely at the application layer.

---

## 11. State Management with React Context

All shared chat state lives in a single `ChatContext`, which the `ChatProvider` component wraps around the entire app:

```js
// Exposed via useChat() hook
const value = {
  profile,         // { username, avatarColor } — persisted in localStorage
  setProfile,      // Update or clear the local identity
  theme,           // 'light' | 'dark' | 'system'
  setTheme,
  activeRoom,      // Currently selected room object
  changeRoom,      // Switch to a different room
  messages,        // Messages for the current room
  sendMessage,     // Publish a new message
  sendReaction,    // Toggle an emoji reaction
  sendTypingStart, // Notify others you started typing
  sendTypingStop,  // Notify others you stopped typing
  clearCurrentMessages,
  onlineUsers,     // Presence member list
  typingUsers,     // Users currently typing
  connectionStatus, // 'connected' | 'reconnecting' | 'offline'
  rooms,           // List of all available rooms
  channel,         // Raw PieSocket channel reference
};
```

Routing is protected by a `NavigationManager` component that reads `profile` from context:

```jsx
function NavigationManager() {
  const { profile } = useChat();
  return (
    <Routes>
      <Route path="/" element={profile ? <Navigate to="/chat" replace /> : <Welcome />} />
      <Route path="/chat" element={profile ? <ChatRoom /> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

If there is no profile in local storage, the user lands on the welcome/onboarding page. Once a profile is set, they are automatically redirected to the chat room.

---

## 12. Lessons Learned

Building PieChat Room surfaced a few non-obvious things worth noting:

**1. Use `notifySelf: true` for a simpler message flow.**
Without it, you have to maintain a separate local list of your own sent messages and merge it with the incoming stream. With it, your own published messages arrive through the same listener as everyone else's, and your deduplication logic handles it.

**2. Serialize complex identity data into `userId`.**
PieSocket's `userId` accepts any string. Encoding a JSON object there is a lightweight way to pass avatar colors, display names, and flags like `isSystem` to all other presence members — no custom backend required.

**3. Always guard against system/internal connections in presence events.**
Any time you need to connect briefly as an observer (for availability checks, health pings, or admin monitoring), mark those connections with a flag and filter them out client-side. Otherwise, users see confusing join/leave notifications.

**4. Debounce typing events aggressively.**
Without debouncing, typing events fire on every keystroke and can easily saturate the channel. A 700ms stop delay strikes a good balance between responsiveness and not flooding the pub/sub stream.

**5. Timeout your presence checks.**
If the PieSocket `system:member_list` event never fires (empty room, slow connection), a promise that never resolves blocks the user on the onboarding screen. Always set a 3–5 second timeout that resolves optimistically.

---

## Getting Started

The full source code is available on GitHub: [github.com/0011Ashwin/Piehost-RoomChat](https://github.com/0011Ashwin/Piehost-RoomChat)

To run locally:

```bash
git clone https://github.com/0011Ashwin/Piehost-RoomChat.git
cd Piehost-RoomChat
npm install
```

Create a `.env` file:

```env
VITE_PIESOCKET_API_KEY=your_key_here
VITE_PIESOCKET_CLUSTER_ID=demo
```

Then start the dev server:

```bash
npm run dev
```

Open `http://localhost:5173`, pick a username and avatar theme, and you are in the room.

---

PieSocket made the real-time layer of this project approachable without standing up any WebSocket infrastructure. If you are building something similar — a live dashboard, a collaborative editor, or a support chat — the combination of PieSocket's presence API with a well-structured React context architecture gets you to production quality quickly.

Happy building! 🚀

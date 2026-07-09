# PieChat Room 🚀

A production-ready, beautiful, and feature-rich real-time chat application built using **React 19**, **Vite**, **TailwindCSS (v4)**, and **PieSocket JS SDK (v5)**.

This project features a fully responsive design (inspired by Discord, Slack, and WhatsApp) with glassmorphism aesthetics, fluid Framer Motion transitions, notification sounds, message search, emoji pickers, persistent multi-room chat histories, and real-time presence indicators.

---

## 🌟 Features

- **Onboarding & Local Profile**: Save profile locally (`email`, `username`, `avatarColor`) without database accounts. Next time, continue as your user or log out to change details.
- **Real-Time Presence (PieSocket)**: Fully integrated presence tracking using `system:member_list`, `system:member_joined`, and `system:member_left` to show active users with dynamic green status pulses.
- **WhatsApp-Style Typing Indicators**: Detects and displays active typists (e.g. *"Ashwin is typing..."*) using a debounced (700ms) hook and triggers bouncy micro-animations.
- **Message Feed & Utilities**:
  - Auto-scrolls to the bottom on new messages.
  - Aligns your messages to the right (gradient bubble) and others to the left.
  - Interactive "Copy Message" overlay button.
  - Real-time search/filter for messages or senders.
  - "Clear Chat" utility to delete local history per-channel.
- **Dual Sound alerts**: Dual-tone beep synthesis via browser Web Audio API when messages arrive from other users (no static audio asset downloads required).
- **Responsive Layout**:
  - **Desktop**: Persistent side panel + main chat area.
  - **Mobile/Tablet**: Interactive side panel drawer + always-visible text input.
- **Theme Support**: Real-time Light, Dark, and System theme synchronization.

---

## 🛠️ Tech Stack

- **Framework**: React 19 (Vite 8)
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v6
- **Real-Time Engine**: PieSocket JS SDK v5
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Notifications**: React Hot Toast

---

## 📂 Project Structure

```text
src/
├── components/
│   ├── Chat/
│   │   ├── ChatInput.jsx        # Keyboard events, emoji picker, typing debounce
│   │   ├── ChatWindow.jsx       # Layout, headers, search filters, clear history
│   │   ├── MessageBubble.jsx    # Entry animations, copy clips, user alignment
│   │   ├── MessageList.jsx      # Scroll management, search filtering
│   │   └── TypingIndicator.jsx  # Typing statuses and bouncy animations
│   ├── Sidebar/
│   │   ├── Sidebar.jsx          # Connection badges, profile footers, panel wrapper
│   │   ├── ChannelList.jsx      # Available text channels
│   │   └── OnlineUsers.jsx      # Sorted presence user list
│   └── Common/
│       ├── Avatar.jsx           # Initials drawer and online status indicator
│       ├── Button.jsx           # Dynamic buttons with spinners and icons
│       ├── Modal.jsx            # Framer-Motion settings popup overlay
│       └── Loader.jsx           # General spinner
├── context/
│   └── ChatContext.jsx          # Profile state, theme state, message persistence
├── hooks/
│   ├── useLocalStorage.js       # Local storage wrapper
│   ├── usePieSocket.js          # Subscriptions, message publishing, socket lifecycle
│   └── useTyping.js             # Typing debounce timer
├── services/
│   └── piesocket.js             # PieSocket JS SDK v5 singleton wrapper
├── utils/
│   ├── constants.js             # Default rooms, localStorage keys, avatar gradients
│   └── helpers.js               # Audio synthesis, date formats, initials parser
├── App.jsx                      # NavigationManager and Toaster setup
├── index.css                    # Tailwind CSS v4 imports, global animations
└── main.jsx                     # StrictMode bootloader
```

---

## ⚙️ Configuration & Setup

1. **Clone & Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Environment Variables**:
   Create a `.env` file in the root directory (based on `.env.example`):
   ```env
   VITE_PIESOCKET_API_KEY=your_piesocket_api_key_here
   VITE_PIESOCKET_CLUSTER_ID=demo
   ```
   *Note: If you don't have a custom cluster, the default `clusterId` resolves to `demo`.*

3. **Running the App locally**:
   ```bash
   npm run dev
   ```

4. **Production Build**:
   ```bash
   npm run build
   ```

---

## 🚀 Deployment Guide (PieHost)

This project is fully ready for deployment on **PieHost** static hosting.

### Step 1: Build the Project
Compile the optimized production bundle:
```bash
npm run build
```
This generates a `dist/` directory in the root of the project containing:
- `index.html`
- A single bundled JS file with stylesheet assets.

### Step 2: Deploy to PieHost
1. Log in to your **[PieHost Dashboard](https://www.piehost.com)**.
2. Navigate to **Static Hosting** or **Projects**.
3. Create a new site, and upload the contents of the `dist/` folder.
4. Ensure your environment variables (`VITE_PIESOCKET_API_KEY`, `VITE_PIESOCKET_CLUSTER_ID`) are configured either in the build pipeline or hardcoded in the deployment configuration if static compiling.
5. Your application is live!

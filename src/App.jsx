import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChatProvider, useChat } from './context/ChatContext';
import Welcome from './pages/Welcome';
import ChatRoom from './pages/ChatRoom';
import { Toaster } from 'react-hot-toast';

/**
 * Handles routing switches and locks down the chat page based on local profile availability.
 */
function NavigationManager() {
  const { profile } = useChat();

  return (
    <Routes>
      {/* If profile doesn't exist, show welcome onboarding, else redirect to chat */}
      <Route
        path="/"
        element={profile ? <Navigate to="/chat" replace /> : <Welcome />}
      />
      
      {/* If profile exists, show chat, else redirect to onboarding */}
      <Route
        path="/chat"
        element={profile ? <ChatRoom /> : <Navigate to="/" replace />}
      />
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ChatProvider>
      <BrowserRouter>
        <div className="w-full h-full flex flex-col overflow-hidden">
          <NavigationManager />
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: 'dark:bg-slate-800 dark:text-slate-100 font-sans',
              duration: 2500,
            }}
          />
        </div>
      </BrowserRouter>
    </ChatProvider>
  );
}

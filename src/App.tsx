/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAppStore } from './store';
import AuthScreen from './screens/AuthScreen';
import MainLayout from './screens/MainLayout';
import { AnimatePresence, motion } from 'motion/react';
import { AuthProvider } from './contexts/AuthContext';
import GlobalToast from './components/GlobalToast';

function AppContent() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const themeColor = useAppStore(state => state.themeColor);
  const appFont = useAppStore(state => state.appFont);
  const isAuthenticated = useAppStore(state => state.isAuthenticated);

  useEffect(() => {
    document.documentElement.style.setProperty("--color-brand-blue", themeColor);
    document.documentElement.style.setProperty("--font-sans", appFont);
  }, [themeColor, appFont]);

  return (
    <div className="w-full min-h-screen text-[var(--color-brand-text)] font-sans overflow-hidden">
      {isOffline && (
        <div className="bg-yellow-500 text-black text-xs font-bold text-center py-1 absolute top-0 left-0 w-full z-[100] flex items-center justify-center gap-2">
          <span>⚠️ Offline Mode: Viewing cached data</span>
        </div>
      )}
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div 
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full min-h-screen"
          >
            <AuthScreen />
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full min-h-screen"
          >
            <MainLayout />
          </motion.div>
        )}
      </AnimatePresence>
      <GlobalToast />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

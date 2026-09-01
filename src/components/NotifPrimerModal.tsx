import React from 'react';
import { motion } from 'motion/react';
import { Bell } from 'lucide-react';
import { useAppStore } from '@/store';

export default function NotifPrimerModal() {
  const markSeen = useAppStore(state => state.markNotifPrimerSeen);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel w-full max-w-sm rounded-3xl p-6 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-brand-blue/20 flex items-center justify-center mx-auto mb-4 border border-brand-blue/30">
          <Bell className="w-8 h-8 text-brand-blue" />
        </div>
        
        <h2 className="text-xl font-bold text-white mb-2">Stay in the loop</h2>
        <p className="text-gray-300 text-sm mb-6">
          Never miss a project update, mention, or message from your VIT Chennai peers.
        </p>

        <div className="space-y-3">
          <button 
            onClick={markSeen}
            className="w-full py-3.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold rounded-xl transition-transform active:scale-95"
          >
            Allow Notifications
          </button>
          <button 
            onClick={markSeen}
            className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-xl transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </motion.div>
    </div>
  );
}

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store';

export default function GlobalToast() {
  const globalToast = useAppStore(state => state.globalToast);

  return (
    <AnimatePresence>
      {globalToast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] glass-panel bg-brand-green/20 border border-brand-green/30 text-white px-5 py-3 rounded-full flex items-center gap-3 shadow-2xl backdrop-blur-md whitespace-nowrap"
        >
          <CheckCircle2 className="w-5 h-5 text-brand-green" />
          <span className="text-sm font-bold">{globalToast}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

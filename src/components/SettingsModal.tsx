import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Palette, Type, Check } from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEME_COLORS = [
  { name: 'Default Blue', value: '#0A66C2' },
  { name: 'Chrome Mint', value: '#00B67A' },
  { name: 'Chrome Purple', value: '#8A2BE2' },
  { name: 'Chrome Red', value: '#E53935' },
  { name: 'Chrome Orange', value: '#F57C00' },
  { name: 'Chrome Yellow', value: '#FBC02D' },
];

const FONTS = [
  { name: 'Default (Inter)', value: '"Inter", "Roboto", sans-serif' },
  { name: 'Roboto', value: '"Roboto", sans-serif' },
  { name: 'Monospace', value: '"JetBrains Mono", monospace' },
  { name: 'Serif', value: '"Playfair Display", serif' },
  { name: 'System UI', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
];

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { themeColor, setThemeColor, appFont, setAppFont } = useAppStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#0D1117] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-brand-blue" />
                Appearance Settings
              </h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-8">
              {/* Theme Colors */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Chrome Themes (Accent Color)
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {THEME_COLORS.map((theme) => (
                    <button
                      key={theme.name}
                      onClick={() => setThemeColor(theme.value)}
                      className={cn(
                        "relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all",
                        themeColor === theme.value 
                          ? "border-white/50 bg-white/5" 
                          : "border-white/10 hover:border-white/20 hover:bg-white/5"
                      )}
                    >
                      <div 
                        className="w-8 h-8 rounded-full mb-2 shadow-inner" 
                        style={{ backgroundColor: theme.value }}
                      />
                      <span className="text-xs text-gray-400 text-center">{theme.name}</span>
                      {themeColor === theme.value && (
                        <div className="absolute top-2 right-2">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fonts */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  App Font
                </h3>
                <div className="flex flex-col gap-2">
                  {FONTS.map((font) => (
                    <button
                      key={font.name}
                      onClick={() => setAppFont(font.value)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                        appFont === font.value 
                          ? "border-brand-blue bg-brand-blue/10" 
                          : "border-white/10 hover:border-white/20 hover:bg-white/5"
                      )}
                      style={{ fontFamily: font.value }}
                    >
                      <span className={cn(
                        "text-sm", 
                        appFont === font.value ? "text-brand-blue font-medium" : "text-gray-300"
                      )}>
                        {font.name}
                      </span>
                      {appFont === font.value && <Check className="w-4 h-4 text-brand-blue" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/10 bg-black/20 text-center">
              <p className="text-xs text-gray-500">Preferences are saved automatically for this session.</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

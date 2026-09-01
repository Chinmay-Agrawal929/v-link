import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export default function AiCounselor() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  
  const user = useAppStore(state => state.user);
  const activeTab = useAppStore(state => state.activeTab);
  const setDraftPostContent = useAppStore(state => state.setDraftPostContent);
  const setCreateModalOpen = useAppStore(state => state.setCreateModalOpen);
  const setTab = useAppStore(state => state.setTab);
  const setNetworkTab = useAppStore(state => state.setNetworkTab);
  
  const [chat, setChat] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'ai', text: `Hi ${user?.name?.split(' ')[0] || ''}! I'm Wingman, your AI core. Need a hackathon team, post drafted, or icebreaker? Let's go.` }
  ]);

  const getSuggestions = () => {
    switch (activeTab) {
      case 'profile': return ['Help me write my About section', 'What skills should I add?'];
      case 'spotlight': return ['What are the upcoming events?', 'Any hackathons?'];
      case 'network': return ['Generate an icebreaker', 'Search for React devs'];
      default: return ['Draft a post about my new project', 'Search for machine learning students', 'Any upcoming hackathons?'];
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    setChat(prev => [...prev, { role: 'user', text }]);
    setMessage('');
    setIsTyping(true);
    setActionFeedback(null);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: chat })
      });
      const data = await res.json();
      
      if (data.type === 'function_call') {
        const { name, args } = data.functionCall;
        
        if (name === 'create_post') {
          setActionFeedback("Drafting your post...");
          setTimeout(() => {
            setDraftPostContent(args.content);
            setCreateModalOpen(true);
            setIsOpen(false);
            setActionFeedback(null);
            setChat(prev => [...prev, { role: 'ai', text: "I've drafted your post and opened the editor!" }]);
          }, 1500);
        } else if (name === 'search_network') {
          setActionFeedback(`Scanning network for: ${args.user_query}...`);
          setTimeout(() => {
            setTab('network');
            setNetworkTab('network');
            setIsOpen(false);
            setActionFeedback(null);
            setChat(prev => [...prev, { role: 'ai', text: `Taking you to the network tab to find ${args.user_query}!` }]);
          }, 1500);
        } else if (name === 'generate_icebreaker') {
          const icebreaker = `Hey ${args.receiver_name}, ${args.sender_name} here! Saw your work on ${args.project_context} and I'm impressed. Want to connect?`;
          setChat(prev => [...prev, { role: 'ai', text: `Here is a solid icebreaker for you:\n\n"${icebreaker}"\n\nFeel free to copy and paste that into your chat!` }]);
        }
      } else {
        setChat(prev => [...prev, { role: 'ai', text: data.text }]);
      }
    } catch (err) {
      setChat(prev => [...prev, { role: 'ai', text: "Sorry, I'm having a bit of a caffeine crash. Try again?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, y: [0, -10, 0] }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
            onClick={() => setIsOpen(true)}
            className="absolute bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-brand-green border border-brand-green/50 flex items-center justify-center shadow-[0_0_20px_rgba(35,134,54,0.4)]"
          >
            <Sparkles className="text-white w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 z-40 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100) setIsOpen(false);
              }}
              className="absolute bottom-0 left-0 right-0 z-50 h-[75dvh] glass-panel rounded-t-[32px] flex flex-col shadow-2xl overflow-hidden bg-brand-dark/90"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Sparkles className="w-32 h-32 text-brand-green" />
              </div>
              
              <div className="w-full flex justify-center py-4" onClick={() => setIsOpen(false)}>
                <div className="w-12 h-1.5 bg-white/20 rounded-full cursor-pointer" />
              </div>

              <div className="px-6 pb-4 flex items-center justify-between border-b border-white/10 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-green/20 border border-brand-green/30 flex items-center justify-center shadow-[0_0_15px_rgba(35,134,54,0.3)]">
                    <Sparkles className="w-5 h-5 text-brand-green" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg leading-tight">Wingman</h3>
                    <p className="text-[11px] font-mono text-brand-green uppercase tracking-wider">AI Agent Core</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 relative z-10 no-scrollbar">
                {chat.map((msg, idx) => (
                  <div key={idx} className={cn("max-w-[85%] rounded-2xl p-4 text-sm shadow-lg", msg.role === 'ai' ? "glass-green border-brand-green/20 text-white self-start rounded-tl-sm mr-auto" : "bg-brand-blue/90 text-white self-end rounded-tr-sm ml-auto border border-brand-blue/50")}>
                    {msg.role === 'ai' ? (
                      <div className="markdown-body text-sm font-medium">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="font-medium">{msg.text}</span>
                    )}
                  </div>
                ))}
                
                {actionFeedback && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="self-center my-4">
                    <div className="px-4 py-2 rounded-full glass-panel border border-brand-green/30 text-brand-green text-xs font-mono flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {actionFeedback}
                    </div>
                  </motion.div>
                )}
                
                {isTyping && !actionFeedback && (
                  <div className="glass-green text-white self-start rounded-2xl rounded-tl-sm mr-auto p-4 flex gap-1 shadow-lg">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-brand-green rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-brand-green rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-brand-green rounded-full" />
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-white/10 relative z-10 bg-brand-dark">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
                  {getSuggestions().map((sug, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSend(sug)}
                      disabled={isTyping}
                      className="whitespace-nowrap px-4 py-2 rounded-full glass-panel border-white/10 text-brand-green text-xs font-semibold hover:bg-brand-green/10 hover:border-brand-green/30 transition-colors disabled:opacity-50"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input 
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(message)}
                    disabled={isTyping}
                    placeholder="Ask Wingman..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-green focus:bg-white/10 transition-colors"
                  />
                  <button 
                    onClick={() => handleSend(message)}
                    disabled={!message.trim() || isTyping}
                    className="absolute right-2 top-2 bottom-2 w-10 flex items-center justify-center bg-brand-green rounded-lg text-white hover:bg-brand-green/80 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 -ml-0.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

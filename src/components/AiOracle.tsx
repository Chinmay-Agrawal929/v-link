import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, Loader2, Play, Volume2, VolumeX, Camera, Mic, Square, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

import TeamRosterCard from './TeamRosterCard';
import RoadmapCard from './RoadmapCard';
import SaveTeamButton from './SaveTeamButton';

export default function AiOracle() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [chat, setChat] = useState<{role: 'user'|'ai', text: string, image?: string, roster?: any[], roadmap?: any}[]>([
    { role: 'ai', text: "Hello! I'm the V-Link Oracle. Want me to review your resume, debug your code, or find you a hackathon? 🚀" }
  ]);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // New Multimodal & Voice States
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Animation refs for mascot eyes
  const containerRef = useRef<HTMLButtonElement>(null);
  const leftPupilRef = useRef<HTMLDivElement>(null);
  const rightPupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, isTyping]);

  useEffect(() => {
    // 120fps Vanilla JS Eye Tracking
    let animationFrameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !leftPupilRef.current || !rightPupilRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const angle = Math.atan2(dy, dx);
      
      const maxDistance = 4; // Max pupil travel distance
      const distance = Math.min(maxDistance, Math.hypot(dx, dy) / 10);
      
      const pupX = Math.cos(angle) * distance;
      const pupY = Math.sin(angle) * distance;

      leftPupilRef.current.style.transform = `translate(${pupX}px, ${pupY}px)`;
      rightPupilRef.current.style.transform = `translate(${pupX}px, ${pupY}px)`;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Ensure speech stops if voice is disabled
  useEffect(() => {
    if (!isVoiceEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [isVoiceEnabled]);

  const speakText = (text: string) => {
    if (!isVoiceEnabled || !window.speechSynthesis) return;
    
    // Stop currently speaking
    window.speechSynthesis.cancel();
    
    // Clean markdown for speech
    const cleanText = text.replace(/[*#_`\[\]]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.pitch = 1.1;
    utterance.rate = 0.9;
    
    // Try to find a good friendly voice
    const voices = window.speechSynthesis.getVoices();
    const friendlyVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google UK English Female'));
    if (friendlyVoice) {
      utterance.voice = friendlyVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsTyping(false);
  };

  const handleSend = async () => {
    if (!message.trim() && !selectedImage) return;

    // 1. Instantly append User Message & Set Loading
    const userMsg = { role: 'user' as const, text: message.trim(), image: selectedImage || undefined };
    setChat(prev => [...prev, userMsg]);
    const currentImage = selectedImage;
    
    setMessage('');
    setSelectedImage(null);
    setIsTyping(true);

    // 2. Append empty AI Message container
    setChat(prev => [...prev, { role: 'ai', text: '' }]);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // 3. Initiate Streaming Fetch
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.text,
          imageBase64: currentImage,
          history: chat 
        }),
        signal: controller.signal
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let aiResponseText = '';

      if (reader) {
        setIsTyping(false); // Remove loading indicator once stream connects
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  aiResponseText += parsed.text;
                  setChat(prev => {
                    const newChat = [...prev];
                    newChat[newChat.length - 1].text = aiResponseText;
                    return newChat;
                  });
                } else if (parsed.type === 'roadmap') {
                  setChat(prev => {
                    const newChat = [...prev];
                    newChat[newChat.length - 1].roadmap = parsed.roadmap;
                    return newChat;
                  });
                } else if (parsed.type === 'team_roster') {
                  setChat(prev => {
                    const newChat = [...prev];
                    newChat[newChat.length - 1].roster = parsed.roster;
                    return newChat;
                  });
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                // Ignore parse errors on incomplete chunks
              }
            }
          }
        }
      }
      
      // 4. Trigger TTS when stream completes fully
      if (isVoiceEnabled && aiResponseText) {
        speakText(aiResponseText);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setChat(prev => {
          const newChat = [...prev];
          newChat[newChat.length - 1].text = 'Whoops! My circuits got tangled. Could you try that again?';
          return newChat;
        });
      }
    } finally {
      setIsTyping(false);
      setAbortController(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Microphone not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(prev => prev ? prev + ' ' + transcript : transcript);
    };
    recognition.start();
  };

  const toggleMascot = () => {
    // Make Mascot blink before opening
    if (containerRef.current) {
      containerRef.current.style.transform = 'scaleY(0.1)';
      setTimeout(() => {
        if (containerRef.current) containerRef.current.style.transform = 'scaleY(1)';
        setIsOpen(!isOpen);
      }, 150);
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      {/* Floating Action Button / Mascot */}
      <motion.button
        ref={containerRef}
        onClick={toggleMascot}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed bottom-[90px] right-4 z-50 w-16 h-16 bg-[#1E293B]/80 backdrop-blur-xl border border-white/20 rounded-full shadow-[0_0_20px_rgba(10,102,194,0.3)] flex items-center justify-center transition-transform cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative w-full h-full rounded-full flex flex-col items-center justify-center overflow-hidden">
          {/* Eyes */}
          <div className="flex gap-1.5 mb-1 z-10 relative mt-1">
            <div className="w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden">
              <div ref={leftPupilRef} className="w-1.5 h-1.5 bg-[#0084FF] rounded-full" />
            </div>
            <div className="w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden">
              <div ref={rightPupilRef} className="w-1.5 h-1.5 bg-[#0084FF] rounded-full" />
            </div>
          </div>
          {/* Smile */}
          <div className="w-4 h-1.5 border-b-2 border-white/80 rounded-full z-10" />
          
          {/* Sparkles on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute top-1 right-1 text-brand-blue"
              >
                <Sparkles className="w-3 h-3" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>

      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-[160px] right-4 w-[90vw] sm:w-[450px] max-h-[700px] h-[80dvh] bg-brand-dark/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-brand-blue/10 shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-brand-blue" />
                <h3 className="text-white font-bold text-sm tracking-wide">V-Link Oracle</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className={cn("p-1.5 rounded-full transition-colors", isVoiceEnabled ? "text-brand-green hover:bg-brand-green/20" : "text-gray-500 hover:bg-white/10")}
                >
                  {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {chat.map((msg, i) => (
                <div key={i} className={cn("flex max-w-[85%]", msg.role === 'user' ? "ml-auto justify-end" : "mr-auto justify-start")}>
                  <div className={cn("p-3 rounded-2xl text-sm leading-relaxed", 
                    msg.role === 'user' 
                      ? "bg-brand-blue/20 text-white border border-brand-blue/30 rounded-br-sm" 
                      : "bg-white/5 text-gray-200 border border-white/10 rounded-bl-sm"
                  )}>
                    {msg.image && (
                      <div className="mb-2 rounded-xl overflow-hidden border border-white/10">
                        <img src={msg.image} alt="User Context" className="w-full max-h-40 object-cover" />
                      </div>
                    )}
                    {msg.role === 'ai' ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                        {msg.roadmap && (
                          <RoadmapCard roadmap={msg.roadmap} />
                        )}
                        {msg.roster && msg.roster.length > 0 && (
                          <div className="mt-4 grid grid-cols-1 gap-3">
                            {msg.roster.map((rUser: any, idx: number) => (
                              <TeamRosterCard key={idx} user={rUser} />
                            ))}
                            <SaveTeamButton roster={msg.roster} projectContext={msg.text} />
                          </div>
                        )}
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex max-w-[85%] mr-auto justify-start">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 rounded-bl-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/10 bg-[#0f141f] shrink-0 relative">
              {/* Image Preview Thumbnail */}
              <AnimatePresence>
                {selectedImage && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full mb-2 left-4 w-16 h-16 rounded-xl overflow-hidden border border-white/20 shadow-lg"
                  >
                    <img src={selectedImage} alt="Upload" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setSelectedImage(null)} 
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 hover:bg-black/90 transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleImageUpload} 
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-brand-blue transition-colors rounded-full hover:bg-white/5 shrink-0"
                >
                  <Camera className="w-5 h-5" />
                </button>
                
                <button 
                  onClick={startRecording}
                  className={cn("p-2 transition-colors rounded-full shrink-0", isRecording ? "text-red-400 bg-red-400/20 animate-pulse" : "text-gray-400 hover:text-brand-green hover:bg-white/5")}
                >
                  <Mic className="w-5 h-5" />
                </button>
                
                <input 
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask the Oracle..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors min-w-0"
                />
                
                {abortController ? (
                  <button 
                    onClick={handleStop}
                    className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-full transition-colors shrink-0"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button 
                    onClick={handleSend}
                    disabled={!message.trim() && !selectedImage}
                    className="p-2 bg-brand-blue hover:bg-brand-blue/80 text-white rounded-full transition-colors disabled:opacity-50 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

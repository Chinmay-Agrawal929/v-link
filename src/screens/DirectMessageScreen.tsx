import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Send, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';

export default function DirectMessageScreen({ 
  chatId, 
  recipientName, 
  isOfficial, 
  onClose 
}: { 
  chatId: string;
  recipientName: string;
  isOfficial?: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!replyText.trim() || !auth.currentUser) return;
    
    try {
      const text = replyText;
      setReplyText('');
      
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        senderId: auth.currentUser.uid,
        text: text,
        timestamp: serverTimestamp(),
        reactions: {}
      });
      

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        lastUpdated: serverTimestamp()
      });
      
      // Trigger Push Notification via Backend
      try {
        // Find recipient UID by looking at participants array in the chat doc
        // (Assuming we have a way to know the recipient, or we just send it to a generic endpoint that looks it up)
        // For simplicity in this direct message screen, we just notify the API.
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUid: 'recipient_uid_placeholder', // The API would look up the other participant
            title: `New message from ${auth.currentUser.displayName || 'someone'}`,
            body: text,
            data: { chatId }
          })
        });
      } catch (err) {
        console.error("Failed to trigger FCM:", err);
      }

    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleReaction = async (msgId: string, emoji: string) => {
    if (!auth.currentUser || !msgId) return;
    
    try {
      const msg = messages.find(m => m.id === msgId);
      if (!msg) return;

      const currentReactions = msg.reactions || {};
      const userCurrentReaction = currentReactions[auth.currentUser.uid];
      
      const newReactions = { ...currentReactions };
      
      // Toggle off if clicking the same reaction, otherwise set new
      if (userCurrentReaction === emoji) {
        delete newReactions[auth.currentUser.uid];
      } else {
        newReactions[auth.currentUser.uid] = emoji;
      }

      await updateDoc(doc(db, `chats/${chatId}/messages`, msgId), {
        reactions: newReactions
      });
      
      setActiveReactionMsgId(null);
    } catch (err) {
      console.error("Error adding reaction:", err);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-50 bg-brand-dark flex flex-col"
    >
      <div className="h-14 glass-panel border-b border-white/10 flex items-center px-2 shrink-0">
        <button 
          onClick={onClose}
          className="p-2 mr-2 text-gray-400 hover:text-white rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-dark border border-white/10 overflow-hidden">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${recipientName}`} alt="Avatar" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-1">
              {recipientName}
              {isOfficial && <BadgeCheck className="w-4 h-4 text-brand-blue" />}
            </h3>
            <p className="text-[10px] text-gray-400">VIT Chennai Platform</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col no-scrollbar">
        {messages.map((msg, index) => {
          const isMine = msg.senderId === auth.currentUser?.uid;
          const reactions = msg.reactions || {};
          const reactionCounts = Object.values(reactions).reduce((acc: any, emoji: any) => {
            acc[emoji] = (acc[emoji] || 0) + 1;
            return acc;
          }, {});
          const hasReactions = Object.keys(reactionCounts).length > 0;
          
          return (
            <div 
              key={msg.id || index} 
              className={cn("max-w-[80%] mb-4 relative group flex flex-col", isMine ? "self-end items-end" : "self-start items-start")}
              onMouseEnter={() => setActiveReactionMsgId(msg.id)}
              onMouseLeave={() => setActiveReactionMsgId(null)}
            >
              <AnimatePresence>
                {activeReactionMsgId === msg.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className={cn(
                      "absolute -top-11 z-20 glass-panel bg-[#1A1F2A]/95 border border-white/10 rounded-full px-2 py-1.5 flex gap-1 shadow-2xl",
                      isMine ? "right-0" : "left-0"
                    )}
                  >
                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                      <button 
                        key={emoji}
                        onClick={() => handleReaction(msg.id, emoji)}
                        className={cn(
                          "hover:scale-125 hover:bg-white/10 transition-all p-1 text-lg leading-none rounded-full",
                          reactions[auth.currentUser?.uid || ''] === emoji ? "bg-white/20" : ""
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div 
                onClick={() => setActiveReactionMsgId(prev => prev === msg.id ? null : msg.id)}
                className={cn("p-3 text-sm leading-relaxed shadow-lg cursor-pointer transition-transform active:scale-[0.98]", 
                isMine 
                  ? "rounded-2xl rounded-tr-sm text-white bg-[#0A66C2]" 
                  : "rounded-2xl rounded-tl-sm text-gray-200 bg-[rgba(255,255,255,0.1)] backdrop-blur-md border border-white/10"
              )}>
                {msg.text}
              </div>

              {hasReactions && (
                <div className={cn(
                  "flex flex-wrap gap-1 mt-1 z-10", 
                  isMine ? "justify-end" : "justify-start"
                )}>
                  {Object.entries(reactionCounts).map(([emoji, count]) => (
                    <button 
                      key={emoji} 
                      className={cn(
                        "bg-[#1A1F2A] border border-white/10 rounded-full px-2 py-0.5 text-[11px] flex items-center gap-1 shadow-sm transition-colors hover:bg-white/10",
                        reactions[auth.currentUser?.uid || ''] === emoji ? "border-brand-blue/50 bg-brand-blue/10" : ""
                      )}
                      onClick={() => handleReaction(msg.id, emoji)}
                    >
                      <span>{emoji}</span>
                      {Number(count) > 1 && <span className="text-[10px] text-gray-400">{String(count)}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/10 bg-black/20 flex gap-3 pb-safe">
        <input 
          type="text" 
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Message..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
        />
        <button onClick={handleSend} disabled={!replyText.trim()} className="w-10 h-10 rounded-full bg-brand-blue flex items-center justify-center text-white shrink-0 hover:bg-brand-blue/80 transition-colors disabled:opacity-50">
          <Send className="w-4 h-4 -ml-0.5" />
        </button>
      </div>
    </motion.div>
  );
}

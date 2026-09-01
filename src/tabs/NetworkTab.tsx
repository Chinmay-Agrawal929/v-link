import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Users, ChevronRight, UserPlus, Clock, BadgeCheck, ChevronLeft, Send, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, Message } from '@/store';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, query, limit, onSnapshot, where, orderBy, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import DirectMessageScreen from '@/screens/DirectMessageScreen';

const MOCK_PEOPLE = [
  { id: 101, name: 'Vikram Singh', role: '1st Year CSE', skills: ['React', 'Node.js', 'Figma'], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram' },
  { id: 102, name: 'Sneha Reddy', role: '3rd Year IT', skills: ['Java', 'Spring', 'MySQL'], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha' },
  { id: 103, name: 'Rohan Verma', role: 'Design Lead', skills: ['Framer', 'Three.js', 'UI/UX'], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan' },
  { id: 104, name: 'Aisha Khan', role: 'Cybersecurity', skills: ['Python', 'Linux', 'AWS'], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha' },
];

import { useQuery , useMutation, useQueryClient} from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import SkillExchange from '@/components/SkillExchange';

export default function NetworkTab() {
  const { activeNetworkTab, setNetworkTab, messages, markMessageRead, user } = useAppStore();
  const [pendingConnects, setPendingConnects] = useState<string[]>([]);
  const [openedMessage, setOpenedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [localReplies, setLocalReplies] = useState<{id: string, text: string, time: string}[]>([]);
  const { data: suggestedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const q = query(collection(db, 'users'), limit(20));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.id !== auth.currentUser?.uid);
    },
    staleTime: 1000 * 60 * 5,
  });

  
  const queryClient = useQueryClient();
  const connectMutation = useMutation({
    mutationFn: async (userId: string) => {
      // In a real app, this would create a connection request doc in Firestore
      // For now, we simulate a small network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return userId;
    },
    onMutate: async (userId) => {
      // Cancel any outgoing refetches
      // await queryClient.cancelQueries({ queryKey: ['network'] })
      // Optimistically update to pending state
      setPendingConnects(prev => [...prev, userId]);
      return { previousConnects: pendingConnects };
    },
    onError: (err, userId, context) => {
      if (context?.previousConnects) {
        setPendingConnects(context.previousConnects);
      }
    },
    onSettled: () => {
      // queryClient.invalidateQueries({ queryKey: ['network'] })
    }
  });

  const handleConnect = async (userId: string) => {
    connectMutation.mutate(userId);
  };

  const endorseMutation = useMutation({
    mutationFn: async ({ userId, skill, action }: { userId: string, skill: string, action: 'add' | 'remove' }) => {
      const currentUid = auth.currentUser?.uid;
      if (!currentUid) return;
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const endorsements = data.skillEndorsements || {};
        let skillList = endorsements[skill] || [];
        
        if (action === 'add') {
          if (!skillList.includes(currentUid)) skillList.push(currentUid);
        } else {
          skillList = skillList.filter((id: string) => id !== currentUid);
        }
        
        await updateDoc(docRef, {
          [`skillEndorsements.${skill}`]: skillList
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const handleEndorse = (e: React.MouseEvent, userId: string, skill: string, isEndorsed: boolean) => {
    e.stopPropagation();
    endorseMutation.mutate({ userId, skill, action: isEndorsed ? 'remove' : 'add' });
  };

  const [firestoreChats, setFirestoreChats] = useState<any[]>([]);
  const [firestoreMessages, setFirestoreMessages] = useState<any[]>([]);

  useEffect(() => {
    if (activeNetworkTab === 'messages' && auth.currentUser) {
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', auth.currentUser.uid),
        // orderBy('timestamp', 'desc') // Removed to avoid missing index error
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const chatData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        chatData.sort((a, b) => {
          const timeA = a.lastUpdated?.toMillis ? a.lastUpdated.toMillis() : 0;
          const timeB = b.lastUpdated?.toMillis ? b.lastUpdated.toMillis() : 0;
          return timeB - timeA;
        });
        setFirestoreChats(chatData);
      });
      return () => unsubscribe();
    }
  }, [activeNetworkTab]);

  useEffect(() => {
    if (openedMessage && auth.currentUser) {
      const q = query(
        collection(db, `chats/${openedMessage.id}/messages`),
        orderBy('timestamp', 'asc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFirestoreMessages(msgs);
      });
      return () => unsubscribe();
    }
  }, [openedMessage]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), limit(10));
        const snapshot = await getDocs(q);
        const users = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(u => u.id !== user?.regNo && u.id !== user?.email); // exclude self if possible
        
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, [user]);



  const handleOpenMessage = (msg: Message) => {
    markMessageRead(msg.id);
    setOpenedMessage(msg);
    setLocalReplies([]);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [firestoreMessages]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !openedMessage || !auth.currentUser) return;
    
    try {
      const text = replyText;
      setReplyText('');
      await addDoc(collection(db, `chats/${openedMessage.id}/messages`), {
        senderId: auth.currentUser.uid,
        text: text,
        lastUpdated: serverTimestamp()
      });
      await updateDoc(doc(db, 'chats', openedMessage.id), {
        lastMessage: text,
        lastUpdated: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar relative">
      
      {/* Sticky Tabs */}
      <div className="sticky top-0 z-20 bg-brand-dark/95 backdrop-blur-md border-b border-white/10 px-4 pt-3 flex gap-6">
        <button 
          onClick={() => setNetworkTab('network')}
          className={cn(
            "pb-3 text-sm font-semibold transition-colors relative flex items-center gap-1.5",
            activeNetworkTab === 'network' ? "text-white" : "text-gray-500"
          )}
        >
          Network
          {activeNetworkTab === 'network' && <motion.div layoutId="net-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-blue" />}
        </button>
        <button 
          onClick={() => setNetworkTab('messages')}
          className={cn(
            "pb-3 text-sm font-semibold transition-colors relative flex items-center gap-1.5",
            activeNetworkTab === 'messages' ? "text-white" : "text-gray-500"
          )}
        >
          Messages 
          {messages.some(m => m.unread) && (
            <span className="bg-brand-blue text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {messages.filter(m => m.unread).length}
            </span>
          )}
          {activeNetworkTab === 'messages' && <motion.div layoutId="net-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-blue" />}
        </button>
        <button 
          onClick={() => setNetworkTab('skills')}
          className={cn(
            "pb-3 text-sm font-semibold transition-colors relative flex items-center gap-1.5",
            activeNetworkTab === 'skills' ? "text-white" : "text-gray-500"
          )}
        >
          Skills
          {activeNetworkTab === 'skills' && <motion.div layoutId="net-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-blue" />}
        </button>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4 pb-6">
        <AnimatePresence mode="wait">
          {activeNetworkTab === 'network' && (
            <motion.div key="network" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              
              {/* Empty Connections State */}
              <div className="glass-panel mb-6 rounded-2xl overflow-hidden p-8 flex flex-col items-center justify-center text-center">
                <Users className="w-12 h-12 text-gray-500 mb-3" />
                <h3 className="text-white font-semibold mb-1">No connections yet</h3>
                <p className="text-sm text-gray-400">You don't have any connections yet. Start networking!</p>
              </div>

              {/* People You May Know */}
              <h2 className="text-sm font-semibold text-white mb-3 pl-1">Developers you may know</h2>
              <div className="grid grid-cols-2 gap-4">
                {suggestedUsers.map((person: any) => {
                  const isPending = pendingConnects.includes(person.id);
                  return (
                    <div key={person.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col pb-3 relative hover:bg-white/10 transition-colors">
                      <div className="h-14 bg-gradient-to-r from-brand-blue/20 to-brand-green/20 absolute top-0 left-0 right-0 z-0" />
                      <div className="flex flex-col items-center pt-5 px-3 z-10">
                        <img src={person.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} alt="" className="w-16 h-16 rounded-full bg-brand-dark border-4 border-brand-dark object-cover mb-2" />
                        <h4 className="font-semibold text-white text-sm text-center line-clamp-1">{person.name}</h4>
                        <p className="text-[11px] text-gray-400 text-center line-clamp-1 mt-0.5">{person.branch || person.role}</p>
                        
                        <div className="flex flex-wrap justify-center gap-1 mt-2 mb-2 h-10 overflow-hidden">
                          {(person.skills || []).slice(0, 3).map((s: string, i: number) => {
                            const isEndorsed = auth.currentUser ? person.skillEndorsements?.[s]?.includes(auth.currentUser.uid) : false;
                            const endorseCount = person.skillEndorsements?.[s]?.length || 0;
                            return (
                              <button 
                                key={i} 
                                onClick={(e) => handleEndorse(e, person.id, s, isEndorsed)}
                                className={cn(
                                  "text-[9px] font-mono border px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors hover:opacity-80",
                                  isEndorsed 
                                    ? "text-brand-blue bg-brand-blue/20 border-brand-blue/30" 
                                    : "text-brand-green bg-brand-green/10 border-brand-green/20"
                                )}
                              >
                                {s}
                                {endorseCount > 0 && (
                                  <span className="flex items-center gap-0.5 ml-0.5">
                                    <ThumbsUp className="w-2 h-2" />{endorseCount}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {isPending ? (
                          <button disabled className="mt-1 w-full py-2 rounded-lg bg-white/5 text-gray-400 font-semibold text-sm flex items-center justify-center gap-1 border border-white/10">
                            <Clock className="w-4 h-4" /> Pending
                          </button>
                        ) : (
                          <button onClick={async () => {
                            if (!auth.currentUser) return;
                            const currentUid = auth.currentUser.uid;
                            const targetUid = person.id;
                            // check if chat exists
                            const q = query(
                              collection(db, 'chats'),
                              where('participants', 'array-contains', currentUid)
                            );
                            const snap = await getDocs(q);
                            let existingChat = null;
                            snap.forEach(doc => {
                              const d = doc.data();
                              if (d.participants && d.participants.includes(targetUid)) {
                                existingChat = { id: doc.id, ...d };
                              }
                            });
                            
                            if (existingChat) {
                              setOpenedMessage({ ...existingChat, sender: person.name || 'Unknown', lastMessage: existingChat.lastMessage, timestamp: 'Recently', isOfficial: false, unread: false });
                            } else {
                              const newChatRef = await addDoc(collection(db, 'chats'), {
                                participants: [currentUid, targetUid],
                                participantNames: [user?.name || 'Unknown', person.name || 'Unknown'],
                                lastMessage: 'Chat started',
                                lastUpdated: serverTimestamp()
                              });
                              setOpenedMessage({ id: newChatRef.id, sender: person.name || 'Unknown', lastMessage: 'Chat started', timestamp: 'Recently', isOfficial: false, unread: false });
                            }
                          }} className="mt-1 w-full py-2 rounded-lg bg-brand-blue/10 text-brand-blue font-semibold text-sm flex items-center justify-center gap-1 hover:bg-brand-blue hover:text-white transition-colors">
                            <Send className="w-4 h-4" /> Message
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
          {activeNetworkTab === 'messages' && (
            <motion.div key="messages" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <div className="glass-panel rounded-2xl overflow-hidden">
                {firestoreChats.length > 0 ? firestoreChats.map((chat, idx) => {
                  const otherParticipant = chat.participantNames ? chat.participantNames.find((n: string) => n !== user?.name) : 'Unknown User';
                  return (
                  <div 
                    key={chat.id} 
                    onClick={() => setOpenedMessage({ ...chat, sender: otherParticipant, lastMessage: chat.lastMessage, timestamp: 'Recently', isOfficial: false, unread: false })}
                    className={cn(
                      "p-4 flex gap-4 cursor-pointer transition-colors border-b border-white/5 last:border-0 hover:bg-white/5",
                      chat.unread ? "bg-white/[0.02]" : ""
                    )}
                  >
                    <div className="w-12 h-12 rounded-full bg-brand-dark border border-white/10 flex items-center justify-center flex-shrink-0 relative">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherParticipant}`} className="w-full h-full object-cover rounded-full" alt="avatar"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={cn("text-sm truncate flex items-center gap-1", chat.unread ? "font-bold text-white" : "font-semibold text-gray-300")}>
                          {otherParticipant}
                        </h4>
                      </div>
                      <p className={cn("text-xs line-clamp-2 pr-4", chat.unread ? "font-semibold text-gray-300" : "text-gray-400")}>
                        {chat.lastMessage}
                      </p>
                    </div>
                  </div>
                )}) : (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    No conversations yet. Connect with someone to start chatting!
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {activeNetworkTab === 'skills' && (
            <motion.div key="skills" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <SkillExchange />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Overlay */}
      <AnimatePresence>
        {openedMessage && (
          <DirectMessageScreen 
            chatId={openedMessage.id} 
            recipientName={openedMessage.sender} 
            isOfficial={openedMessage.isOfficial}
            onClose={() => setOpenedMessage(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

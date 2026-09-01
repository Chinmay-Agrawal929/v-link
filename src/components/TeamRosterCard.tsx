import React, { useState } from 'react';
import { User, Send, CheckCircle2 } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';

interface TeamRosterCardProps {
  user: {
    uid: string;
    name: string;
    branch?: string;
    skills?: string[];
    matching_skills?: string[];
  };
}

export default function TeamRosterCard({ user }: TeamRosterCardProps) {
  const [requestState, setRequestState] = useState<'idle' | 'loading' | 'sent'>('idle');
  const { user: currentUser } = useAppStore();

  const handleSendRequest = async () => {
    if (!auth.currentUser) return;
    setRequestState('loading');
    
    try {
      const currentUid = auth.currentUser.uid;
      const targetUid = user.uid;
      
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', currentUid)
      );
      const snap = await getDocs(q);
      let existingChatId = null;
      snap.forEach(d => {
        const data = d.data();
        if (data.participants && data.participants.includes(targetUid)) {
          existingChatId = d.id;
        }
      });
      
      const messageText = `Hey ${user.name}! The V-Link Oracle suggested we team up for a project requiring ${user.matching_skills?.join(', ')}. Are you open to collaborating?`;
      
      let chatIdToUse = existingChatId;

      if (!existingChatId) {
        const newChatRef = await addDoc(collection(db, 'chats'), {
          participants: [currentUid, targetUid],
          participantNames: [currentUser?.name || 'Unknown', user.name || 'Unknown'],
          lastMessage: messageText,
          lastUpdated: serverTimestamp()
        });
        chatIdToUse = newChatRef.id;
      } else {
        await updateDoc(doc(db, 'chats', existingChatId), {
          lastMessage: messageText,
          lastUpdated: serverTimestamp()
        });
      }
      
      await addDoc(collection(db, `chats/${chatIdToUse}/messages`), {
        senderId: currentUid,
        text: messageText,
        timestamp: serverTimestamp()
      });
      
      setRequestState('sent');
    } catch (err) {
      console.error("Error sending request:", err);
      setRequestState('idle');
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-dark flex items-center justify-center shrink-0 border border-white/10">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="avatar" className="w-full h-full rounded-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white text-sm truncate">{user.name}</h4>
          <p className="text-xs text-brand-blue font-medium truncate">{user.branch || 'VIT Student'}</p>
        </div>
      </div>
      
      {user.matching_skills && user.matching_skills.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Matching Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {user.matching_skills.map((skill, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-medium bg-brand-green/20 text-brand-green border border-brand-green/30">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <button 
        onClick={handleSendRequest}
        disabled={requestState !== 'idle'}
        className={cn(
          "mt-2 w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors",
          requestState === 'idle' ? "bg-brand-blue hover:bg-brand-blue/80 text-white" : 
          requestState === 'loading' ? "bg-brand-blue/50 text-white/70" : 
          "bg-white/10 text-brand-green cursor-default"
        )}
      >
        {requestState === 'idle' && (
          <>
            <Send className="w-3.5 h-3.5" />
            Send Request
          </>
        )}
        {requestState === 'loading' && "Sending..."}
        {requestState === 'sent' && (
          <>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Request Sent
          </>
        )}
      </button>
    </div>
  );
}

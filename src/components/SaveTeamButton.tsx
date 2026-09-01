import React, { useState } from 'react';
import { Bookmark, CheckCircle2 } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function SaveTeamButton({ roster, projectContext }: { roster: any[], projectContext?: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'saved'>('idle');

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setStatus('loading');
    
    // Simplistic project name generation from context or default
    let projectName = "AI Generated Team";
    if (projectContext) {
      if (projectContext.toLowerCase().includes("hackathon")) {
        projectName = "Hackathon Squad";
      } else if (projectContext.toLowerCase().includes("project")) {
        projectName = "New Project Team";
      }
    }

    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/saved_teams`), {
        projectName,
        members: roster.map(u => ({
          uid: u.uid,
          name: u.name,
          branch: u.branch || '',
          role: u.matching_skills?.[0] || 'Member'
        })),
        createdAt: serverTimestamp()
      });
      setStatus('saved');
    } catch (e) {
      console.error(e);
      setStatus('idle');
    }
  };

  return (
    <button 
      onClick={handleSave}
      disabled={status !== 'idle'}
      className={cn(
        "mt-4 w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg",
        status === 'idle' ? "bg-white/10 hover:bg-white/20 text-white border border-white/20" : 
        status === 'loading' ? "bg-white/5 text-white/50 border border-white/10" : 
        "bg-brand-green/20 text-brand-green border border-brand-green/30 cursor-default"
      )}
    >
      {status === 'idle' && (
        <>
          <Bookmark className="w-4 h-4" />
          Save Team to Workspace
        </>
      )}
      {status === 'loading' && "Saving..."}
      {status === 'saved' && (
        <>
          <CheckCircle2 className="w-4 h-4" />
          Saved!
        </>
      )}
    </button>
  );
}

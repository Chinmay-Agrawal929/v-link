import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '@/store';
import { X, Image, Github, Award, BarChart2, Clock, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';

export default function CreatePostModal() {
  const { isCreateModalOpen, setCreateModalOpen, user } = useAppStore();
  const { draftPostContent, setDraftPostContent, showGlobalToast } = useAppStore();
  const [content, setContent] = useState(draftPostContent);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [image, setImage] = useState<string | null>(null);
  const [snippet, setSnippet] = useState<string>('');
  const [showSnippetInput, setShowSnippetInput] = useState(false);
  const [visibility, setVisibility] = useState<'Anyone' | 'Connections' | 'Only me'>('Anyone');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleVisibility = () => {
    if (visibility === 'Anyone') setVisibility('Connections');
    else if (visibility === 'Connections') setVisibility('Only me');
    else setVisibility('Anyone');
  };

  const handlePublish = async () => {
    if ((!content.trim() && !image && !snippet.trim()) || !user) return;
    setIsPublishing(true);
    
    try {
      await addDoc(collection(db, 'posts'), {
        authorId: user.regNo || 'unknown',
        authorName: user.name,
        content: content.trim(),
        image: image || null,
        snippet: snippet.trim() || null,
        visibility: visibility,
        likes: 0,
        timestamp: serverTimestamp()
      });
      
      setCreateModalOpen(false);
      setContent('');
      setImage(null);
      setSnippet('');
      setShowSnippetInput(false);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      showGlobalToast("Post successfully published!");
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <AnimatePresence>
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCreateModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto hidden md:block"
          />
          <motion.div 
            initial={{ y: '100%', opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full h-[100dvh] md:h-auto md:max-h-[85vh] md:w-[600px] bg-brand-dark md:rounded-3xl border-t md:border border-white/10 flex flex-col overflow-hidden pointer-events-auto md:shadow-2xl z-10"
          >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCreateModalOpen(false)}
              className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-white">Share post</h2>
          </div>
          <button 
            disabled={(!content.trim() && !image && !snippet.trim()) || isPublishing}
            onClick={handlePublish}
            className={cn(
              "px-5 py-2 rounded-full font-bold text-sm transition-colors flex items-center gap-2",
              (content.trim() || image || snippet.trim()) ? "bg-brand-blue text-white hover:bg-brand-blue/80" : "bg-white/5 text-gray-500"
            )}
          >
            {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Post
          </button>
        </div>

        {/* User Info */}
        <div className="px-5 py-4 flex items-center gap-3 shrink-0">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt="Avatar" className="w-12 h-12 rounded-full border border-white/10 bg-white/5" />
          <div>
            <h3 className="font-semibold text-white text-sm">{user?.name}</h3>
            <button 
              onClick={toggleVisibility}
              className="flex items-center gap-1 border border-gray-600 text-gray-400 rounded-full px-2.5 py-0.5 mt-1 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span className="text-[11px] font-semibold">{visibility}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 px-5 flex flex-col gap-4 overflow-y-auto pb-4">
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What do you want to talk about?"
            className="w-full min-h-[120px] resize-none text-lg text-white bg-transparent placeholder-gray-500 focus:outline-none py-2 shrink-0"
          />
          
          {image && (
            <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shrink-0">
              <button 
                onClick={() => setImage(null)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <img src={image} alt="Upload preview" className="w-full h-auto max-h-[300px] object-cover" />
            </div>
          )}

          {showSnippetInput && (
            <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0D1117] p-3 shrink-0">
              <button 
                onClick={() => { setShowSnippetInput(false); setSnippet(''); }}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-2 text-gray-400">
                <Github className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Code Snippet</span>
              </div>
              <textarea
                value={snippet}
                onChange={(e) => setSnippet(e.target.value)}
                placeholder="Paste your code snippet here..."
                className="w-full min-h-[100px] resize-none font-mono text-sm text-gray-300 bg-transparent placeholder-gray-600 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="px-5 py-4 flex items-center gap-4 text-gray-400 border-t border-white/10 bg-black/20 shrink-0">
          <input 
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={cn("p-2 -ml-2 rounded-full hover:bg-white/10 hover:text-white transition-colors", image && "text-brand-blue")}
          >
            <Image className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setShowSnippetInput(true)}
            className={cn("p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors", showSnippetInput && "text-brand-blue")}
          >
            <Github className="w-6 h-6" />
          </button>
          <button className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-not-allowed opacity-50">
            <Award className="w-6 h-6" />
          </button>
          <button className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-not-allowed opacity-50">
            <BarChart2 className="w-6 h-6" />
          </button>
          <button className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors ml-auto cursor-not-allowed opacity-50">
            <Clock className="w-6 h-6" />
          </button>
        </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

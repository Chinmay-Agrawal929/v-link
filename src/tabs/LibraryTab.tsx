import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Search, Plus, ExternalLink, FileText, Link as LinkIcon, File, ThumbsUp, Trash2, Loader2, X } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, increment } from 'firebase/firestore';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

interface Resource {
  id: string;
  title: string;
  description: string;
  courseCode: string;
  type: 'document' | 'note' | 'link';
  url: string;
  authorId: string;
  authorName: string;
  upvotes: number;
  createdAt: any;
}

export default function LibraryTab() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newType, setNewType] = useState<'document' | 'note' | 'link'>('document');
  const [newUrl, setNewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, showGlobalToast } = useAppStore();

  useEffect(() => {
    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedResources = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resource[];
      setResources(loadedResources);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleCreateResource = async () => {
    if (!newTitle.trim() || !newCourseCode.trim() || !newUrl.trim() || !auth.currentUser) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'resources'), {
        title: newTitle,
        description: newDescription,
        courseCode: newCourseCode.toUpperCase().replace(/\s+/g, ''),
        type: newType,
        url: newUrl,
        authorId: auth.currentUser.uid,
        authorName: user?.name || 'Anonymous',
        upvotes: 0,
        createdAt: serverTimestamp()
      });
      
      setNewTitle('');
      setNewDescription('');
      setNewCourseCode('');
      setNewUrl('');
      setIsAdding(false);
      showGlobalToast('Resource added successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to add resource.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (resourceId: string) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'resources', resourceId), {
        upvotes: increment(1)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!auth.currentUser || !window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      await deleteDoc(doc(db, 'resources', resourceId));
      showGlobalToast('Resource deleted');
    } catch (e) {
      console.error(e);
    }
  };

  const filteredResources = resources.filter(res => {
    const q = searchQuery.toLowerCase();
    return (
      res.title.toLowerCase().includes(q) ||
      res.courseCode.toLowerCase().includes(q) ||
      res.description.toLowerCase().includes(q)
    );
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="w-5 h-5 text-blue-400" />;
      case 'note': return <File className="w-5 h-5 text-green-400" />;
      case 'link': return <LinkIcon className="w-5 h-5 text-purple-400" />;
      default: return <BookOpen className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto px-4 pb-24 no-scrollbar">
      <div className="flex items-center justify-between mb-4 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Resource Library</h1>
          <p className="text-gray-400 text-sm">Course materials, notes & links</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-10 h-10 rounded-full bg-brand-blue flex items-center justify-center text-white shadow-lg shadow-brand-blue/30 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by course code or topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-white/5 text-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-brand-blue sm:text-sm transition-colors"
        />
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="glass-panel p-5 rounded-3xl mb-6 border border-brand-blue/30 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-lg">Share a Resource</h3>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">Title</label>
                <input 
                  type="text" 
                  placeholder="e.g., Chapter 4 Study Guide" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">Course Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g., CSE1001" 
                    value={newCourseCode}
                    onChange={e => setNewCourseCode(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue"
                  >
                    <option value="document">Document (PDF/Doc)</option>
                    <option value="note">Notes</option>
                    <option value="link">External Link</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">URL (Drive, GitHub, etc.)</label>
                <input 
                  type="url" 
                  placeholder="https://..." 
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">Description (Optional)</label>
                <textarea 
                  placeholder="Briefly describe what this covers..." 
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue resize-none"
                />
              </div>

              <button 
                onClick={handleCreateResource}
                disabled={!newTitle.trim() || !newCourseCode.trim() || !newUrl.trim() || isSubmitting}
                className="w-full py-3 rounded-xl bg-brand-blue text-white font-bold flex justify-center items-center gap-2 disabled:opacity-50 mt-2 hover:bg-brand-blue/80 transition-colors"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Share Resource'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-300 font-medium mb-1">No resources found</p>
          <p className="text-gray-500 text-sm max-w-[200px]">Be the first to share notes or links for this topic.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResources.map(resource => (
            <div key={resource.id} className="glass-panel p-5 rounded-3xl flex flex-col group relative">
              {auth.currentUser?.uid === resource.authorId && (
                <button 
                  onClick={() => handleDelete(resource.id)}
                  className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 bg-black/40 rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  {getIcon(resource.type)}
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-brand-blue/20 text-brand-blue text-[10px] font-bold tracking-wider border border-brand-blue/30 uppercase">
                      {resource.courseCode}
                    </span>
                    <span className="text-xs text-gray-400 truncate">
                      Shared by {resource.authorName}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-lg leading-tight mb-1 truncate">
                    {resource.title}
                  </h3>
                </div>
              </div>
              
              {resource.description && (
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {resource.description}
                </p>
              )}
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                <button 
                  onClick={() => handleUpvote(resource.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-brand-green transition-colors text-sm border border-transparent hover:border-brand-green/30"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="font-medium">{resource.upvotes || 0}</span>
                </button>
                
                <a 
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue text-white hover:bg-brand-blue/80 transition-colors text-sm font-bold shadow-lg shadow-brand-blue/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

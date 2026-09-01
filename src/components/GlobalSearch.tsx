import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, User as UserIcon, FileText } from 'lucide-react';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';

export default function GlobalSearch() {
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<{users: any[], posts: any[]}>({ users: [], posts: [] });
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { setTab } = useAppStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults({ users: [], posts: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const queryText = searchQuery.toLowerCase();
        
        // Simple client-side filtering over a recent snapshot for quick demo search
        const [usersSnap, postsSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), limit(100))),
          getDocs(query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(100)))
        ]);

        const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const allPosts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

        const filteredUsers = allUsers.filter(u => 
          u.name?.toLowerCase().includes(queryText) || 
          u.branch?.toLowerCase().includes(queryText) ||
          u.headline?.toLowerCase().includes(queryText)
        ).slice(0, 5);

        const filteredPosts = allPosts.filter(p => 
          p.content?.toLowerCase().includes(queryText) ||
          p.authorName?.toLowerCase().includes(queryText)
        ).slice(0, 5);

        setResults({ users: filteredUsers, posts: filteredPosts });
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="flex-1 relative" ref={wrapperRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search students, posts..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-400 text-sm rounded-xl flex items-center pl-10 pr-4 py-2 focus:outline-none focus:border-brand-blue transition-colors"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFocused && searchQuery.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#0D1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] max-h-[60vh] overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-4 text-center text-gray-400 text-sm">Searching...</div>
            ) : results.users.length === 0 && results.posts.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">No results found for "{searchQuery}"</div>
            ) : (
              <div className="flex flex-col py-2">
                {results.users.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">People</div>
                    {results.users.map((u: any) => (
                      <button 
                        key={u.id}
                        onClick={() => {
                          setIsFocused(false);
                          setTab('network');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-3 transition-colors"
                      >
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover bg-white/10" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-blue/20 text-brand-blue flex items-center justify-center shrink-0">
                            <UserIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{u.name}</div>
                          <div className="text-xs text-gray-400 truncate">{u.branch || u.headline}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {results.posts.length > 0 && (
                  <div>
                    <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Posts</div>
                    {results.posts.map((p: any) => (
                      <button 
                        key={p.id}
                        onClick={() => {
                          setIsFocused(false);
                          setTab('home');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-white/5 flex gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-brand-green/20 text-brand-green flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-300 line-clamp-2">{p.content}</div>
                          <div className="text-xs text-gray-500 mt-1">by {p.authorName}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

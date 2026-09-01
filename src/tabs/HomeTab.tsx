import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageSquare, Share2, MoreHorizontal, Check, X, Search, Share, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, limit, orderBy, startAfter, doc, updateDoc, increment } from 'firebase/firestore';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const PostCard = ({ post, onLike, onShare }: { post: any, onLike: () => void, onShare: () => void }) => {
  return (
    <div className="glass-panel p-4 rounded-3xl mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-dark overflow-hidden border border-white/10">
            <img src={post.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName || post.author}`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{post.authorName || post.author}</h3>
            <p className="text-xs text-gray-400">{post.role || 'Student'} • {post.timestamp?.toDate ? new Date(post.timestamp.toDate()).toLocaleTimeString() : 'Recently'}</p>
          </div>
        </div>
        <button className="text-gray-500 hover:text-white transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      
      <p className="text-gray-200 text-sm mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      
      {post.image && (
        <div className="w-full h-48 rounded-2xl overflow-hidden mb-4 border border-white/10">
          <img src={post.image} alt="Post content" className="w-full h-full object-cover" />
        </div>
      )}
      
      {post.snippet && (
        <div className="w-full bg-[#0D1117] rounded-xl p-3 mb-4 overflow-x-auto border border-white/5 font-mono text-xs text-gray-300">
          <pre><code>{post.snippet}</code></pre>
        </div>
      )}
      
      <div className="flex justify-between items-center text-xs text-gray-400 mb-3 px-1">
        <span>{post.likes || 0} likes</span>
      </div>
      
      <div className="flex items-center justify-between border-t border-white/10 pt-3">
        <button 
          onClick={onLike}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors flex-1 justify-center",
            post.isLiked ? "text-brand-blue bg-brand-blue/10" : "text-gray-400 hover:bg-white/5 hover:text-white"
          )}
        >
          <Heart className={cn("w-5 h-5", post.isLiked && "fill-brand-blue")} /> Like
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-400 font-semibold text-sm hover:bg-white/5 hover:text-white transition-colors flex-1 justify-center">
          <MessageSquare className="w-5 h-5" /> Comment
        </button>
        <button 
          onClick={onShare}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-400 font-semibold text-sm hover:bg-white/5 hover:text-white transition-colors flex-1 justify-center"
        >
          <Share2 className="w-5 h-5" /> Send
        </button>
      </div>
    </div>
  );
};

export default function HomeTab() {
  const [sendSheetOpen, setSendSheetOpen] = useState(false);
  const [activePost, setActivePost] = useState<any>(null);
  const [sentTo, setSentTo] = useState<number[]>([]);
  
  const { addNotification, addMessage } = useAppStore();
  const observerTarget = useRef(null);
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: async ({ pageParam = null }) => {
      const postsRef = collection(db, 'posts');
      let q = query(postsRef, orderBy('timestamp', 'desc'), limit(5));
      if (pageParam) {
        q = query(postsRef, orderBy('timestamp', 'desc'), startAfter(pageParam), limit(5));
      }
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return {
        docs,
        lastVisible: snapshot.docs[snapshot.docs.length - 1] || null
      };
    },
    getNextPageParam: (lastPage) => lastPage.lastVisible,
    initialPageParam: null as any
  });

  const rawPosts = data?.pages.flatMap(page => page.docs) || [];
  
  const posts = rawPosts.reduce((acc: any[], current: any) => {
    if (!acc.find(item => item.id === current.id)) {
      acc.push(current);
    }
    return acc;
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const likeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string, isLiked: boolean }) => {
      await updateDoc(doc(db, 'posts', postId.toString()), {
        likes: increment(isLiked ? 1 : -1)
      });
    },
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueryData(['posts']);
      
      queryClient.setQueryData(['posts'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            docs: page.docs.map((p: any) => 
              p.id === postId ? { ...p, isLiked, likes: (p.likes || 0) + (isLiked ? 1 : -1) } : p
            )
          }))
        };
      });
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['posts'], context?.previousPosts);
    }
  });

  const handleLike = (post: any) => {
    const isLiked = !post.isLiked;
    likeMutation.mutate({ postId: post.id, isLiked });
    if (isLiked) addNotification(`You liked ${post.authorName || post.author}'s post`);
  };

  const openSendSheet = (post: any) => {
    setActivePost(post);
    setSentTo([]);
    setSendSheetOpen(true);
  };

  const handleShareVia = async () => {
    if (activePost && navigator.share) {
      try {
        await navigator.share({
          title: 'v-link post',
          text: activePost.content,
        });
      } catch (err) {}
    }
  };

  const handleSendToUser = (userId: number) => {
    if (!sentTo.includes(userId)) {
      setSentTo([...sentTo, userId]);
      addNotification(`Post forwarded to your connection!`);
      if (activePost) {
        addMessage({
          id: Date.now().toString(),
          sender: `VIT Developer ${userId}`,
          isOfficial: false,
          unread: true,
          timestamp: 'Just now',
          content: `You forwarded a post:\n\n> ${activePost.content}\n\nShared from ${activePost.authorName || activePost.author}`
        });
      }
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar relative">
      <div className="max-w-xl mx-auto px-4 pt-2 pb-6">
        {posts.map((post) => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <PostCard 
              post={post} 
              onLike={() => handleLike(post)} 
              onShare={() => openSendSheet(post)} 
            />
          </motion.div>
        ))}
        <div ref={observerTarget} className="py-6 flex justify-center items-center h-20">
          {isFetchingNextPage && (
            <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {sendSheetOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setSendSheetOpen(false)}
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
                if (info.offset.y > 100) setSendSheetOpen(false);
              }}
              className="absolute bottom-0 left-0 right-0 z-50 h-[80dvh] bg-brand-dark/95 border-t border-white/10 rounded-t-[32px] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="flex-shrink-0 flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 rounded-full bg-white/20" />
              </div>
              <div className="px-6 py-2 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Send to</h2>
                <button 
                  onClick={() => setSendSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Search connections..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Conn${i}`} alt="Avatar" className="w-12 h-12 rounded-full bg-white/10" />
                      <div>
                        <p className="text-white font-semibold">VIT Developer {i}</p>
                        <p className="text-xs text-gray-400">Connection</p>
                      </div>
                    </div>
                    {sentTo.includes(i) ? (
                      <button disabled className="px-4 py-1.5 rounded-full bg-brand-green/20 border border-brand-green/30 text-brand-green font-semibold text-sm flex items-center gap-1">
                        <Check className="w-4 h-4" /> Sent
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleSendToUser(i)}
                        className="px-4 py-1.5 rounded-full bg-brand-blue hover:bg-brand-blue/80 text-white font-semibold text-sm transition-colors"
                      >
                        Send
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-white/5 bg-white/5">
                <button 
                  onClick={handleShareVia}
                  className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <Share className="w-5 h-5" />
                  Share via...
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

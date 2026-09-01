import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, X, GraduationCap, Code, Loader2, MessageSquare, BookOpen } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

interface SkillProfile {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userAvatar: string;
  skillsToOffer: string[];
  skillsToLearn: string[];
  updatedAt?: any;
}

export default function SkillExchange() {
  const { user, showGlobalToast } = useAppStore();
  
  const [profiles, setProfiles] = useState<SkillProfile[]>([]);
  const [myProfile, setMyProfile] = useState<SkillProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [offerInput, setOfferInput] = useState('');
  const [learnInput, setLearnInput] = useState('');
  const [offerTags, setOfferTags] = useState<string[]>([]);
  const [learnTags, setLearnTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Listen to all skill profiles
    const q = query(collection(db, 'skill_profiles'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SkillProfile[];
      
      const me = loaded.find(p => p.id === auth.currentUser?.uid);
      if (me) {
        setMyProfile(me);
        if (!isEditing) {
          setOfferTags(me.skillsToOffer || []);
          setLearnTags(me.skillsToLearn || []);
        }
      }
      
      setProfiles(loaded.filter(p => p.id !== auth.currentUser?.uid));
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [isEditing]);

  const handleAddTag = (type: 'offer' | 'learn') => {
    if (type === 'offer' && offerInput.trim()) {
      if (!offerTags.includes(offerInput.trim())) {
        setOfferTags([...offerTags, offerInput.trim()]);
      }
      setOfferInput('');
    } else if (type === 'learn' && learnInput.trim()) {
      if (!learnTags.includes(learnInput.trim())) {
        setLearnTags([...learnTags, learnInput.trim()]);
      }
      setLearnInput('');
    }
  };

  const handleRemoveTag = (type: 'offer' | 'learn', tag: string) => {
    if (type === 'offer') {
      setOfferTags(offerTags.filter(t => t !== tag));
    } else {
      setLearnTags(learnTags.filter(t => t !== tag));
    }
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    
    try {
      await setDoc(doc(db, 'skill_profiles', auth.currentUser.uid), {
        userId: auth.currentUser.uid,
        userName: user?.name || 'Anonymous',
        userRole: user?.role || 'Student',
        userAvatar: user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`,
        skillsToOffer: offerTags,
        skillsToLearn: learnTags,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setIsEditing(false);
      showGlobalToast('Skill profile updated!');
    } catch (e) {
      console.error(e);
      alert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.userName.toLowerCase().includes(q) ||
      p.skillsToOffer.some(s => s.toLowerCase().includes(q)) ||
      p.skillsToLearn.some(s => s.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-20 mt-4 space-y-6">
      
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by skill or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-white/5 text-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-brand-blue transition-colors"
        />
      </div>

      {/* My Profile */}
      <div className="glass-panel p-5 rounded-3xl border border-brand-blue/30 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-brand-blue" />
            My Skill Profile
          </h3>
          <button 
            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
            className="text-sm font-semibold px-4 py-1.5 rounded-full bg-brand-blue text-white hover:bg-brand-blue/80 transition-colors flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? 'Save' : 'Edit'}
          </button>
        </div>

        {isEditing ? (
          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">Skills I can teach</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g., React, Python" 
                  value={offerInput}
                  onChange={e => setOfferInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTag('offer')}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
                />
                <button 
                  onClick={() => handleAddTag('offer')}
                  className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 hover:bg-white/20 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {offerTags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-medium flex items-center gap-1">
                    {tag}
                    <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => handleRemoveTag('offer', tag)} />
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">Skills I want to learn</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g., UI Design, Rust" 
                  value={learnInput}
                  onChange={e => setLearnInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTag('learn')}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
                />
                <button 
                  onClick={() => handleAddTag('learn')}
                  className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 hover:bg-white/20 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {learnTags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-brand-blue/20 text-brand-blue border border-brand-blue/30 rounded-full text-xs font-medium flex items-center gap-1">
                    {tag}
                    <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => handleRemoveTag('learn', tag)} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-medium text-gray-400 mb-2">Can Teach</h4>
              {myProfile?.skillsToOffer && myProfile.skillsToOffer.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {myProfile.skillsToOffer.map(s => (
                    <span key={s} className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No skills listed to offer.</p>
              )}
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-400 mb-2">Want to Learn</h4>
              {myProfile?.skillsToLearn && myProfile.skillsToLearn.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {myProfile.skillsToLearn.map(s => (
                    <span key={s} className="px-3 py-1 bg-brand-blue/10 text-brand-blue border border-brand-blue/20 rounded-full text-xs font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No skills listed to learn.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Others' Profiles */}
      <div>
        <h3 className="font-bold text-white text-lg mb-4">Peer Mentors</h3>
        
        {filteredProfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 glass-panel rounded-3xl">
            <BookOpen className="w-8 h-8 text-gray-400 mb-3" />
            <p className="text-gray-300 font-medium mb-1">No matches found</p>
            <p className="text-gray-500 text-sm max-w-[200px]">Try searching for different skills or names.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProfiles.map(profile => (
              <div key={profile.id} className="glass-panel p-5 rounded-3xl relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full border border-white/10 overflow-hidden bg-white/5">
                    <img src={profile.userAvatar} alt={profile.userName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white">{profile.userName}</h4>
                    <p className="text-xs text-gray-400">{profile.userRole}</p>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-colors border border-white/10">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {profile.skillsToOffer?.length > 0 && (
                    <div>
                      <h5 className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Code className="w-3 h-3 text-green-400" />
                        Offers
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.skillsToOffer.map(s => (
                          <span key={s} className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md text-xs">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.skillsToLearn?.length > 0 && (
                    <div>
                      <h5 className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <GraduationCap className="w-3 h-3 text-brand-blue" />
                        Seeking
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.skillsToLearn.map(s => (
                          <span key={s} className="px-2 py-0.5 bg-brand-blue/10 text-brand-blue border border-brand-blue/20 rounded-md text-xs">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

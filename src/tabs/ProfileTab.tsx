
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';

import { useAppStore } from '@/store';
import { Camera, User, MapPin, Building2, Users, FileText, Plus, BookOpen, Award, Github, ThumbsUp, RefreshCw, Upload, Briefcase, Edit3, CheckCircle2 } from 'lucide-react';


export default function ProfileTab() {
  const { user, updateAvatar } = useAppStore();
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [aboutText, setAboutText] = useState('');
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState('');
  
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [newCert, setNewCert] = useState('');

  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editRegNo, setEditRegNo] = useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  const { data: profileData } = useQuery({
    queryKey: ['profile', auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser) return null;
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    },
    enabled: !!auth.currentUser,
  });

  const addSkillMutation = useMutation({
    mutationFn: async (skill: string) => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, {
        skills: arrayUnion(skill)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', auth.currentUser?.uid] });
      setIsSkillModalOpen(false);
      setNewSkill('');
      showToast('Skill added successfully!');
    }
  });
  
  const updateAboutMutation = useMutation({
    mutationFn: async (about: string) => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, { about });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', auth.currentUser?.uid] });
      setIsAboutModalOpen(false);
      showToast('About section updated!');
    }
  });

  const addProjectMutation = useMutation({
    mutationFn: async (project: string) => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, { projects: arrayUnion(project) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', auth.currentUser?.uid] });
      setIsProjectModalOpen(false);
      setNewProject('');
      showToast('Project added successfully!');
    }
  });

  const addCertMutation = useMutation({
    mutationFn: async (cert: string) => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, { certifications: arrayUnion(cert) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', auth.currentUser?.uid] });
      setIsCertModalOpen(false);
      setNewCert('');
      showToast('Certification added!');
    }
  });

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      addSkillMutation.mutate(newSkill.trim());
    }
  };
  
  const handleAddAbout = () => {
    updateAboutMutation.mutate(aboutText.trim());
  };

  const handleAddProject = () => {
    if (newProject.trim()) {
      addProjectMutation.mutate(newProject.trim());
    }
  };

  const handleAddCert = () => {
    if (newCert.trim()) {
      addCertMutation.mutate(newCert.trim());
    }
  };

  const updateAvatarMutation = useMutation({
    mutationFn: async (url: string) => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, { avatarUrl: url });
      updateAvatar(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', auth.currentUser?.uid] });
      setIsAvatarModalOpen(false);
      showToast('Avatar updated!');
    }
  });

  const updateCoverMutation = useMutation({
    mutationFn: async (url: string) => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, { coverUrl: url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', auth.currentUser?.uid] });
      setIsCoverModalOpen(false);
      showToast('Cover photo updated!');
    }
  });

  const updateProfileInfoMutation = useMutation({
    mutationFn: async ({ name, branch, regNo }: { name: string, branch: string, regNo: string }) => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, { name, branch, regNo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', auth.currentUser?.uid] });
      setIsEditProfileModalOpen(false);
      showToast('Profile info updated!');
    }
  });

  const handleGenerateRandomIcon = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
    updateAvatarMutation.mutate(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateAvatarMutation.mutate(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateCoverMutation.mutate(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProfileSubmit = () => {
    updateProfileInfoMutation.mutate({
      name: editName,
      branch: editBranch,
      regNo: editRegNo
    });
  };

  const displayUser = profileData || user;

  if (!displayUser) return null;


  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar pb-6">
      <div className="max-w-xl mx-auto px-4 pt-4">
        
        {/* Hero Section */}
        <div className="glass-panel rounded-3xl overflow-hidden mb-4 relative">
          <div className="h-32 bg-white/5 relative border-b border-white/5 flex items-center justify-center">
            {displayUser.coverUrl && (
              <img src={displayUser.coverUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <button 
              onClick={() => setIsCoverModalOpen(true)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-brand-dark/50 px-4 py-2 rounded-full border border-white/10 shadow-lg backdrop-blur-md relative z-10"
            >
              <Camera className="w-4 h-4" />
              <span className="text-sm font-semibold">{displayUser.coverUrl ? 'Edit Cover' : 'Add Cover'}</span>
            </button>
          </div>
          
          <div className="px-6 pb-6">
            <div className="relative -mt-16 mb-4 flex justify-between items-end">
              <div 
                onClick={() => setIsAvatarModalOpen(true)}
                className="w-32 h-32 rounded-full border-4 border-brand-dark overflow-hidden bg-[#1A1F2A] relative z-10 flex flex-col items-center justify-center cursor-pointer hover:bg-[#202634] transition-colors border-dashed"
              >
                {displayUser.avatarUrl ? (
                  <img src={displayUser.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-brand-blue mb-1" />
                    <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider text-center">Upload<br/>Photo</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between items-start">
              <div 
                className="cursor-pointer group"
                onClick={() => {
                  setEditName(displayUser.name);
                  setEditBranch(displayUser.branch || '');
                  setEditRegNo(displayUser.regNo || '');
                  setIsEditProfileModalOpen(true);
                }}
              >
                <h1 className="text-2xl font-bold text-white leading-tight group-hover:text-brand-blue transition-colors flex items-center gap-2">
                  {displayUser.name} <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h1>
                <p className="font-mono text-brand-green text-sm mt-1 flex items-center gap-2">
                  {displayUser.regNo}
                  {displayUser.githubConnected && (
                    <span className="bg-brand-green/20 text-brand-green px-2 py-0.5 rounded-full text-xs border border-brand-green/30 flex items-center gap-1 font-sans">
                      <Github className="w-3 h-3" /> Connected
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-400 mt-1">{displayUser.branch}</p>
                <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>VIT Chennai Campus</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end text-sm text-gray-400 font-semibold cursor-default">
                  <Building2 className="w-5 h-5" />
                  <span>Vellore Institute of Technology</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-brand-blue font-semibold mt-4">
              <Users className="w-5 h-5" />
              <span>{displayUser.connections} connections</span>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => {
                  setEditName(displayUser.name);
                  setEditBranch(displayUser.branch || '');
                  setEditRegNo(displayUser.regNo || '');
                  setIsEditProfileModalOpen(true);
                }}
                className="flex-1 bg-brand-blue text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-blue/90 transition-colors flex justify-center items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="glass-panel rounded-3xl mb-4 p-6">
          <h2 className="text-lg font-bold text-white mb-1">Activity Streak</h2>
          <p className="text-xs text-gray-400 mb-4">24 contributions in the last 49 days</p>
          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-2 items-center justify-center">
            {Array.from({ length: 7 }).map((_, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, rowIndex) => {
                  const level = Math.random() > 0.6 ? Math.floor(Math.random() * 4) + 1 : 0;
                  return (
                    <div 
                      key={rowIndex} 
                      className={`w-5 h-5 rounded-sm ${
                        level === 0 ? 'bg-white/5' :
                        level === 1 ? 'bg-brand-green/30' :
                        level === 2 ? 'bg-brand-green/60' :
                        level === 3 ? 'bg-brand-green/80' :
                        'bg-brand-green'
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* About Section Empty State */}
        {displayUser.about ? (
          <div className="glass-panel rounded-3xl mb-4 p-6 relative group">
            <h2 className="text-lg font-bold text-white mb-2">About</h2>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{displayUser.about}</p>
            <button 
              onClick={() => { setAboutText(displayUser.about); setIsAboutModalOpen(true); }}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all text-gray-400 hover:text-white"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="glass-panel rounded-3xl mb-4 p-6 flex flex-col items-center justify-center text-center py-10">
            <FileText className="w-10 h-10 text-gray-500 mb-3" />
            <h2 className="text-lg font-bold text-white mb-2">About</h2>
            <p className="text-sm text-gray-400 mb-5 max-w-sm">Write a summary to highlight your personality, work experience, or coding interests.</p>
            <button 
              onClick={() => setIsAboutModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full font-semibold border border-white/10 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" /> Add About Summary
            </button>
          </div>
        )}

        {/* Skills Section */}
        {displayUser.skills.length > 0 ? (
          <div className="glass-panel rounded-3xl mb-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-6 h-6 text-brand-blue" />
              <h2 className="text-lg font-bold text-white">Skills</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {displayUser.skills.map((skill: string, idx: number) => {
                const endorseCount = displayUser.skillEndorsements?.[skill]?.length || 0;
                return (
                  <div key={idx} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-sm font-medium flex items-center gap-2">
                    {skill}
                    {endorseCount > 0 && (
                      <span className="flex items-center gap-1 text-brand-blue bg-brand-blue/10 px-1.5 py-0.5 rounded-full text-xs border border-brand-blue/20">
                        <ThumbsUp className="w-3 h-3" />
                        {endorseCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-3xl mb-4 p-6 flex flex-col items-center justify-center text-center py-10">
            <BookOpen className="w-10 h-10 text-gray-500 mb-3" />
            <h2 className="text-lg font-bold text-white mb-2">Skills</h2>
            <p className="text-sm text-gray-400 mb-5 max-w-sm">Showcase your tech stack and languages to attract connections and recruiters.</p>
            <button 
              onClick={() => setIsSkillModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full font-semibold border border-white/10 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" /> Add Skills
            </button>
          </div>
        )}

        {/* Projects & Certifications Section */}
        {(displayUser.certifications?.length > 0 || displayUser.projects?.length > 0) ? (
          <div className="glass-panel rounded-3xl mb-4 p-6">
            {displayUser.projects?.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-6 h-6 text-brand-blue" />
                    <h2 className="text-lg font-bold text-white">Projects</h2>
                  </div>
                  <button onClick={() => setIsProjectModalOpen(true)} className="text-brand-blue hover:text-white p-1 transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {displayUser.projects.map((proj: string, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue border border-brand-blue/30 shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{proj}</h3>
                        <p className="text-sm text-gray-400">Personal Project</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {displayUser.certifications?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-brand-green" />
                    <h2 className="text-lg font-bold text-white">Certifications</h2>
                  </div>
                  <button onClick={() => setIsCertModalOpen(true)} className="text-brand-green hover:text-white p-1 transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {displayUser.certifications.map((cert: string, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green border border-brand-green/30 shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{cert}</h3>
                        <p className="text-sm text-gray-400">Verified Certification</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel rounded-3xl mb-4 p-6 flex flex-col items-center justify-center text-center py-10">
            <Award className="w-10 h-10 text-gray-500 mb-3" />
            <h2 className="text-lg font-bold text-white mb-2">Projects & Certifications</h2>
            <p className="text-sm text-gray-400 mb-5 max-w-sm">Highlight your GitHub repos, hackathon wins, or online course certificates.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsProjectModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold border border-white/10 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" /> Add Project
              </button>
              <button 
                onClick={() => setIsCertModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold border border-white/10 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" /> Add Certification
              </button>
            </div>
          </div>
        )}

      </div>

      <AnimatePresence>
        {isCoverModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCoverModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm glass-panel bg-brand-dark/95 border border-white/10 p-6 rounded-3xl shadow-2xl z-50"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Update Cover Photo</h3>
                <button onClick={() => setIsCoverModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
              </div>

              <input 
                type="file"
                accept="image/*"
                ref={coverInputRef}
                onChange={handleCoverUpload}
                className="hidden"
              />

              <div className="space-y-3">
                <button 
                  onClick={() => coverInputRef.current?.click()}
                  disabled={updateCoverMutation.isPending}
                  className="w-full bg-brand-blue hover:bg-brand-blue/80 text-white font-bold rounded-xl py-4 flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-70"
                >
                  <Upload className="w-6 h-6" />
                  <span>Upload from Camera / Gallery</span>
                </button>
              </div>
            </motion.div>
          </>
        )}

        {isEditProfileModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsEditProfileModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm glass-panel bg-brand-dark/95 border border-white/10 p-6 rounded-3xl shadow-2xl z-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Edit Profile</h3>
                <button onClick={() => setIsEditProfileModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <div className="flex flex-col gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-1 block">Full Name</label>
                  <input 
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-1 block">Registration Number</label>
                  <input 
                    type="text"
                    value={editRegNo}
                    onChange={(e) => setEditRegNo(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-1 block">Branch / Major</label>
                  <input 
                    type="text"
                    value={editBranch}
                    onChange={(e) => setEditBranch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>
              <button 
                onClick={handleEditProfileSubmit}
                disabled={!editName.trim() || updateProfileInfoMutation.isPending}
                className="w-full bg-brand-blue hover:bg-brand-blue/80 text-white font-bold rounded-xl py-3 flex justify-center items-center gap-2"
              >
                {updateProfileInfoMutation.isPending ? 'Saving...' : <><Check className="w-5 h-5"/> Save Profile</>}
              </button>
            </motion.div>
          </>
        )}

        {isAvatarModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAvatarModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm glass-panel bg-brand-dark/95 border border-white/10 p-6 rounded-3xl shadow-2xl z-50"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Update Profile Photo</h3>
                <button onClick={() => setIsAvatarModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
              </div>

              <input 
                type="file"
                accept="image/*"
                capture="user"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="space-y-3">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={updateAvatarMutation.isPending}
                  className="w-full bg-brand-blue hover:bg-brand-blue/80 text-white font-bold rounded-xl py-4 flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-70"
                >
                  <Upload className="w-6 h-6" />
                  <span>Upload from Camera / Gallery</span>
                </button>

                <div className="text-center text-xs text-gray-500 font-medium py-1">OR</div>

                <button 
                  onClick={handleGenerateRandomIcon}
                  disabled={updateAvatarMutation.isPending}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl py-4 flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-70"
                >
                  <RefreshCw className="w-6 h-6 text-brand-green" />
                  <span>Generate Random Icon</span>
                </button>
              </div>
            </motion.div>
          </>
        )}

        {isSkillModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSkillModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm glass-panel bg-brand-dark/95 border border-white/10 p-6 rounded-3xl shadow-2xl z-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Add Skill</h3>
                <button onClick={() => setIsSkillModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <input 
                type="text"
                autoFocus
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                placeholder="e.g. React Native, Machine Learning..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue mb-4"
              />
              <button 
                onClick={handleAddSkill}
                disabled={!newSkill.trim() || addSkillMutation.isPending}
                className="w-full bg-brand-green hover:bg-brand-green/80 text-white font-bold rounded-xl py-3 flex justify-center items-center gap-2"
              >
                {addSkillMutation.isPending ? 'Saving...' : <><Check className="w-5 h-5"/> Save Skill</>}
              </button>
            </motion.div>
          </>
        )}

        {isAboutModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAboutModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm glass-panel bg-brand-dark/95 border border-white/10 p-6 rounded-3xl shadow-2xl z-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">About Me</h3>
                <button onClick={() => setIsAboutModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <textarea 
                autoFocus
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                placeholder="Write a short summary about yourself..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue mb-4 resize-none"
              />
              <button 
                onClick={handleAddAbout}
                disabled={!aboutText.trim() || updateAboutMutation.isPending}
                className="w-full bg-brand-blue hover:bg-brand-blue/80 text-white font-bold rounded-xl py-3 flex justify-center items-center gap-2"
              >
                {updateAboutMutation.isPending ? 'Saving...' : <><Check className="w-5 h-5"/> Save About</>}
              </button>
            </motion.div>
          </>
        )}

        {isProjectModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsProjectModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm glass-panel bg-brand-dark/95 border border-white/10 p-6 rounded-3xl shadow-2xl z-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Add Project</h3>
                <button onClick={() => setIsProjectModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <input 
                type="text"
                autoFocus
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
                placeholder="e.g. V-Link Network App, AI Hackathon Project"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue mb-4"
              />
              <button 
                onClick={handleAddProject}
                disabled={!newProject.trim() || addProjectMutation.isPending}
                className="w-full bg-brand-blue hover:bg-brand-blue/80 text-white font-bold rounded-xl py-3 flex justify-center items-center gap-2"
              >
                {addProjectMutation.isPending ? 'Saving...' : <><Check className="w-5 h-5"/> Save Project</>}
              </button>
            </motion.div>
          </>
        )}

        {isCertModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCertModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm glass-panel bg-brand-dark/95 border border-white/10 p-6 rounded-3xl shadow-2xl z-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Add Certification</h3>
                <button onClick={() => setIsCertModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <input 
                type="text"
                autoFocus
                value={newCert}
                onChange={(e) => setNewCert(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCert()}
                placeholder="e.g. AWS Solutions Architect, Meta Front-End"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue mb-4"
              />
              <button 
                onClick={handleAddCert}
                disabled={!newCert.trim() || addCertMutation.isPending}
                className="w-full bg-brand-green hover:bg-brand-green/80 text-white font-bold rounded-xl py-3 flex justify-center items-center gap-2"
              >
                {addCertMutation.isPending ? 'Saving...' : <><Check className="w-5 h-5"/> Save Certification</>}
              </button>
            </motion.div>
          </>
        )}
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] glass-panel bg-brand-green/20 border border-brand-green/30 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-md whitespace-nowrap"
          >
            <CheckCircle2 className="w-5 h-5 text-brand-green" />
            <span className="text-sm font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


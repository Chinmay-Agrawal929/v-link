import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '@/store';
import { Github, Code, Award, ChevronRight, Check, X, Loader2, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function ProfileSetupWizard() {
  const { completeSetup, connectGithub, showGlobalToast } = useAppStore();
  
  const [step, setStep] = useState(1);
  
  // Academic Details
  const [regNo, setRegNo] = useState('');
  const [branch, setBranch] = useState('');
  const [graduationYear, setGraduationYear] = useState('');

  // GitHub
  const [githubConnected, setGithubConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Skills
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  
  // Certifications
  const [certInput, setCertInput] = useState('');
  const [certs, setCerts] = useState<string[]>([]);

  const handleConnectGithub = () => {
    setIsConnecting(true);
    setTimeout(async () => {
      setGithubConnected(true);
      connectGithub();
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          githubConnected: true
        });
      }
      setIsConnecting(false);
    }, 1500);
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleAddCert = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && certInput.trim()) {
      if (!certs.includes(certInput.trim())) {
        setCerts([...certs, certInput.trim()]);
      }
      setCertInput('');
    }
  };

  const handleRemoveCert = (cert: string) => {
    setCerts(certs.filter(c => c !== cert));
  };

  
  const requestPushPermissions = async () => {
    try {
      // Simulating expo-notifications or web push permissions
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const mockExpoPushToken = 'ExponentPushToken[' + Math.random().toString(36).substring(7) + ']';
        if (auth.currentUser) {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            fcmToken: mockExpoPushToken
          });
        }
      }
    } catch (err) {
      console.warn("Push permissions failed", err);
    }
  };

  const nextStep = async () => {
    if (step < 4) {
      if (step === 1 && (!regNo || !branch || !graduationYear)) {
        return; // require all fields for academic details
      }
      setStep(step + 1);
    } else {
      setIsSaving(true);
      try {
        if (auth.currentUser) {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            regNo,
            branch,
            graduationYear,
            skills,
            certifications: certs,
            hasCompletedSetup: true
          });
        }
        completeSetup({ regNo, branch, graduationYear, skills, certs });
        showGlobalToast("Profile successfully configured!");
      } catch (err) {
        console.error("Error saving setup:", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-dark/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm relative h-[500px]">
        {/* Progress indicators */}
        <div className="absolute -top-12 left-0 right-0 flex justify-center gap-2">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === step ? "w-8 bg-brand-blue" : i < step ? "w-8 bg-brand-green" : "w-2 bg-white/20"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if ((offset.x < -50 || velocity.x < -500) && regNo && branch && graduationYear) { requestPushPermissions(); nextStep(); }
              }}
              className="absolute inset-0 glass-panel rounded-3xl p-8 flex flex-col"
            >
              <div className="w-14 h-14 rounded-full bg-brand-blue/20 flex items-center justify-center mb-6 border border-brand-blue/30 text-brand-blue">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Academic Profile</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Enter your university details to connect with peers.
              </p>
              
              <div className="space-y-4 mb-4">
                <input 
                  type="text"
                  value={regNo}
                  onChange={e => setRegNo(e.target.value)}
                  placeholder="Registration Number (e.g. 26BCE1234)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
                />
                <input 
                  type="text"
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  placeholder="Department (e.g. B.Tech CSE)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
                />
                <input 
                  type="text"
                  value={graduationYear}
                  onChange={e => setGraduationYear(e.target.value)}
                  placeholder="Graduation Year (e.g. 2026)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
                />
              </div>

              <button 
                onClick={() => { requestPushPermissions(); nextStep(); }}
                disabled={!regNo || !branch || !graduationYear}
                className="w-full py-4 mt-auto rounded-xl bg-brand-blue text-white font-semibold flex items-center justify-center gap-2 hover:bg-brand-blue/80 transition-colors disabled:opacity-50"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.x < -50 || velocity.x < -500) nextStep();
                if (offset.x > 50 || velocity.x > 500) setStep(1);
              }}
              className="absolute inset-0 glass-panel rounded-3xl p-8 flex flex-col"
            >
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-6 border border-white/20">
                <Github className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Connect GitHub</h2>
              <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                Sync your GitHub account to automatically display your tech stack, repositories, and daily commit streak on your profile.
              </p>
              
              <div className="mt-auto">
                {githubConnected ? (
                  <div className="w-full py-4 rounded-xl bg-brand-green/20 text-brand-green border border-brand-green/30 flex items-center justify-center gap-2 font-semibold mb-4">
                    <Check className="w-5 h-5" /> Connected
                  </div>
                ) : (
                  <button 
                    onClick={handleConnectGithub}
                    disabled={isConnecting}
                    className="w-full py-4 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 mb-4 hover:bg-gray-200 transition-colors disabled:opacity-80"
                  >
                    {isConnecting ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <Github className="w-5 h-5" /> Connect Account
                      </>
                    )}
                  </button>
                )}
                
                <button 
                  onClick={nextStep}
                  className="w-full py-4 rounded-xl bg-brand-blue text-white font-semibold flex items-center justify-center gap-2 hover:bg-brand-blue/80 transition-colors"
                >
                  {githubConnected ? 'Continue' : 'Skip for now'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.x < -50 || velocity.x < -500) nextStep();
                if (offset.x > 50 || velocity.x > 500) setStep(2);
              }}
              className="absolute inset-0 glass-panel rounded-3xl p-8 flex flex-col"
            >
              <div className="w-14 h-14 rounded-full bg-brand-blue/20 flex items-center justify-center mb-6 border border-brand-blue/30 text-brand-blue">
                <Code className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Add your skills</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                What languages and frameworks do you use? (Press Enter to add)
              </p>
              
              <input 
                type="text"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                placeholder="e.g. React, Python, Java"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 mb-4 focus:outline-none focus:border-brand-blue"
              />

              <div className="flex flex-wrap gap-2 overflow-y-auto max-h-32 no-scrollbar mb-4">
                {skills.map(skill => (
                  <div key={skill} className="px-3 py-1.5 rounded-full bg-white/10 text-white text-sm flex items-center gap-2">
                    {skill}
                    <button onClick={() => handleRemoveSkill(skill)} className="text-gray-400 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={nextStep}
                className="w-full py-4 mt-auto rounded-xl bg-brand-blue text-white font-semibold flex items-center justify-center gap-2 hover:bg-brand-blue/80 transition-colors"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.x < -50 || velocity.x < -500) nextStep();
                if (offset.x > 50 || velocity.x > 500) setStep(3);
              }}
              className="absolute inset-0 glass-panel rounded-3xl p-8 flex flex-col"
            >
              <div className="w-14 h-14 rounded-full bg-brand-green/20 flex items-center justify-center mb-6 border border-brand-green/30 text-brand-green">
                <Award className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Certifications</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Add any online courses, AWS certifications, or hackathon wins.
              </p>
              
              <input 
                type="text"
                value={certInput}
                onChange={e => setCertInput(e.target.value)}
                onKeyDown={handleAddCert}
                placeholder="e.g. AWS Cloud Practitioner"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 mb-4 focus:outline-none focus:border-brand-blue"
              />

              <div className="flex flex-wrap gap-2 overflow-y-auto max-h-32 no-scrollbar mb-4">
                {certs.map(cert => (
                  <div key={cert} className="px-3 py-1.5 rounded-full bg-white/10 text-white text-sm flex items-center gap-2">
                    {cert}
                    <button onClick={() => handleRemoveCert(cert)} className="text-gray-400 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={nextStep}
                disabled={isSaving}
                className="w-full py-4 mt-auto rounded-xl bg-brand-blue text-white font-semibold flex items-center justify-center gap-2 hover:bg-brand-blue/80 transition-colors disabled:opacity-70"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Complete Setup <Check className="w-4 h-4" /></>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

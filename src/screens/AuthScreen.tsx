import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ShieldAlert, GraduationCap, ChevronLeft, Link, Mail, CheckCircle2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AuthScreen() {
  const [step, setStep] = useState<'role' | 'email' | 'otp'>('role');
  const [role, setRole] = useState<'student' | 'faculty' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const otp = otpValues.join('');

  const handleRoleSelect = (selectedRole: 'student' | 'faculty' | 'admin') => {
    setRole(selectedRole);
    setStep('email');
    setError('');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Strict domain validation
    const domain = email.split('@')[1];
    if (domain !== 'vitstudent.ac.in' && domain !== 'vit.ac.in') {
      setError('Access Restricted: Valid VIT email required (@vitstudent.ac.in or @vit.ac.in).');
      return;
    }
    if (role === 'student' && domain !== 'vitstudent.ac.in') {
      setError(`Access Restricted: Valid VIT student email required (@vitstudent.ac.in).`);
      return;
    }
    if ((role === 'faculty' || role === 'admin') && domain !== 'vit.ac.in') {
      setError(`Access Restricted: Valid VIT ${role} email required (@vit.ac.in).`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      if (data.mockCode) {
        // In development without SMTP, alert the mock code so the user can test
        
      }
      
      setStep('otp');
      setCountdown(30);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    if (value && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');

      // Secure simulated login via Firebase
      const secureMockPassword = `vlink_otp_${email}`;
      
      try {
        const cred = await signInWithEmailAndPassword(auth, email, secureMockPassword);
        
        // Initialize profile setup wizard mock data if new
        const userRef = doc(db, 'users', cred.user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            name: "VIT Student",
            regNo: "",
            branch: "",
            email: cred.user.email,
            role: role,
            createdAt: new Date().toISOString()
          });
        }
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
          const cred = await createUserWithEmailAndPassword(auth, email, secureMockPassword);
          
          const userRef = doc(db, 'users', cred.user.uid);
          await setDoc(userRef, {
            name: "VIT Student",
            regNo: "",
            branch: "",
            email: cred.user.email,
            role: role,
            createdAt: new Date().toISOString()
          });
        } else {
          throw signInErr;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-brand-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-brand-blue/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-green/10 rounded-full blur-[100px] pointer-events-none" />
      
      <AnimatePresence mode="wait">
        {step === 'role' ? (
          <motion.div 
            key="role"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm z-10"
          >
            <div className="flex items-center gap-2 mb-8 justify-center text-white">
              <Link size={40} color="#0084FF" strokeWidth={3} />
              <h1 className="text-3xl font-bold tracking-tight">v-link</h1>
            </div>
            
            <div className="space-y-4">
              <button onClick={() => handleRoleSelect('student')} className="w-full glass-panel p-6 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors border border-white/10">
                <div className="w-12 h-12 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue border border-brand-blue/30">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">Student</h3>
                  <p className="text-xs text-gray-400">VIT Chennai Scholars</p>
                </div>
              </button>
              
              <button onClick={() => handleRoleSelect('faculty')} className="w-full glass-panel p-6 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors border border-white/10">
                <div className="w-12 h-12 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green border border-brand-green/30">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">Faculty</h3>
                  <p className="text-xs text-gray-400">Mentors & Professors</p>
                </div>
              </button>

              <button onClick={() => handleRoleSelect('admin')} className="w-full glass-panel p-6 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors border border-white/10">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">Admin</h3>
                  <p className="text-xs text-gray-400">v-link Platform Staff</p>
                </div>
              </button>
            </div>
          </motion.div>
        ) : step === 'email' ? (
          <motion.div 
            key="email"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm glass-panel rounded-3xl shadow-lg p-8 z-10"
          >
            <button 
              onClick={() => setStep('role')} 
              className="text-gray-400 hover:text-white mb-6 flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            
            <div className="flex flex-col mb-6">
              <div className="flex items-center gap-2 mb-2 text-white">
                <Link size={32} color="#0084FF" strokeWidth={3} />
                <h1 className="text-2xl font-bold tracking-tight">v-link</h1>
              </div>
              <h2 className="text-xl font-semibold text-white mb-1">
                {role === 'student' ? 'Student Sign in' : role === 'faculty' ? 'Faculty Sign in' : 'Admin Sign in'}
              </h2>
              <p className="text-sm text-gray-400">Secure OTP Verification</p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`@${role === 'student' ? 'vitstudent.ac.in' : 'vit.ac.in'}`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors font-sans"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm py-1 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full mt-6 bg-brand-blue hover:bg-brand-blue/80 text-white font-semibold rounded-xl py-3.5 flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-70 gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Send Magic Code'
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-sm glass-panel rounded-3xl shadow-lg p-8 z-10"
          >
            <button 
              onClick={() => setStep('email')} 
              className="text-gray-400 hover:text-white mb-6 flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            
            <div className="flex flex-col mb-8 text-center">
              <div className="w-12 h-12 bg-brand-green/20 text-brand-green rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-green/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-1">Enter Verification Code</h2>
              <p className="text-sm text-gray-400">Enter the 6-digit code sent to<br/><span className="text-white font-medium">{email}</span></p>
              
              {countdown > 0 ? (
                <p className="text-xs text-brand-green mt-3 px-2 py-1 bg-brand-green/10 rounded-lg border border-brand-green/20">Resend available in {countdown}s</p>
              ) : (
                <button type="button" onClick={handleSendOtp} className="text-xs text-brand-blue mt-3 px-2 py-1 bg-brand-blue/10 hover:bg-brand-blue/20 rounded-lg border border-brand-blue/20 transition-colors">Resend Code</button>
              )}
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex justify-between gap-2 mb-6">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    ref={otpRefs[index]}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otpValues[index]}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 bg-white/5 border border-white/10 rounded-2xl text-center text-2xl font-mono text-white placeholder-gray-600 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all shadow-inner"
                  />
                ))}
              </div>

              {error && (
                <p className="text-red-400 text-sm py-1 font-medium text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-brand-green hover:bg-brand-green/80 text-white font-semibold rounded-xl py-3.5 flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Verify Code'
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const fs = require('fs');
let code = fs.readFileSync('src/screens/AuthScreen.tsx', 'utf8');

// Replace imports
code = code.replace(
  "import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';",
  "import { signInWithCustomToken } from 'firebase/auth';\nimport { doc, getDoc, setDoc } from 'firebase/firestore';\nimport { db } from '@/lib/firebase';"
);

// Add useEffect for countdown timer
if (!code.includes("useEffect")) {
  code = code.replace("import React, { useState, useRef } from 'react';", "import React, { useState, useRef, useEffect } from 'react';");
}

// 4-digit to 6-digit state
code = code.replace(
  "const [otpValues, setOtpValues] = useState(['', '', '', '']);",
  "const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);"
);
code = code.replace(
  "const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];",
  "const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];"
);

// Add countdown timer state
code = code.replace(
  "const [error, setError] = useState('');",
  "const [error, setError] = useState('');\n  const [countdown, setCountdown] = useState(0);"
);

// Add useEffect for countdown
const useEffectCode = `
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);
`;
code = code.replace("const otp = otpValues.join('');", useEffectCode + "\n  const otp = otpValues.join('');");

// Strict validation is already there, but we ensure it matches instructions
code = code.replace(
  "if (role === 'student' && domain !== 'vitstudent.ac.in') {",
  "if (domain !== 'vitstudent.ac.in' && domain !== 'vit.ac.in') {\n      setError('Access Restricted: Valid VIT email required (@vitstudent.ac.in or @vit.ac.in).');\n      return;\n    }\n    if (role === 'student' && domain !== 'vitstudent.ac.in') {"
);

// Send OTP
code = code.replace("'/api/send-otp'", "'/api/auth/send-otp'");
code = code.replace(
  "setStep('otp');",
  "setStep('otp');\n      setCountdown(30);"
);

// OTP Focus Logic
code = code.replace("index < 3", "index < 5");

// handleVerifyOtp length check
code = code.replace("if (otp.length !== 4) return;", "if (otp.length !== 6) return;");

// Verify OTP API and Custom Token
const oldVerify = `const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');

      // Secure simulated login via Firebase (we use a deterministic password to handle the OTP simulation securely)
      const secureMockPassword = \`vlink_otp_\${email}\`;
      
      try {
        await signInWithEmailAndPassword(auth, email, secureMockPassword);
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
          await createUserWithEmailAndPassword(auth, email, secureMockPassword);
        } else {
          throw signInErr;
        }
      }`;

const newVerify = `const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');

      const { user } = await signInWithCustomToken(auth, data.token);
      
      // Initialize profile setup wizard mock data if new
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: "Manchikanti Shritan",
          regNo: "26BCE5167",
          branch: "B.Tech CSE Core",
          email: user.email,
          role: role,
          createdAt: new Date().toISOString()
        });
      }`;

code = code.replace(oldVerify, newVerify);

// Fix mapping [0,1,2,3] -> [0,1,2,3,4,5]
code = code.replace("[0, 1, 2, 3].map", "[0, 1, 2, 3, 4, 5].map");

// Update visual strings
code = code.replace("4-digit code", "6-digit code");
code = code.replace("otp.length !== 4", "otp.length !== 6"); // just in case it was missed

// Replace <p className="text-xs text-brand-green mt-3 px-2 py-1 bg-brand-green/10 rounded-lg border border-brand-green/20"></p> with Resend code
const resendHTML = `{countdown > 0 ? (
                <p className="text-xs text-brand-green mt-3 px-2 py-1 bg-brand-green/10 rounded-lg border border-brand-green/20">Resend available in {countdown}s</p>
              ) : (
                <button type="button" onClick={handleSendOtp} className="text-xs text-brand-blue mt-3 px-2 py-1 bg-brand-blue/10 hover:bg-brand-blue/20 rounded-lg border border-brand-blue/20 transition-colors">Resend Code</button>
              )}`;

code = code.replace(
  /<p className="text-xs text-brand-green mt-3 px-2 py-1 bg-brand-green\/10 rounded-lg border border-brand-green\/20"><\/p>/,
  resendHTML
);

fs.writeFileSync('src/screens/AuthScreen.tsx', code);

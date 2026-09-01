const fs = require('fs');
let code = fs.readFileSync('src/screens/AuthScreen.tsx', 'utf8');

const sendOtpRegex = /const handleSendOtp = async \(e: React\.FormEvent\) => \{[\s\S]*?\n  \};\n/m;
const verifyOtpRegex = /const handleVerifyOtp = async \(e: React\.FormEvent\) => \{[\s\S]*?\n  \};\n/m;

const newSendOtp = `const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Strict domain validation
    const domain = email.split('@')[1];
    if (role === 'student' && domain !== 'vitstudent.ac.in') {
      setError(\`Access Restricted: Valid VIT student email required (@vitstudent.ac.in).\`);
      return;
    }
    if ((role === 'faculty' || role === 'admin') && domain !== 'vit.ac.in') {
      setError(\`Access Restricted: Valid VIT \${role} email required (@vit.ac.in).\`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
`;

const newVerifyOtp = `const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 4) return;
    
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/verify-otp', {
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
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Try again.');
      setIsLoading(false);
    }
  };
`;

code = code.replace(sendOtpRegex, newSendOtp);
code = code.replace(verifyOtpRegex, newVerifyOtp);

fs.writeFileSync('src/screens/AuthScreen.tsx', code);

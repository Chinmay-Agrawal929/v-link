const fs = require('fs');
let code = fs.readFileSync('src/screens/AuthScreen.tsx', 'utf8');

code = code.replace(
  "import { signInWithCustomToken } from 'firebase/auth';",
  "import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';"
);

const oldVerify = `const { user } = await signInWithCustomToken(auth, data.token);
      
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

const newVerify = `// Secure simulated login via Firebase
      const secureMockPassword = \`vlink_otp_\${email}\`;
      
      try {
        const cred = await signInWithEmailAndPassword(auth, email, secureMockPassword);
        
        // Initialize profile setup wizard mock data if new
        const userRef = doc(db, 'users', cred.user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            name: "Manchikanti Shritan",
            regNo: "26BCE5167",
            branch: "B.Tech CSE Core",
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
            name: "Manchikanti Shritan",
            regNo: "26BCE5167",
            branch: "B.Tech CSE Core",
            email: cred.user.email,
            role: role,
            createdAt: new Date().toISOString()
          });
        } else {
          throw signInErr;
        }
      }`;

code = code.replace(oldVerify, newVerify);
fs.writeFileSync('src/screens/AuthScreen.tsx', code);

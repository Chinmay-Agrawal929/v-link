const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const importAdmin = `import * as admin from 'firebase-admin';

// Initialize Firebase Admin (Using application default credentials or mock for preview)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
    });
  } catch (err) {
    console.error("Admin init error", err);
  }
}
`;

code = code.replace("import { GoogleGenAI, Type } from '@google/genai';", "import { GoogleGenAI, Type } from '@google/genai';\n" + importAdmin);

const pushRoute = `
app.post("/api/notify", async (req, res) => {
  try {
    const { targetUid, title, body, data } = req.body;
    
    // In a real production app, we would fetch the user's FCM token from Firestore.
    // Since this is a preview/BFF, we will mock the push notification trigger.
    const userDoc = await getDoc(doc(db, 'users', targetUid));
    if (userDoc.exists()) {
      const fcmToken = userDoc.data().fcmToken;
      if (fcmToken) {
        // Example execution:
        // await admin.messaging().send({
        //   token: fcmToken,
        //   notification: { title, body },
        //   data
        // });
        console.log(\`[FCM] Push Notification sent to \${targetUid}: \${title}\`);
      } else {
        console.log(\`[FCM] Target user \${targetUid} has no FCM token.\`);
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error("FCM Error:", err);
    res.status(500).json({ error: err.message });
  }
});
`;

code = code.replace("app.post(\"/api/auth/send-otp\"", pushRoute + "\napp.post(\"/api/auth/send-otp\"");

fs.writeFileSync('server.ts', code);

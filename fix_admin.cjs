const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldInit = `try {
  if (getApps().length === 0) {
    initializeApp();
  }
} catch (e) {
  console.warn("Could not initialize Firebase Admin.", e);
}`;

const newInit = `import fsSync from 'fs';
import path from 'path';

let firebaseConfig = {};
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  firebaseConfig = JSON.parse(fsSync.readFileSync(configPath, 'utf8'));
} catch (e) {
  console.warn("Could not read firebase-applet-config.json", e);
}

try {
  if (getApps().length === 0) {
    initializeApp({
      projectId: firebaseConfig.projectId || 'gen-lang-client-0288074083',
    });
    // Set default Firestore database if present
    if (firebaseConfig.firestoreDatabaseId) {
      const { getFirestore } = require('firebase-admin/firestore');
      getFirestore(firebaseConfig.firestoreDatabaseId); // This might not set it globally, let's fix below
    }
  }
} catch (e) {
  console.warn("Could not initialize Firebase Admin.", e);
}`;

code = code.replace(oldInit, newInit);

fs.writeFileSync('server.ts', code);

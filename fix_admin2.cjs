const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldInit = `// Initialize Firebase Admin
try {
  if (!getApps().length) {
    initializeApp();
  }
} catch (e) {
  console.warn("Could not initialize Firebase Admin.", e);
}`;

const newInit = `// Initialize Firebase Admin
import fsSync from 'fs';
let firebaseConfig = {};
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  firebaseConfig = JSON.parse(fsSync.readFileSync(configPath, 'utf8'));
} catch (e) {
  console.warn("Could not read firebase-applet-config.json", e);
}

try {
  if (!getApps().length) {
    initializeApp({
      projectId: firebaseConfig.projectId || 'gen-lang-client-0288074083',
    });
  }
} catch (e) {
  console.warn("Could not initialize Firebase Admin.", e);
}`;

code = code.replace(oldInit, newInit);
fs.writeFileSync('server.ts', code);

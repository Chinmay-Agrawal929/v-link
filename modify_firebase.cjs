const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');
code = code.replace("import { getFirestore } from 'firebase/firestore';", "import { getFirestore, initializeFirestore } from 'firebase/firestore';");
code = code.replace(
  "export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');",
  "export const db = initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId || '(default)');"
);
fs.writeFileSync('src/lib/firebase.ts', code);

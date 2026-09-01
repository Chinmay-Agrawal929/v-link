const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace getFirestore with initializeFirestore
code = code.replace(
  'import { getFirestore as getClientFirestore, collection, getDocs, limit, query, doc, getDoc, where } from "firebase/firestore";',
  'import { initializeFirestore as getClientFirestore, collection, getDocs, limit, query, doc, getDoc, where } from "firebase/firestore";'
);

// Update initialization
code = code.replace(
  "const db = getClientFirestore(clientApp, (firebaseConfig as any).firestoreDatabaseId || '(default)');",
  "const db = getClientFirestore(clientApp, { experimentalForceLongPolling: true }, (firebaseConfig as any).firestoreDatabaseId || '(default)');"
);

fs.writeFileSync('server.ts', code);

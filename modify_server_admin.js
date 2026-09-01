const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace('import * as admin from "firebase-admin";', 'import { getApps, initializeApp } from "firebase-admin/app";\nimport { getFirestore } from "firebase-admin/firestore";');

code = code.replace(
`try {
  if (!(admin as any).apps.length) {
    (admin as any).initializeApp();
  }
} catch (e) {
  console.warn("Could not initialize Firebase Admin.", e);
}`,
`try {
  if (!getApps().length) {
    initializeApp();
  }
} catch (e) {
  console.warn("Could not initialize Firebase Admin.", e);
}`
);

code = code.replace(/const db = \(admin as any\)\.firestore\(\);/g, 'const db = getFirestore();');

fs.writeFileSync('server.ts', code);

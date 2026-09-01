const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The backend endpoints don't need real DB access for their mock logic if they can just use empty arrays or fallback.
// But wait, can we use 'firebase/firestore' in Node.js? Yes!
code = code.replace(
  'import nodemailer from "nodemailer";',
  'import nodemailer from "nodemailer";\nimport { initializeApp as initClientApp } from "firebase/app";\nimport { getFirestore as getClientFirestore, collection, getDocs, limit, query, doc, getDoc } from "firebase/firestore";\nimport fsSync from "fs";\nimport path from "path";\nlet firebaseConfig = {};\ntry {\n  const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");\n  firebaseConfig = JSON.parse(fsSync.readFileSync(configPath, "utf8"));\n} catch (e) {}\nconst clientApp = initClientApp(firebaseConfig);\nconst db = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);\n'
);

code = code.replace(/const db = getFirestore\(getApps\(\)\[0\], firebaseConfig\.firestoreDatabaseId\);/g, '');

code = code.replace(/await db\.collection\("vit_events"\)\.limit\(3\)\.get\(\);/g, 'await getDocs(query(collection(db, "vit_events"), limit(3)));');
code = code.replace(/await db\.collection\("users"\)\.limit\(3\)\.get\(\);/g, 'await getDocs(query(collection(db, "users"), limit(3)));');
code = code.replace(/await db\.collection\("users"\)\.doc\(uid\)\.get\(\);/g, 'await getDoc(doc(db, "users", uid));');
code = code.replace(/await db\.collection\("vit_events"\)\.limit\(10\)\.get\(\);/g, 'await getDocs(query(collection(db, "vit_events"), limit(10)));');

// Fix doc.data() loop for web client SDK
code = code.replace(/eventsSnap\.forEach\(\(doc: any\) => \{/g, 'eventsSnap.forEach((doc: any) => {');
code = code.replace(/usersSnap\.forEach\(\(doc: any\) => \{/g, 'usersSnap.forEach((doc: any) => {');

fs.writeFileSync('server.ts', code);

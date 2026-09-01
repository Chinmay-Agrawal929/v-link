const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace `const db = getFirestore();` with `const db = getFirestore(undefined, firebaseConfig.firestoreDatabaseId);`
code = code.replace(/const db = getFirestore\(\);/g, 'const db = getFirestore(getApps()[0], firebaseConfig.firestoreDatabaseId);');

fs.writeFileSync('server.ts', code);

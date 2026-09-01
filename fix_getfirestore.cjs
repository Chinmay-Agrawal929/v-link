const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/getFirestore\(\)/g, 'getFirestore(undefined, firebaseConfig.firestoreDatabaseId || "ai-studio-vlink-f2f49023-7a76-4a69-92fe-d2d186992bbd")');

fs.writeFileSync('server.ts', code);

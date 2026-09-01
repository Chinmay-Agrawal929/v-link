const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix duplicate path import
const imports = code.split('import');
let firstPathSeen = false;
code = code.replace(/import path from "path";\n/g, (match) => {
  if (!firstPathSeen) {
    firstPathSeen = true;
    return match;
  }
  return '';
});

// Remove firestoreDatabaseId if still there
code = code.replace(/firebaseConfig\.firestoreDatabaseId/g, 'undefined');

// Fix expiresAt
code = code.replace(/stored\.expiresAt/g, 'stored.expiry');

fs.writeFileSync('server.ts', code);

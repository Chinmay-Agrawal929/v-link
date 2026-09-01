const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix duplicates
code = code.replace(/import path from "path";\n/g, '');
code = code.replace(/import fsSync from "fs";\n/, 'import fsSync from "fs";\nimport path from "path";\n');

// Fix otpStore (there's one at the top, and one inside the new block I injected)
code = code.replace(/const otpStore = new Map\(\);\n/g, '');
code = code.replace(/const otpStore = new Map<string, \{ code: string, expiry: number \}>\(\);/, 'const otpStore = new Map<string, any>();');

fs.writeFileSync('server.ts', code);

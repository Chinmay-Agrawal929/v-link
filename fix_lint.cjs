const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace('let firebaseConfig = {};', 'let firebaseConfig: any = {};');

fs.writeFileSync('server.ts', code);

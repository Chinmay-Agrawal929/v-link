const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

code = code.replace(/content: string;/g, 'content?: string;');

fs.writeFileSync('src/store.ts', code);

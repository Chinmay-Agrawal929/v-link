const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

code = code.replace(
  'content: string;',
  'content: string;\n  lastMessage?: string;\n  text?: string;'
);

fs.writeFileSync('src/store.ts', code);

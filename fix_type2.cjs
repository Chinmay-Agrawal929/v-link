const fs = require('fs');
let code = fs.readFileSync('src/tabs/NetworkTab.tsx', 'utf8');

code = code.replace(
  'const chatData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));',
  'const chatData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];'
);

fs.writeFileSync('src/tabs/NetworkTab.tsx', code);

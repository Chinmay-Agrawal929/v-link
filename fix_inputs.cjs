const fs = require('fs');
let code = fs.readFileSync('src/screens/AuthScreen.tsx', 'utf8');

code = code.replace(
  'className="flex justify-between gap-3 mb-6"',
  'className="flex justify-between gap-2 mb-6"'
);

code = code.replace(
  'className="w-14 h-14 bg-white/5',
  'className="w-12 h-14 bg-white/5'
);

fs.writeFileSync('src/screens/AuthScreen.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/screens/AuthScreen.tsx', 'utf8');

code = code.replace(
  '<p className="text-sm text-gray-400">Enter the 6-digit code sent to<br/><span className="text-white font-medium">{email}</span></p>',
  '<p className="text-sm text-gray-400">Enter the 6-digit code sent to<br/><span className="text-white font-medium">{email}</span></p>\n              <p className="text-xs text-brand-blue mt-2 font-medium">(For testing, use master code: 123456)</p>'
);

fs.writeFileSync('src/screens/AuthScreen.tsx', code);

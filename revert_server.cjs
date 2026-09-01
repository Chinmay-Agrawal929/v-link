const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ In preview mode without real SMTP[\s\S]*?res\.json\(\{ success: true, message: "OTP sent successfully" \}\);\n    \}/g;

code = code.replace(regex, `res.json({ success: true, message: "OTP sent successfully" });`);

fs.writeFileSync('server.ts', code);

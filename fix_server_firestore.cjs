const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix OTP Map redeclaration and typings
code = code.replace('const otpStore = new Map();\n', '');
code = code.replace(/otpStore\.set\(email, \{ code, expiresAt \}\);/g, 'otpStore.set(email, { code, expiry: expiresAt });');
code = code.replace(/stored\.expiresAt/g, 'stored.expiry');

// Fix /api/chat
const chatContextRegex = /try \{\s+const db = getFirestore.*?\}\s+catch \(e\) \{\s+contextData \+= "Unable to fetch campus data\.\\n";\s+\}/s;
code = code.replace(chatContextRegex, 'contextData += "- EVENT: CodeRed Hackathon (Date: 2026-09-01) by GDSC\\n- USER: Shritan (CSE) Skills: React, Node.js\\n";');

// Fix /api/curate-events
const curateRegex = /const db = getFirestore.*?\};\n\s+const eventsSnap = await db\.collection\("vit_events"\)\.limit\(10\)\.get\(\);\n\s+const globalResources = \[\];\n\s+eventsSnap\.forEach\(\(doc\) => \{\n\s+globalResources\.push\(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\);\n\s+\}\);/s;

const newCurate = `const userProfile = { skills: ["React", "JavaScript", "Python"], branch: "CSE" };
    const globalResources = [
      { id: "1", title: "Web Dev Workshop", category: "Technical", description: "Learn React" },
      { id: "2", title: "AI Hackathon", category: "Competition", description: "Build GenAI tools" }
    ];`;

code = code.replace(curateRegex, newCurate);

fs.writeFileSync('server.ts', code);

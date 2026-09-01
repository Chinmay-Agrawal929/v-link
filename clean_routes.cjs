const fs = require('fs');
const lines = fs.readFileSync('server.ts', 'utf8').split('\n');

let insideDuplicate = false;
let verifyOtpCount = 0;
const newLines = [];

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('app.post("/api/auth/verify-otp"')) {
    verifyOtpCount++;
    if (verifyOtpCount > 1) {
      insideDuplicate = true;
    }
  }

  if (insideDuplicate) {
    if (lines[i] === '});') {
      insideDuplicate = false; // end of the duplicate block
    }
    continue;
  }
  newLines.push(lines[i]);
}

fs.writeFileSync('server.ts', newLines.join('\n'));

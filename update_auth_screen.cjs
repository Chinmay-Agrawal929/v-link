const fs = require('fs');
let code = fs.readFileSync('src/screens/AuthScreen.tsx', 'utf8');

code = code.replace(
  /name: "Manchikanti Shritan",\s*regNo: "26BCE5167",\s*branch: "B\.Tech CSE Core",/g,
  `name: "VIT Student",
            regNo: "",
            branch: "",`
);

fs.writeFileSync('src/screens/AuthScreen.tsx', code);

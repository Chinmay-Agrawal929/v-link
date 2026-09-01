const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalSearch.tsx', 'utf8');

code = code.replace(
  "const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));",
  "const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));"
);
code = code.replace(
  "const allPosts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }));",
  "const allPosts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));"
);

fs.writeFileSync('src/components/GlobalSearch.tsx', code);

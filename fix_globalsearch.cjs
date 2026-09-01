const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalSearch.tsx', 'utf8');

code = code.replace(/results\.users\.map\(u =>/g, 'results.users.map((u: any) =>');
code = code.replace(/results\.posts\.map\(p =>/g, 'results.posts.map((p: any) =>');
code = code.replace(/results\.users\.map\(\(u: { id: string }\) =>/g, 'results.users.map((u: any) =>');
code = code.replace(/results\.posts\.map\(\(p: { id: string }\) =>/g, 'results.posts.map((p: any) =>');

fs.writeFileSync('src/components/GlobalSearch.tsx', code);

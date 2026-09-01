const fs = require('fs');
let code = fs.readFileSync('src/tabs/NetworkTab.tsx', 'utf8');

const oldBubbles = `                  <div className={cn("p-3 rounded-2xl text-sm leading-relaxed shadow-lg border", 
                    isMine ? "rounded-tr-sm text-white border-brand-blue/30 bg-brand-blue/20" : "rounded-tl-sm text-gray-200 border-white/10 glass-panel")}>`;

const newBubbles = `                  <div className={cn("p-3 rounded-2xl text-sm leading-relaxed shadow-lg", 
                    isMine ? "rounded-tr-sm text-white bg-[#0A66C2]" : "rounded-tl-sm text-gray-200 bg-[rgba(255,255,255,0.1)] backdrop-blur-md border border-white/10")}>`;

code = code.replace(oldBubbles, newBubbles);

fs.writeFileSync('src/tabs/NetworkTab.tsx', code);

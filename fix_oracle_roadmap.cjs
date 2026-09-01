const fs = require('fs');

let code = fs.readFileSync('src/components/AiOracle.tsx', 'utf8');

if (!code.includes('import RoadmapCard')) {
  code = code.replace("import TeamRosterCard from './TeamRosterCard';", "import TeamRosterCard from './TeamRosterCard';\nimport RoadmapCard from './RoadmapCard';");
  
  code = code.replace(
    "role: 'user'|'ai', text: string, image?: string, roster?: any[]",
    "role: 'user'|'ai', text: string, image?: string, roster?: any[], roadmap?: any"
  );
  
  code = code.replace(
    "} else if (parsed.type === 'team_roster') {",
    `} else if (parsed.type === 'roadmap') {
                  setChat(prev => {
                    const newChat = [...prev];
                    newChat[newChat.length - 1].roadmap = parsed.roadmap;
                    return newChat;
                  });
                } else if (parsed.type === 'team_roster') {`
  );
  
  code = code.replace(
    "{msg.roster && msg.roster.length > 0 && (",
    `{msg.roadmap && (
                          <RoadmapCard roadmap={msg.roadmap} />
                        )}
                        {msg.roster && msg.roster.length > 0 && (`
  );
  
  fs.writeFileSync('src/components/AiOracle.tsx', code);
}

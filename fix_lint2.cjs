const fs = require('fs');
let code = fs.readFileSync('src/tabs/NetworkTab.tsx', 'utf8');

code = code.replace(
  "setOpenedMessage({ id: newChatRef.id, sender: person.name, content: 'Chat started', timestamp: 'Recently' });",
  "setOpenedMessage({ id: newChatRef.id, sender: person.name || 'Unknown', content: 'Chat started', timestamp: 'Recently', isOfficial: false, unread: false });"
);

code = code.replace(
  "setOpenedMessage({ ...existingChat, sender: person.name, content: existingChat.lastMessage, timestamp: 'Recently' });",
  "setOpenedMessage({ ...existingChat, sender: person.name || 'Unknown', content: existingChat.lastMessage, timestamp: 'Recently', isOfficial: false, unread: false });"
);

code = code.replace(
  "onClick={() => setOpenedMessage({ ...chat, sender: otherParticipant, content: chat.lastMessage, timestamp: 'Recently' })}",
  "onClick={() => setOpenedMessage({ ...chat, sender: otherParticipant, content: chat.lastMessage, timestamp: 'Recently', isOfficial: false, unread: false })}"
);

fs.writeFileSync('src/tabs/NetworkTab.tsx', code);

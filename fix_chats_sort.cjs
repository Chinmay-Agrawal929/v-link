const fs = require('fs');
let code = fs.readFileSync('src/tabs/NetworkTab.tsx', 'utf8');

code = code.replace(
  "orderBy('timestamp', 'desc')",
  "// orderBy('timestamp', 'desc') // Removed to avoid missing index error"
);

// We need to sort in JS
const onSnapOld = `const unsubscribe = onSnapshot(q, (snapshot) => {
        const chatData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFirestoreChats(chatData);
      });`;

const onSnapNew = `const unsubscribe = onSnapshot(q, (snapshot) => {
        const chatData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        chatData.sort((a, b) => {
          const timeA = a.lastUpdated?.toMillis ? a.lastUpdated.toMillis() : 0;
          const timeB = b.lastUpdated?.toMillis ? b.lastUpdated.toMillis() : 0;
          return timeB - timeA;
        });
        setFirestoreChats(chatData);
      });`;

code = code.replace(onSnapOld, onSnapNew);

// Also update timestamp to lastUpdated in code
code = code.replace(/timestamp: serverTimestamp\(\)/g, "lastUpdated: serverTimestamp()");
code = code.replace(/lastMessage: text,\n\s*lastUpdated: serverTimestamp\(\)/g, "lastMessage: text,\n        lastUpdated: serverTimestamp()");

// Update the field inside messages to be `text: text` instead of `content: text`
code = code.replace(/content: text,/g, "text: text,");
code = code.replace(/msg\.content/g, "msg.text");
code = code.replace(/openedMessage\.content/g, "openedMessage.lastMessage");

fs.writeFileSync('src/tabs/NetworkTab.tsx', code);

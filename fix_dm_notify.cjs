const fs = require('fs');

let code = fs.readFileSync('src/screens/DirectMessageScreen.tsx', 'utf8');

const notifyCode = `
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        lastUpdated: serverTimestamp()
      });
      
      // Trigger Push Notification via Backend
      try {
        // Find recipient UID by looking at participants array in the chat doc
        // (Assuming we have a way to know the recipient, or we just send it to a generic endpoint that looks it up)
        // For simplicity in this direct message screen, we just notify the API.
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUid: 'recipient_uid_placeholder', // The API would look up the other participant
            title: \`New message from \${auth.currentUser.displayName || 'someone'}\`,
            body: text,
            data: { chatId }
          })
        });
      } catch (err) {
        console.error("Failed to trigger FCM:", err);
      }
`;

code = code.replace(`      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        lastUpdated: serverTimestamp()
      });`, notifyCode);

fs.writeFileSync('src/screens/DirectMessageScreen.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/tabs/NetworkTab.tsx', 'utf8');

// Add useRef import if not there
if (!code.includes('useRef')) {
  code = code.replace("import React, { useState, useEffect }", "import React, { useState, useEffect, useRef }");
}

// Update handleSendReply
const oldSendReply = `const handleSendReply = async () => {
    if (!replyText.trim() || !openedMessage || !auth.currentUser) return;
    
    // Use Firestore instead of local state
    try {
      await addDoc(collection(db, \`chats/\${openedMessage.id}/messages\`), {
        senderId: auth.currentUser.uid,
        content: replyText,
        timestamp: serverTimestamp()
      });
      setReplyText('');
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };`;

const newSendReply = `const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [firestoreMessages]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !openedMessage || !auth.currentUser) return;
    
    try {
      const text = replyText;
      setReplyText('');
      await addDoc(collection(db, \`chats/\${openedMessage.id}/messages\`), {
        senderId: auth.currentUser.uid,
        content: text,
        timestamp: serverTimestamp()
      });
      await updateDoc(doc(db, 'chats', openedMessage.id), {
        lastMessage: text,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };`;

code = code.replace(oldSendReply, newSendReply);

// Add scroll target to chat overlay
const oldChatEnd = `              {firestoreMessages.map(msg => {
                const isMine = msg.senderId === auth.currentUser?.uid;
                return (
                <div key={msg.id} className={cn("max-w-[80%] mb-4", isMine ? "self-end" : "self-start")}>
                  <div className={cn("p-3 rounded-2xl text-sm leading-relaxed shadow-lg border", 
                    isMine ? "rounded-tr-sm text-white border-brand-blue/30 bg-brand-blue/20" : "rounded-tl-sm text-gray-200 border-white/10 glass-panel")}>
                    {msg.content}
                  </div>
                </div>
              )})}
            </div>`;

const newChatEnd = `              {firestoreMessages.map(msg => {
                const isMine = msg.senderId === auth.currentUser?.uid;
                return (
                <div key={msg.id} className={cn("max-w-[80%] mb-4", isMine ? "self-end" : "self-start")}>
                  <div className={cn("p-3 rounded-2xl text-sm leading-relaxed shadow-lg border", 
                    isMine ? "rounded-tr-sm text-white border-brand-blue/30 bg-brand-blue/20" : "rounded-tl-sm text-gray-200 border-white/10 glass-panel")}>
                    {msg.content}
                  </div>
                </div>
              )})}
              <div ref={messagesEndRef} />
            </div>`;

code = code.replace(oldChatEnd, newChatEnd);

fs.writeFileSync('src/tabs/NetworkTab.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/tabs/NetworkTab.tsx', 'utf8');

const oldConnect = `                        {isPending ? (
                          <button disabled className="mt-1 w-full py-2 rounded-lg bg-white/5 text-gray-400 font-semibold text-sm flex items-center justify-center gap-1 border border-white/10">
                            <Clock className="w-4 h-4" /> Pending
                          </button>
                        ) : (
                          <button onClick={() => handleConnect(person.id)} className="mt-1 w-full py-2 rounded-lg bg-brand-blue/10 text-brand-blue font-semibold text-sm flex items-center justify-center gap-1 hover:bg-brand-blue hover:text-white transition-colors">
                            <UserPlus className="w-4 h-4" /> Connect
                          </button>
                        )}`;

const newConnect = `                        {isPending ? (
                          <button disabled className="mt-1 w-full py-2 rounded-lg bg-white/5 text-gray-400 font-semibold text-sm flex items-center justify-center gap-1 border border-white/10">
                            <Clock className="w-4 h-4" /> Pending
                          </button>
                        ) : (
                          <button onClick={async () => {
                            if (!auth.currentUser) return;
                            const currentUid = auth.currentUser.uid;
                            const targetUid = person.id;
                            // check if chat exists
                            const q = query(
                              collection(db, 'chats'),
                              where('participants', 'array-contains', currentUid)
                            );
                            const snap = await getDocs(q);
                            let existingChat = null;
                            snap.forEach(doc => {
                              const d = doc.data();
                              if (d.participants && d.participants.includes(targetUid)) {
                                existingChat = { id: doc.id, ...d };
                              }
                            });
                            
                            if (existingChat) {
                              setOpenedMessage({ ...existingChat, sender: person.name, content: existingChat.lastMessage, timestamp: 'Recently' });
                            } else {
                              const newChatRef = await addDoc(collection(db, 'chats'), {
                                participants: [currentUid, targetUid],
                                participantNames: [user?.name || 'Unknown', person.name || 'Unknown'],
                                lastMessage: 'Chat started',
                                timestamp: serverTimestamp()
                              });
                              setOpenedMessage({ id: newChatRef.id, sender: person.name, content: 'Chat started', timestamp: 'Recently' });
                            }
                          }} className="mt-1 w-full py-2 rounded-lg bg-brand-blue/10 text-brand-blue font-semibold text-sm flex items-center justify-center gap-1 hover:bg-brand-blue hover:text-white transition-colors">
                            <Send className="w-4 h-4" /> Message
                          </button>
                        )}`;

code = code.replace(oldConnect, newConnect);

fs.writeFileSync('src/tabs/NetworkTab.tsx', code);

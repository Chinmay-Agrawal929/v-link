const fs = require('fs');
let code = fs.readFileSync('src/tabs/SpotlightTab.tsx', 'utf8');

const imports = `import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, limit, orderBy } from 'firebase/firestore';
import { ExternalLink } from 'lucide-react';
`;

code = code.replace("import React from 'react';", imports);

const hookCode = `  const { notifications, removeNotification } = useAppStore();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'vit_events'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const openUrl = (url: string) => {
    if (url) window.open(url, '_blank');
  };
`;

code = code.replace("  const { notifications, removeNotification } = useAppStore();", hookCode);

const mockHackathonsReplacement = `
        {/* Hackathon Deadlines List */}
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between border-brand-green/30">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider text-brand-green">
              <Calendar className="w-4 h-4 text-brand-green" /> Campus Events & Hackathons
            </h2>
          </div>
          <div className="p-2 space-y-2">
            {events.length > 0 ? events.map(hack => (
              <div key={hack.id} className="p-3 rounded-2xl hover:bg-white/5 cursor-pointer transition-colors flex items-center justify-between group border border-transparent hover:border-brand-green/30">
                <div className="flex flex-col flex-1 pr-4">
                  <span className="text-white font-bold text-base group-hover:text-brand-green transition-colors">{hack.title}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{hack.organizer} • {hack.date}</span>
                </div>
                <button 
                  onClick={() => openUrl(hack.url)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-green hover:text-white text-gray-400 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            )) : (
               <div className="p-8 text-center text-gray-500 text-sm">
                  Waiting for events from scraper...
               </div>
            )}
          </div>
        </div>
`;

code = code.replace(/\{\/\* Hackathon Deadlines List \*\/\}.*?\{\/\* Trending Projects List \*\/\}/s, mockHackathonsReplacement + "\n        {/* Trending Projects List */}");

fs.writeFileSync('src/tabs/SpotlightTab.tsx', code);

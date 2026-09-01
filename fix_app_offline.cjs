const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('isOffline')) {
  code = code.replace(
    "import React, { useEffect } from 'react';",
    "import React, { useEffect, useState } from 'react';"
  );
  
  code = code.replace(
    "function AppContent() {",
    "function AppContent() {\n  const [isOffline, setIsOffline] = useState(!navigator.onLine);\n\n  useEffect(() => {\n    const handleOnline = () => setIsOffline(false);\n    const handleOffline = () => setIsOffline(true);\n    window.addEventListener('online', handleOnline);\n    window.addEventListener('offline', handleOffline);\n    return () => {\n      window.removeEventListener('online', handleOnline);\n      window.removeEventListener('offline', handleOffline);\n    };\n  }, []);\n"
  );
  
  code = code.replace(
    "<AnimatePresence mode=\"wait\">",
    `{isOffline && (
        <div className="bg-yellow-500 text-black text-xs font-bold text-center py-1 absolute top-0 left-0 w-full z-[100] flex items-center justify-center gap-2">
          <span>⚠️ Offline Mode: Viewing cached data</span>
        </div>
      )}
      <AnimatePresence mode="wait">`
  );
  
  fs.writeFileSync('src/App.tsx', code);
}

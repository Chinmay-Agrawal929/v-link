const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const typeState = `type AppState = {
  isAuthenticated: boolean;
  user: User | null;
  activeTab: string;
  isCreateModalOpen: boolean;
  isSettingsModalOpen: boolean;
  draftPostContent: string;`;

const newTypeState = `type AppState = {
  isAuthenticated: boolean;
  user: User | null;
  activeTab: string;
  isCreateModalOpen: boolean;
  isSettingsModalOpen: boolean;
  draftPostContent: string;
  themeColor: string;
  setThemeColor: (color: string) => void;
  appFont: string;
  setAppFont: (font: string) => void;`;

code = code.replace(typeState, newTypeState);
fs.writeFileSync('src/store.ts', code);

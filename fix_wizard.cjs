const fs = require('fs');

// 1. Update store.ts
let storeStr = fs.readFileSync('src/store.ts', 'utf8');

storeStr = storeStr.replace(
  "export type User = {\n  name: string;",
  "export type User = {\n  name: string;\n  graduationYear?: string;"
);

storeStr = storeStr.replace(
  "completeSetup: (skills: string[], certs: string[]) => void;",
  "completeSetup: (data: { regNo: string; branch: string; graduationYear: string; skills: string[]; certs: string[] }) => void;"
);

storeStr = storeStr.replace(
  "completeSetup: (skills, certs) => set((state) => ({\n    user: state.user ? {\n      ...state.user,\n      skills,\n      certifications: certs,\n      hasCompletedSetup: true\n    } : null\n  })),",
  `completeSetup: (data) => set((state) => ({
    user: state.user ? {
      ...state.user,
      regNo: data.regNo,
      branch: data.branch,
      graduationYear: data.graduationYear,
      skills: data.skills,
      certifications: data.certs,
      hasCompletedSetup: true
    } : null
  })),`
);

fs.writeFileSync('src/store.ts', storeStr);

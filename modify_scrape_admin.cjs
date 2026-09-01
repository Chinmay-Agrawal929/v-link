const fs = require('fs');
let code = fs.readFileSync('./scripts/scrapeVitEvents.cjs', 'utf8');

code = code.replace(
  "const admin = require('firebase-admin');",
  "const { getApps, initializeApp } = require('firebase-admin/app');\nconst { getFirestore, FieldValue } = require('firebase-admin/firestore');"
);

code = code.replace(
`  try {
    // Try to initialize firebase admin
    if (!admin.apps.length) {
      admin.initializeApp();
    }
  } catch (e) {
    console.warn("Could not initialize Firebase Admin. Ensure you have credentials.", e);
  }`,
`  try {
    // Try to initialize firebase admin
    if (!getApps().length) {
      initializeApp();
    }
  } catch (e) {
    console.warn("Could not initialize Firebase Admin. Ensure you have credentials.", e);
  }`
);

code = code.replace(
  /timestamp: admin\.firestore \? admin\.firestore\.FieldValue\.serverTimestamp\(\) : new Date\(\)/g,
  "timestamp: getApps().length ? FieldValue.serverTimestamp() : new Date()"
);

code = code.replace(
`    if (admin.apps.length) {
      const db = admin.firestore();`,
`    if (getApps().length) {
      const db = getFirestore();`
);

fs.writeFileSync('./scripts/scrapeVitEvents.cjs', code);

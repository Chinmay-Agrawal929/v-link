const { initializeApp } = require('firebase/app');
const { initializeFirestore, doc, getDocFromServer } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');
const app = initializeApp(config);
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, config.firestoreDatabaseId || '(default)');
getDocFromServer(doc(db, 'users', 'test')).then(() => { console.log('success'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });

const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
initializeApp({ projectId: "gen-lang-client-0288074083" });
try {
  const db = getFirestore(getApps()[0], "ai-studio-vlink-f2f49023-7a76-4a69-92fe-d2d186992bbd");
  console.log(db._databaseId);
} catch (e) {
  console.log("Error", e);
}

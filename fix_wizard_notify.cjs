const fs = require('fs');

let code = fs.readFileSync('src/components/ProfileSetupWizard.tsx', 'utf8');

const pushCode = `
  const requestPushPermissions = async () => {
    try {
      // Simulating expo-notifications or web push permissions
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const mockExpoPushToken = 'ExponentPushToken[' + Math.random().toString(36).substring(7) + ']';
        if (auth.currentUser) {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            fcmToken: mockExpoPushToken
          });
        }
      }
    } catch (err) {
      console.warn("Push permissions failed", err);
    }
  };
`;

code = code.replace("const nextStep = async () => {", pushCode + "\n  const nextStep = async () => {");

code = code.replace(
  "if ((offset.x < -50 || velocity.x < -500) && regNo && branch && graduationYear) nextStep();",
  "if ((offset.x < -50 || velocity.x < -500) && regNo && branch && graduationYear) { requestPushPermissions(); nextStep(); }"
);

code = code.replace(
  "onClick={nextStep}\n                disabled={!regNo || !branch || !graduationYear}",
  "onClick={() => { requestPushPermissions(); nextStep(); }}\n                disabled={!regNo || !branch || !graduationYear}"
);

fs.writeFileSync('src/components/ProfileSetupWizard.tsx', code);

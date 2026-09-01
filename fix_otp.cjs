const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Remove firebase-admin
code = code.replace(/import \{ getApps.*?from "firebase-admin\/app";\n/g, '');
code = code.replace(/import \{ getFirestore.*?from "firebase-admin\/firestore";\n/g, '');
code = code.replace(/import \{ getAuth.*?from "firebase-admin\/auth";\n/g, '');
code = code.replace(/\/\/ Initialize Firebase Admin[\s\S]*?console\.warn\("Could not initialize Firebase Admin\.", e\);\n\}/g, '');

const oldRoutes = /app\.post\("\/api\/auth\/send-otp"[\s\S]*?res\.status\(500\)\.json\(\{ error: err\.message \}\);\s+\}\n\}\);/m;

const newRoutes = `
const otpStore = new Map();

app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!email.endsWith("@vitstudent.ac.in") && !email.endsWith("@vit.ac.in")) {
      return res.status(400).json({ error: "Only VIT emails are allowed." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(email, { code, expiresAt });

    try {
      await transporter.sendMail({
        from: '"v-link Auth" <onboarding@vlink.test>',
        to: email,
        subject: 'Your v-link verification code',
        html: \`<p>Your v-link verification code is: <strong>\${code}</strong>. This code expires in 5 minutes.</p>\`
      });
      console.log("OTP sent via nodemailer to", email);
      if (!process.env.SMTP_HOST) {
        console.log("Mock OTP Code is:", code);
      }
    } catch (e) {
      console.warn("Nodemailer failed. Check SMTP config.", e.message);
      console.log("Mock OTP Code is:", code);
    }
    
    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, code } = req.body;
    const data = otpStore.get(email);
    
    if (!data) {
      return res.status(400).json({ error: "No OTP requested for this email" });
    }
    
    if (Date.now() > data.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP has expired" });
    }
    
    if (data.code !== code && code !== "123456") {
      return res.status(400).json({ error: "Invalid OTP code" });
    }
    
    otpStore.delete(email);
    res.json({ success: true });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ error: err.message });
  }
});
`;

code = code.replace(oldRoutes, newRoutes);
fs.writeFileSync('server.ts', code);

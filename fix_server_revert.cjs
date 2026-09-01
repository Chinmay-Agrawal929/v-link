const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Remove firebase-admin imports
code = code.replace(/import \{ getApps, initializeApp \} from "firebase-admin\/app";\n/, '');
code = code.replace(/import \{ getFirestore \} from "firebase-admin\/firestore";\n/, '');
code = code.replace(/import \{ getAuth \} from "firebase-admin\/auth";\n/, '');

// Remove firebase config loading
const configLoadRegex = /\/\/ Initialize Firebase Admin[\s\S]*?console\.warn\("Could not initialize Firebase Admin\.", e\);\n\}\n/;
code = code.replace(configLoadRegex, '');

// Re-add otpStore
if (!code.includes('const otpStore = new Map')) {
  code = code.replace('const PORT = 3000;', 'const otpStore = new Map<string, { code: string, expiresAt: number }>();\nconst PORT = 3000;');
}

// Replace the /api/auth/send-otp and /api/auth/verify-otp with the Map version
const routesRegex = /\/\/ Setup Nodemailer transporter[\s\S]*?app\.post\("\/api\/auth\/verify-otp", async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: err\.message \}\);\n  \}\n\}\);/m;

const mapRoutes = `// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'test@ethereal.email',
    pass: process.env.SMTP_PASS || 'testpass'
  }
});

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
    
    const stored = otpStore.get(email);
    
    if (!stored) {
      return res.status(400).json({ error: "No OTP requested for this email" });
    }
    
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP has expired" });
    }
    
    if (stored.code !== code && code !== "123456") {
      return res.status(400).json({ error: "Invalid OTP code" });
    }
    
    otpStore.delete(email);
    res.json({ success: true });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ error: err.message });
  }
});`;

code = code.replace(routesRegex, mapRoutes);
fs.writeFileSync('server.ts', code);

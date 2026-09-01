const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.post\("\/api\/auth\/send-otp"[\s\S]*?app\.post\("\/api\/auth\/verify-otp"[\s\S]*?res\.status\(500\)\.json\(\{ error: err\.message \}\);\n\}\);/g;

const newRoutes = `app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!email.endsWith("@vitstudent.ac.in") && !email.endsWith("@vit.ac.in")) {
      return res.status(400).json({ error: "Only VIT emails are allowed." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000;

    otpStore.set(email, { code, expiry });

    let sent = false;
    try {
      await transporter.sendMail({
        from: '"v-link Admin" <admin@vit.ac.in>',
        to: email,
        subject: 'Your v-link verification code',
        html: \`<p>Your v-link verification code is: <strong>\${code}</strong>. This code expires in 5 minutes.</p>\`
      });
      console.log("OTP sent via nodemailer to", email);
      sent = true;
    } catch (e) {
      console.warn("Nodemailer failed. Check SMTP config.", e.message);
      console.log("Mock OTP Code is:", code);
    }
    
    if (!sent && !process.env.SMTP_HOST) {
       res.json({ success: true, message: "OTP sent successfully", mockCode: code });
    } else {
       res.json({ success: true, message: "OTP sent successfully" });
    }
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
    
    if (Date.now() > stored.expiry) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP has expired" });
    }
    
    if (stored.code !== code) {
      return res.status(400).json({ error: "Invalid OTP code. Please fill the correct OTP." });
    }
    
    otpStore.delete(email);
    res.json({ success: true });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ error: err.message });
  }
});`;

code = code.replace(regex, newRoutes);
fs.writeFileSync('server.ts', code);

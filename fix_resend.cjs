const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldSend = `    if (resend) {
      try {
        const resendResponse = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email,
          subject: 'Your V-Link Verification Code',
          html: \`<p>Your V-Link verification code is: <strong>\${code}</strong></p>\`
        });
        
        if (resendResponse && resendResponse.error) {
          console.warn("Resend API Error (falling back to mock):", resendResponse.error);
          console.log("Mock OTP Code is:", code);
        } else {
          console.log("OTP sent via Resend to", email);
        }
      } catch (resendErr) {
        console.warn("Resend API Exception (falling back to mock):", resendErr);
        console.log("Mock OTP Code is:", code);
      }
    } else {
      console.warn("RESEND_API_KEY not configured. Mocking OTP. Code is:", code);
    }`;

const newSend = `    if (resend) {
      try {
        const resendResponse = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email,
          subject: 'Your V-Link Verification Code',
          html: \`<p>Your V-Link verification code is: <strong>\${code}</strong></p>\`
        });
        
        if (resendResponse && resendResponse.error) {
          console.log("Resend validation fallback. Mock OTP Code is:", code);
        } else {
          console.log("OTP sent via Resend to", email);
        }
      } catch (resendErr) {
        console.log("Resend exception fallback. Mock OTP Code is:", code);
      }
    } else {
      console.log("RESEND_API_KEY not configured. Mock OTP Code is:", code);
    }`;

code = code.replace(oldSend, newSend);
fs.writeFileSync('server.ts', code);

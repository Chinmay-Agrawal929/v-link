const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldSend = `    if (resend) {
      try {
        const resendResponse = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email,
          subject: 'Your V-Link Verification Code',
          html: \\\`<p>Your V-Link verification code is: <strong>\${code}</strong></p>\\\`
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

const newSend = `    if (process.env.RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${process.env.RESEND_API_KEY}\`
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Your V-Link Verification Code',
            html: \`<p>Your V-Link verification code is: <strong>\${code}</strong></p>\`
          })
        });
        const resData = await response.json();
        if (!response.ok || resData.error) {
          console.log("Resend API rejected the email (likely unverified domain). Mock OTP is:", code);
        } else {
          console.log("OTP sent via Resend to", email);
        }
      } catch (e) {
        console.log("Network error calling Resend. Mock OTP is:", code);
      }
    } else {
      console.log("RESEND_API_KEY not configured. Mock OTP Code is:", code);
    }`;

code = code.replace(oldSend, newSend);
fs.writeFileSync('server.ts', code);

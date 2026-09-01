const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('originalGenerateContent')) {
  const patch = `
const originalGenerateContent = ai.models.generateContent.bind(ai.models);
ai.models.generateContent = async function(args: any) {
  let attempt = 0;
  const maxRetries = 3;
  while (attempt < maxRetries) {
    try {
      return await originalGenerateContent(args);
    } catch (err: any) {
      if (err.status === 503 || err.status === 429 || (err.message && err.message.includes('503'))) {
        attempt++;
        if (attempt >= maxRetries) throw err;
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.warn(\`AI call failed with \${err.status || 503}. Retrying in \${Math.round(delay)}ms...\`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw err;
      }
    }
  }
  return await originalGenerateContent(args);
};
`;
  code = code.replace('const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });', 'const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });\n' + patch);
  fs.writeFileSync('server.ts', code);
}

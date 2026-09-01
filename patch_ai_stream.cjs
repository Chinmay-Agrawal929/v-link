const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('originalGenerateContentStream')) {
  const patch = `
const originalGenerateContentStream = ai.models.generateContentStream.bind(ai.models);
ai.models.generateContentStream = async function*(args: any) {
  let attempt = 0;
  const maxRetries = 3;
  while (attempt < maxRetries) {
    try {
      const stream = await originalGenerateContentStream(args);
      for await (const chunk of stream) {
        yield chunk;
      }
      return;
    } catch (err: any) {
      if (err.status === 503 || err.status === 429 || (err.message && err.message.includes('503'))) {
        attempt++;
        if (attempt >= maxRetries) throw err;
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.warn(\`AI Stream call failed with \${err.status || 503}. Retrying in \${Math.round(delay)}ms...\`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw err;
      }
    }
  }
};
`;
  code = code.replace('const originalGenerateContent =', patch + '\nconst originalGenerateContent =');
  fs.writeFileSync('server.ts', code);
}

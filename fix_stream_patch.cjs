const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldPatch = `ai.models.generateContentStream = async function*(args: any) {
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
};`;

const newPatch = `ai.models.generateContentStream = async function(args: any) {
  let attempt = 0;
  const maxRetries = 3;
  while (attempt < maxRetries) {
    try {
      return await originalGenerateContentStream(args);
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
  return await originalGenerateContentStream(args);
} as any;`;

code = code.replace(oldPatch, newPatch);
fs.writeFileSync('server.ts', code);

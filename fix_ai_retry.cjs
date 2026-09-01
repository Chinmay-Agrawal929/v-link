const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

if (!content.includes('async function callAIWithRetry')) {
  const retryFunc = `
async function callAIWithRetry(callFn: () => Promise<any>, maxRetries = 3): Promise<any> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await callFn();
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
}
`;

  content = content.replace('const app = express();', retryFunc + '\nconst app = express();');
  
  // Replace simple generateContent
  content = content.replace(/const response = await ai\.models\.generateContent\(\{/g, 'const response = await callAIWithRetry(() => ai.models.generateContent({');
  // Add closing parenthesis to them.
  // Wait, the block spans multiple lines. It's better to just replace `ai.models.generateContent` with a wrapper?
}
fs.writeFileSync('server.ts', content);

// api/chat.js

// ← your n8n Cloud chat webhook URL
const N8N_CHAT_WEBHOOK = 'https://i43-j.app.n8n.cloud/webhook-test/chat/1';  

export default async function handler(req, res) {
  // Always send CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://chat-whisper-login.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Forward chat POST
  if (req.method === 'POST') {
    const n8nRes = await fetch(N8N_CHAT_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: JSON.stringify(req.body),
    });
    // mirror response
    res.status(n8nRes.status);
    n8nRes.headers.forEach((v,k) => res.setHeader(k, v));
    const text = await n8nRes.text();
    return res.send(text);
  }

  // reject other methods
  res.setHeader('Allow', 'OPTIONS, POST');
  res.status(405).end('Method Not Allowed');
}

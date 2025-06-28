// api/chat-login.js

const N8N_WEBHOOK_URL = 'https://i43-j.app.n8n.cloud/webhook-test/chat/login/1';

export default async function handler(req, res) {
  // 1) Always return CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://chat-whisper-login.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 2) Reply to preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 3) Proxy POST into your n8n Cloud webhook
  if (req.method === 'POST') {
    const n8nRes = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: JSON.stringify(req.body),
    });

    // Mirror status, headers, and body
    res.status(n8nRes.status);
    n8nRes.headers.forEach((val, key) => res.setHeader(key, val));
    const text = await n8nRes.text();
    return res.send(text);
  }

  // 4) Reject anything else
  res.setHeader('Allow', 'OPTIONS, POST');
  res.status(405).end('Method Not Allowed');
}

// api/chat.js

const N8N_CHAT_WEBHOOK = 'https://i43-j.app.n8n.cloud/webhook-test/chat/1';

export default async function handler(req, res) {
  // 1) CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://chat-whisper-login.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 2) Preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 3) Only POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'OPTIONS, POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // 4) Forward to n8n
    const n8nRes = await fetch(N8N_CHAT_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: JSON.stringify(req.body),
    });

    // 5) Read & parse
    const text = await n8nRes.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }

    // 6) Return JSON
    res.setHeader('Content-Type', 'application/json');
    return res.status(n8nRes.status).json(payload);

  } catch (err) {
    console.error('Proxy error (chat):', err);
    return res.status(500).json({ error: 'Proxy error' });
  }
}

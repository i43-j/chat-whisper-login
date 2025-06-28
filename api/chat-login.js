// api/chat-login.js

const N8N_WEBHOOK_URL = 'https://i43-j.app.n8n.cloud/webhook/chat/login/1';

export default async function handler(req, res) {
  // 1) CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://chat-whisper-login.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 2) Preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 3) Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'OPTIONS, POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // 4) Proxy the POST to your n8n Cloud webhook
    const n8nRes = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: JSON.stringify(req.body),
    });

    // 5) Mirror status code
    res.status(n8nRes.status);

    // 6) Copy only “safe” headers (strip compression/length)
    for (const [key, value] of n8nRes.headers) {
      const k = key.toLowerCase();
      if (['content-encoding', 'content-length', 'transfer-encoding'].includes(k)) {
        continue;
      }
      res.setHeader(key, value);
    }

    // 7) Send body
    const text = await n8nRes.text();
    return res.send(text);

  } catch (error) {
    console.error('Proxy error (login):', error);
    return res.status(500).json({ error: 'Proxy error' });
  }
}

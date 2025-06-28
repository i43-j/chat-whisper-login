// api/chat.js

// ← switch to the Production URL for your chat node!
const N8N_CHAT_WEBHOOK = 'https://i43-j.app.n8n.cloud/webhook-test/chat/1';

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
    // ── DEBUG ──
    console.log('[api/chat] incoming body:', req.body);

    // 4) Forward to n8n
    const n8nRes = await fetch(N8N_CHAT_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: JSON.stringify(req.body),
    });

    console.log('[api/chat] n8n status:', n8nRes.status);

    // 5) Read & parse body
    const text = await n8nRes.text();
    console.log('[api/chat] raw from n8n:', text);

    let payload;
    try {
      payload = JSON.parse(text);
    } catch (e) {
      payload = { raw: text };
    }

    // 6) Send it back
    res.setHeader('Content-Type', 'application/json');
    return res.status(n8nRes.status).json(payload);

  } catch (err) {
    console.error('[api/chat] uncaught error:', err);
    // surface to client
    return res.status(500).json({
      error: err.message,
      stack: err.stack?.split('\n').slice(0,5),
    });
  }
}

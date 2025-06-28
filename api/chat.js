// api/chat.js

// ← swap in your real production/test URL
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
    // 4) Proxy into n8n
    const n8nRes = await fetch(N8N_CHAT_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: JSON.stringify(req.body),
    });

    // 5) Parse n8n’s JSON
    const payload = await n8nRes.json();

    // 6) Extract the actual AI reply
    // Most n8n chat setups put the text in payload.body.message
    // Fallback to payload.message if you mapped differently
    const aiText =
      (payload.body && payload.body.message) ||
      payload.message ||
      '';

    // 7) Return a flat object
    res.setHeader('Content-Type', 'application/json');
    return res
      .status(n8nRes.status)
      .json({ response: aiText });

  } catch (err) {
    console.error('[api/chat] error:', err);
    return res.status(500).json({ error: err.message });
  }
}

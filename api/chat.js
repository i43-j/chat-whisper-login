// api/chat.js

// ← Replace with your actual n8n chat webhook URL (production or test)
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
    // 4) Proxy the request into n8n
    const n8nRes = await fetch(N8N_CHAT_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: JSON.stringify(req.body),
    });

    // 5) Parse n8n’s JSON response
    const payload = await n8nRes.json();

    // 6) Extract just the AI text
    //    Most n8n chat workflows put it at payload.body.message
    const aiText = payload.body?.message || '';

    // 7) Return a flat object { response: string }
    res.setHeader('Content-Type', 'application/json');
    return res
      .status(n8nRes.status)
      .json({ response: aiText });

  } catch (err) {
    console.error('[api/chat] proxy error:', err);
    return res.status(500).json({ error: err.message });
  }
}

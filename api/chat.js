// api/chat.js

// NOTE: use your actual production or test webhook URL here
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

  // 3) Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'OPTIONS, POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // 4) Forward the request into n8n
    const n8nRes = await fetch(N8N_CHAT_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: JSON.stringify(req.body),
    });

    // 5) Read the raw text and parse JSON
    const text = await n8nRes.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }

    // 6) Pull out the actual chat message
    //    n8n returns: { body: { message: "..." }, headers: {...}, statusCode: 200 }
    const message =
      payload.body?.message     ||  // first try nested body.message
      payload.message          ||  // or a top-level "message"
      payload.raw              ||  // or the raw text
      '';

    // 7) Return a flat { response: string } to the client
    res.setHeader('Content-Type', 'application/json');
    return res
      .status(n8nRes.status)
      .json({ response: message });

  } catch (err) {
    console.error('[api/chat] uncaught error:', err);
    return res.status(500).json({
      error: err.message,
      stack: err.stack?.split('\n').slice(0, 5),
    });
  }
}

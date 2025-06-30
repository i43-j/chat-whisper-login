
// api/chat.js

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
    console.log('=== CHAT PROXY DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Authorization header:', req.headers.authorization);
    console.log('N8N webhook URL:', N8N_CHAT_WEBHOOK);

    // 4) Proxy the request to n8n
    const n8nRes = await fetch(N8N_CHAT_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: JSON.stringify(req.body),
    });

    console.log('N8N response status:', n8nRes.status);
    console.log('N8N response headers:', [...n8nRes.headers.entries()]);

    // 5) Get the raw response text
    const responseText = await n8nRes.text();
    console.log('N8N raw response:', responseText);

    // 6) Parse the response
    let payload;
    try {
      payload = JSON.parse(responseText);
      console.log('N8N parsed response:', payload);
    } catch (parseError) {
      console.error('Failed to parse N8N response as JSON:', parseError);
      payload = { raw: responseText };
    }

    // 7) Return the response with proper status and headers
    res.setHeader('Content-Type', 'application/json');
    return res.status(n8nRes.status).json(payload);

  } catch (err) {
    console.error('[api/chat] proxy error:', err);
    return res.status(500).json({ 
      error: 'Proxy error',
      message: err.message,
      details: err.toString()
    });
  }
}

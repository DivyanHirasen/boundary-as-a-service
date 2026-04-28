export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { situation, role, tone } = req.body;

  if (!situation || !role || !tone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://boundary-as-a-service-gsp6jtkj0.vercel.app',
        'X-Title': 'Boundary as a Service'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-small-3.2-24b-instruct',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a professional workplace communication expert. A ${role} needs help crafting a response to push back on or decline responsibility for something being unfairly pushed onto them.

Situation: ${situation}

Write a ${tone} response they can send (via email or Slack) that:
- Clearly and professionally declines or redirects the responsibility
- Acknowledges the situation without being dismissive
- If appropriate, suggests who actually owns this or what the right process is
- Protects their time and scope without burning bridges
- Feels human, not like a template

Write ONLY the response text itself (2-4 sentences or short paragraphs). No subject line, no preamble. Just the message they can send.`
        }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err?.error?.message || 'OpenRouter API error' });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    return res.status(200).json({ response: text });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
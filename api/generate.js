const MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'openrouter/free'
];

async function tryModel(model, messages, apiKey) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://boundary-as-a-service.vercel.app',
      'X-Title': 'Boundary as a Service'
    },
    body: JSON.stringify({ model, max_tokens: 1000, messages })
  });

  if (response.status === 429) return null;
  return response;
}

function cleanResponse(text) {
  // If response contains --- dividers, extract only the content between them
  const dividerMatch = text.match(/---\s*\n([\s\S]*?)\n\s*---/);
  if (dividerMatch) {
    return dividerMatch[1].trim();
  }
  // Remove common preamble patterns
  text = text.replace(/^(Here[''\u2019]s|Here is|Sure[,!]|Certainly[,!]|Of course[,!]).*?:\s*\n*/i, '');
  // Remove trailing commentary
  text = text.replace(/\n+(---\s*\n*)?(This (keeps|maintains|sets|is)|Feel free|Adjust|Let me know|Hope this|Note:)[\s\S]*$/i, '');
  return text.trim();
}

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

  const messages = [{
    role: 'user',
    content: `You are a professional workplace communication expert. A ${role} needs help crafting a response to push back on or decline responsibility for something being unfairly pushed onto them.

Situation: ${situation}

Write a ${tone} response they can send (via email or Slack) that:
- Starts with a brief, natural greeting (e.g. "Hey," or "Hi team," — do NOT use any specific names like Alex, Sarah, etc.)
- Clearly and professionally declines or redirects the responsibility
- Acknowledges the situation without being dismissive
- If appropriate, suggests who actually owns this or what the right process is
- Protects their time and scope without burning bridges
- Ends with a brief, warm closing line (e.g. "Thanks for understanding," or "Appreciate your flexibility on this.")
- Feels human, not like a template

Write ONLY the response text itself (2-4 sentences or short paragraphs). No subject line, no preamble. Just the message they can send.`
  }];

  for (const model of MODELS) {
    try {
      const response = await tryModel(model, messages, apiKey);
      if (!response) continue; // 429, try next model

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return res.status(response.status).json({ error: err?.error?.message || 'API error' });
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      if (!text) continue;

      return res.status(200).json({ response: cleanResponse(text) });
    } catch (e) {
      continue; // network error, try next model
    }
  }

  return res.status(429).json({ error: 'All free models are busy right now. Try again in a moment.' });
}

export default async function handler(req, res) {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!kvUrl || !kvToken) {
    return res.status(500).json({ error: 'KV not configured' });
  }

  const headers = { Authorization: `Bearer ${kvToken}` };

  if (req.method === 'GET') {
    const response = await fetch(`${kvUrl}/get/boundary_count`, { headers });
    const data = await response.json();
    const count = parseInt(data.result) || 0;
    return res.status(200).json({ count });
  }

  if (req.method === 'POST') {
    const response = await fetch(`${kvUrl}/incr/boundary_count`, { headers });
    const data = await response.json();
    const count = parseInt(data.result) || 0;
    return res.status(200).json({ count });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

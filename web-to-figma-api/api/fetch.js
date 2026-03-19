// api/fetch.js — Vercel Serverless Function
// Receives a URL, fetches it server-side, returns HTML + computed style data
// Deploy to Vercel — this runs on their servers, no CORS issues

export default async function handler(req, res) {
  // Allow requests from Figma plugin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.method === 'POST'
    ? req.body?.url
    : req.query?.url;

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid URL. Must start with http:// or https://' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Site returned ${response.status} ${response.statusText}`,
      });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return res.status(400).json({ error: 'URL does not point to an HTML page' });
    }

    const html = await response.text();
    const finalUrl = response.url; // after redirects

    // Extract key metadata server-side
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i);

    return res.status(200).json({
      html,
      url: finalUrl,
      title: titleMatch ? titleMatch[1].trim() : new URL(finalUrl).hostname,
      description: descMatch ? descMatch[1].trim() : '',
      size: html.length,
    });

  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch: ' + err.message,
    });
  }
}

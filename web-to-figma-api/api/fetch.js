module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const https = require('https');
    const http = require('http');

    const data = await new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      };

      client.get(url, options, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          const redirectClient = redirectUrl.startsWith('https') ? https : http;
          redirectClient.get(redirectUrl, options, (r2) => {
            let body = '';
            r2.on('data', chunk => body += chunk);
            r2.on('end', () => resolve(body));
            r2.on('error', reject);
          }).on('error', reject);
          return;
        }

        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => resolve(body));
        response.on('error', reject);
      }).on('error', reject);
    });

    const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);

    return res.status(200).json({
      html: data,
      url: url,
      title: titleMatch ? titleMatch[1].trim() : '',
      size: data.length,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

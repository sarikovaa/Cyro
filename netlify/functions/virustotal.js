const https = require('https');

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const options = {
      hostname: opts.hostname,
      path: opts.pathname + opts.search,
      method: 'GET',
      headers: headers
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('Invalid JSON: ' + data.substring(0, 200))); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

exports.handler = async function(event) {
  const params = event.queryStringParameters || {};
  const query = params.ip;   // usato sia per IP che per hash
  const key   = params.key;
  const type  = params.type || 'ip_addresses';  // 'ip_addresses' o 'file'

  if (!query || !key) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing query or key' }) };
  }

  try {
    const endpoint = type === 'file' ? 'files' : 'ip_addresses';
    const url = 'https://www.virustotal.com/api/v3/' + endpoint + '/' + encodeURIComponent(query);
    const data = await httpsGet(url, { 'x-apikey': key });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

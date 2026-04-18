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
  const ip = params.ip;
  const key = params.key;

  if (!ip || !key) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing ip or key' }) };
  }

  try {
    const url = 'https://www.virustotal.com/api/v3/ip_addresses/' + encodeURIComponent(ip);
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

const fs = require('fs');
const https = require('https');

const projectRef = 'byghtatgozsthshmxaem';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Z2h0YXRnb3pzdGhzaG14YWVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA2NzE2NCwiZXhwIjoyMDkyNjQzMTY0fQ.rQB1TAoK-rcqCJcGvENfC5ZfB2QvF6lfWAAHTTt27vc';

const source = fs.readFileSync('supabase/functions/asaas-create-subscription/index.ts', 'utf8');

const body = JSON.stringify({
  slug: 'asaas-create-subscription',
  name: 'asaas-create-subscription',
  verify_jwt: false,
  import_map: false,
  files: [{ name: 'index.ts', content: source }]
});

const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${projectRef}/functions`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(body);
req.end();

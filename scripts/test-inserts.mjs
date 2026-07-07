import { readFileSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/SUPABASE_SERVICE_KEY=(.*)/)[1].trim();
const url = 'https://byghtatgozsthshmxaem.supabase.co';
const headers = { 'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' };

// Try to insert a test music_request to see if it fails
const testInsert = {
  artist_id: '91e9722e-21e5-4b4d-ac37-9ec2b66cd7df',
  musica_id: null,
  musica_titulo: 'TESTE DEBUG - DELETAR',
  musica_artista: null,
  user_name: 'DEBUG',
  message: null,
  status: 'pending',
  requested_at: new Date().toISOString(),
  amount: 0.01,
  pix_payment_id: 'debug_test',
  pix_status: 'paid',
  rating: null
};

console.log('Attempting insert into music_requests...');
const resp = await fetch(`${url}/rest/v1/music_requests`, {
  method: 'POST',
  headers: { ...headers, 'Prefer': 'return=representation' },
  body: JSON.stringify(testInsert)
});
const text = await resp.text();
console.log(`Status: ${resp.status}`);
console.log(`Body: ${text}`);

// If successful, delete the test record
if (resp.ok) {
  const data = JSON.parse(text);
  const id = data[0]?.id || data.id;
  if (id) {
    console.log(`\nCleaning up: deleting test record id=${id}`);
    const delResp = await fetch(`${url}/rest/v1/music_requests?id=eq.${id}`, {
      method: 'DELETE',
      headers
    });
    console.log(`Delete status: ${delResp.status}`);
  }
}

// Also test notifications insert
console.log('\n--- Testing notifications insert ---');
const notifInsert = {
  user_id: '91e9722e-21e5-4b4d-ac37-9ec2b66cd7df',
  title: 'TESTE DEBUG - DELETAR',
  content: 'test',
  type: 'music_request',
  read: false
};
const notifResp = await fetch(`${url}/rest/v1/notifications`, {
  method: 'POST',
  headers: { ...headers, 'Prefer': 'return=representation' },
  body: JSON.stringify(notifInsert)
});
const notifText = await notifResp.text();
console.log(`Status: ${notifResp.status}`);
console.log(`Body: ${notifText}`);

if (notifResp.ok) {
  const data = JSON.parse(notifText);
  const id = data[0]?.id || data.id;
  if (id) {
    console.log(`\nCleaning up: deleting test notification id=${id}`);
    const delResp = await fetch(`${url}/rest/v1/notifications?id=eq.${id}`, {
      method: 'DELETE',
      headers
    });
    console.log(`Delete status: ${delResp.status}`);
  }
}

import { readFileSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/SUPABASE_SERVICE_KEY=(.*)/)[1].trim();
const url = 'https://byghtatgozsthshmxaem.supabase.co';
const headers = { 'apikey': key, 'Authorization': 'Bearer ' + key };

const tables = ['notifications', 'music_requests', 'pending_tips', 'artists'];

for (const table of tables) {
  try {
    const resp = await fetch(`${url}/rest/v1/${table}?select=*&order=created_at.desc&limit=3`, { headers });
    const text = await resp.text();
    console.log(`--- ${table} ---`);
    console.log(`Status: ${resp.status}`);
    console.log(`Body: ${text.substring(0, 500)}`);
    console.log();
  } catch (e) {
    console.log(`--- ${table} --- ERROR: ${e.message}`);
  }
}

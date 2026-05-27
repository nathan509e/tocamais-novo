import { readFileSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/SUPABASE_SERVICE_KEY=(.*)/)[1].trim();
const url = 'https://byghtatgozsthshmxaem.supabase.co';
const headers = { 'apikey': key, 'Authorization': 'Bearer ' + key };

async function main() {
  // Query 1 row from each table and inspect the response columns
  const tables = ['users', 'venues', 'artists', 'contractors', 'events', 'musicas_repertorio', 'favorites', 'notifications', 'reviews'];
  
  for (const table of tables) {
    const r = await fetch(url + '/rest/v1/' + table + '?select=*&limit=1', { headers });
    const data = await r.json();
    if (r.status === 200 && Array.isArray(data)) {
      const columns = data.length > 0 ? Object.keys(data[0]) : '(table exists but empty)';
      console.log(`${table}: OK columns=${columns.length > 0 ? columns : '(empty table, no column info)'}`);
      if (typeof columns === 'string') {
        // Table exists but empty - query with HEAD to get columns
        const r2 = await fetch(url + '/rest/v1/' + table + '?select=*&limit=0', { 
          headers: { ...headers, 'Prefer': 'count=exact' }
        });
        console.log(`  ${table}: exists (empty)`);
      }
    } else if (r.status === 404) {
      console.log(`${table}: NOT FOUND`);
    } else {
      console.log(`${table}: status=${r.status} ${JSON.stringify(data).slice(0,200)}`);
    }
  }

  // For users table, try to query to see columns
  const r = await fetch(url + '/rest/v1/users?select=*&limit=1', { headers });
  if (r.status === 200) {
    const data = await r.json();
    if (data.length > 0) {
      console.log('\nUsers columns:', Object.keys(data[0]).join(', '));
    }
  }

  // For venues
  const r2 = await fetch(url + '/rest/v1/venues?select=*&limit=1', { headers });
  if (r2.status === 200) {
    const data = await r2.json();
    if (data.length > 0) {
      console.log('\nVenues columns:', Object.keys(data[0]).join(', '));
    }
  }

  // For musicas_repertorio
  const r3 = await fetch(url + '/rest/v1/musicas_repertorio?select=*&limit=1', { headers });
  if (r3.status === 200) {
    const data = await r3.json();
    if (data.length > 0) {
      console.log('\nMusicas Repertorio columns:', Object.keys(data[0]).join(', '));
    }
  }

  // For events
  const r4 = await fetch(url + '/rest/v1/events?select=*&limit=1', { headers });
  if (r4.status === 200) {
    const data = await r4.json();
    if (data.length > 0) {
      console.log('\nEvents columns:', Object.keys(data[0]).join(', '));
    }
  }
}
main();

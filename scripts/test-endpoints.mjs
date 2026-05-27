import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = readFileSync('.env', 'utf8');
const key = env.match(/SUPABASE_SERVICE_KEY=(.*)/)[1].trim();
const url = 'https://byghtatgozsthshmxaem.supabase.co';

const supabase = createClient(url, key);

const paths = [
  '/pg-meta/default/query',
  '/pg-meta/query',
  '/api/pg-meta/query',
  '/api/sql',
  '/rest/v1/rpc/exec_sql',
  '/rest/v1/rpc/execute_sql',
];

async function main() {
  for (const path of paths) {
    try {
      const response = await fetch(url + path, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': 'Bearer ' + key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: 'SELECT 1 AS test' }),
      });
      const text = await response.text();
      console.log(path, '=>', response.status, text.slice(0, 200));
    } catch (e) {
      console.log(path, '=> Error:', e.message);
    }
  }

  // Try to list PostgREST schema (tables)
  const r = await fetch(url + '/rest/v1/', {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const schema = await r.json();
  const tables = Object.keys(schema.paths || {}).filter(p => p.startsWith('/'));
  console.log('\nPostgREST tables:', tables.join(', '));
}
main();

import { readFileSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/SUPABASE_SERVICE_KEY=(.*)/)[1].trim();
const url = 'https://byghtatgozsthshmxaem.supabase.co';
const headers = { 'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' };

// Check RLS policies on music_requests
const resp = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    query: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
            FROM pg_policies 
            WHERE tablename = 'music_requests'`
  })
});

// That won't work - let's try a direct SQL approach
const resp2 = await fetch(`${url}/sql`, {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'music_requests'`
  })
});

const data = await resp2.json();
console.log('RLS Policies on music_requests:', JSON.stringify(data, null, 2));

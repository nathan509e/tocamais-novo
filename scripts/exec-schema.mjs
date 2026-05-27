import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://byghtatgozsthshmxaem.supabase.co';
const key = process.argv[2];

if (!key) {
  console.error('Uso: node scripts/exec-schema.mjs <service_role_key>');
  process.exit(1);
}

const sql = readFileSync('./supabase_schema.sql', 'utf-8');

// Split into individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('\n--'));

let ok = 0;
let fail = 0;

for (const stmt of statements) {
  const res = await fetch(`${SUPABASE_URL}/sql`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: stmt + ';' }),
  });

  const text = await res.text();
  if (res.ok) {
    ok++;
    if (ok % 20 === 0) process.stdout.write('.');
  } else {
    fail++;
    console.error(`\n[ERRO] (${stmt.slice(0, 80)}...): ${text}`);
  }
}

console.log(`\n\nConcluído: ${ok} OK, ${fail} falhas`);

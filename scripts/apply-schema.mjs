import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://byghtatgozsthshmxaem.supabase.co';
const serviceRoleKey = process.argv[2];

if (!serviceRoleKey) {
  console.error('Uso: node scripts/apply-schema.mjs <service_role_key>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Check existing tables
const { data: tables, error: tablesError } = await supabase
  .from('information_schema.tables')
  .select('table_name')
  .eq('table_schema', 'public')
  .eq('table_type', 'BASE TABLE');

if (tablesError) {
  // information_schema might not be accessible via the client, try raw SQL
  console.log('Checking via raw SQL...');
}

const existingTables = (tables || []).map(t => t.table_name);
console.log('Tabelas existentes:', existingTables);

// Read and execute SQL schema
const sql = readFileSync('./supabase_schema.sql', 'utf-8');

// Split by semicolons and execute each statement
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

let successCount = 0;
let failCount = 0;

for (const stmt of statements) {
  // Try using rpc with raw SQL
  const { error } = await supabase.rpc('exec_sql', { query: stmt + ';' });
  if (error) {
    if (error.message?.includes('function') && error.message?.includes('exec_sql')) {
      console.log('Precisa criar a função exec_sql primeiro. Tentando via REST...');
      break;
    }
    console.error('Erro:', error.message);
    failCount++;
  } else {
    successCount++;
  }
}

console.log(`\nSchema aplicado: ${successCount} OK, ${failCount} falhas`);

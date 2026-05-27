import { readFileSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/SUPABASE_SERVICE_KEY=(.*)/)[1].trim();
const url = 'https://byghtatgozsthshmxaem.supabase.co';
const headers = { 'apikey': key, 'Authorization': 'Bearer ' + key };

// Our desired schema columns (from supabase_schema.sql)
const desired = {
  users: ['id', 'email', 'nome', 'tipo', 'telefone', 'cidade', 'avatar_url', 'created_at'],
  artists: ['id', 'user_id', 'nome', 'genero_musical', 'descricao', 'foto_url', 'cidade', 'estado', 'telefone', 'email', 'instagram', 'youtube', 'spotify', 'preco_min', 'preco_max', 'presentation_video_url', 'selected_musicas_ids', 'created_at'],
  venues: ['id', 'owner_email', 'nome', 'descricao', 'endereco', 'cidade', 'estado', 'capacidade', 'telefone', 'foto_url', 'instagram', 'created_at'],
  contractors: ['id', 'user_id', 'nome', 'empresa', 'telefone', 'email', 'descricao', 'created_at'],
  events: ['id', 'proposal_id', 'venue_id', 'artista_id', 'data_evento', 'status', 'created_at'],
  musicas_repertorio: ['id', 'artista_id', 'titulo', 'artista_nome', 'duracao_seg', 'created_at'],
};

async function main() {
  // Get OpenAPI spec which includes table columns
  const r = await fetch(url + '/rest/v1/', { headers });
  const spec = await r.json();

  const existingTables = {};

  for (const [path, methods] of Object.entries(spec.paths || {})) {
    if (path === '/' || path === '/rpc/confirm_pix_with_limit_check') continue;
    const tableName = path.replace(/^\//, '');
    if (!methods.get) continue;
    const params = methods.get.parameters || [];
    const columns = params
      .filter(p => p.name && p.name.startsWith('rowFilter.' + tableName + '.'))
      .map(p => p.name.replace('rowFilter.' + tableName + '.', ''));
    existingTables[tableName] = columns;
  }

  console.log('=== Existing tables and columns ===');
  for (const [table, cols] of Object.entries(existingTables)) {
    console.log(`\n${table}: ${cols.join(', ')}`);
  }

  console.log('\n\n=== MISSING TABLES ===');
  for (const [table, cols] of Object.entries(desired)) {
    if (!existingTables[table]) {
      console.log(`Table '${table}' is MISSING`);
    }
  }

  console.log('\n=== MISSING COLUMNS ===');
  for (const [table, desiredCols] of Object.entries(desired)) {
    const existingCols = existingTables[table];
    if (!existingCols) continue;
    const missing = desiredCols.filter(c => !existingCols.includes(c));
    if (missing.length > 0) {
      console.log(`Table ${table} missing columns: ${missing.join(', ')}`);
    }
    const extra = existingCols.filter(c => !desiredCols.includes(c));
    if (extra.length > 0) {
      console.log(`Table ${table} extra columns: ${extra.join(', ')}`);
    }
  }
}
main();

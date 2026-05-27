import { readFileSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/SUPABASE_SERVICE_KEY=(.*)/)[1].trim();
const url = 'https://byghtatgozsthshmxaem.supabase.co';
const headers = { 'apikey': key, 'Authorization': 'Bearer ' + key };

async function main() {
  const r = await fetch(url + '/rest/v1/', { headers });
  const spec = await r.json();

  // Parse parameters section to get column definitions
  const parameters = spec.parameters || {};
  const tableColumns = {};

  for (const [paramName, paramDef] of Object.entries(parameters)) {
    // Format: rowFilter.{table}.{column}
    const match = paramName.match(/^rowFilter\.(.+)\.(.+)$/);
    if (match) {
      const [, table, column] = match;
      if (!tableColumns[table]) tableColumns[table] = [];
      tableColumns[table].push(column);
    }
  }

  for (const [table, cols] of Object.entries(tableColumns).sort()) {
    console.log(`${table}: ${cols.join(', ')}`);
  }
}
main();

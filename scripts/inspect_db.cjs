const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://byghtatgozsthshmxaem.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Z2h0YXRnb3pzdGhzaG14YWVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA2NzE2NCwiZXhwIjoyMDkyNjQzMTY0fQ.rQB1TAoK-rcqCJcGvENfC5ZfB2QvF6lfWAAHTTt27vc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('artists').select('id, user_id, artistic_name, asaas_wallet_id, cpf_cnpj');
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

main();

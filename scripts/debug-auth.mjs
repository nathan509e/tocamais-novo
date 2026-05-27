import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf8');
const key = env.match(/SUPABASE_SERVICE_KEY=(.*)/)[1].trim();
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  // 1. Check auth settings
  console.log('=== Auth Settings ===');
  const r = await fetch(url + '/auth/v1/settings', {
    headers: { apikey: key, Authorization: 'Bearer ' + key }
  });
  const settings = await r.text();
  console.log(settings.slice(0, 1000));
  console.log();

  // 2. Try to find what functions exist that might be triggers
  // Insert directly into auth schema via a service_role SQL hack
  // Actually try the admin user create with more params
  console.log('=== Try creating user with different params ===');
  const r2 = await fetch(url + '/auth/v1/admin/users', {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'test-details@test.com',
      password: '123456',
      email_confirm: true,
      aud: 'authenticated',
      ban_duration: null,
      data: { name: 'Test' }
    })
  });
  const body = await r2.json();
  console.log('Status:', r2.status, JSON.stringify(body, null, 2));

  // 3. If this fails, try getting more info about the error
  if (r2.status >= 400) {
    console.log('\nError ID:', body.error_id);
    console.log('Error code:', body.error_code);
    console.log('Message:', body.msg);
  }

  // 4. Check auth.users directly via a workaround
  // The api key with service_role can access auth through GoTrue
  console.log('\n=== List all auth users ===');
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.log('Error listing users:', error.message);
  } else {
    console.log(`Found ${users?.users?.length || 0} users`);
    for (const u of users?.users || []) {
      console.log(`  ${u.email}: id=${u.id} confirmed=${!!u.email_confirmed_at}`);
    }
  }
}
main().catch(e => console.error(e));

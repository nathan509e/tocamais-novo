import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env manually
let env = {};
try {
  const envContent = readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      env[key] = val;
    }
  });
} catch (e) {
  console.error("Could not read .env file:", e);
}

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://byghtatgozsthshmxaem.supabase.co';
const supabaseServiceKey = env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error("Missing SUPABASE_SERVICE_KEY in .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearPendingTips() {
  console.log("Fetching pending tips...");
  const { data: pendingTips, error: fetchError } = await supabase
    .from('pending_tips')
    .select('id, amount, status, created_at')
    .eq('status', 'pending');

  if (fetchError) {
    console.error("Error fetching pending tips:", fetchError);
    process.exit(1);
  }

  console.log(`Found ${pendingTips.length} pending tips.`);
  if (pendingTips.length === 0) {
    console.log("No pending tips to clear.");
    return;
  }

  console.log("Deleting pending tips...");
  const { error: deleteError } = await supabase
    .from('pending_tips')
    .delete()
    .eq('status', 'pending');

  if (deleteError) {
    console.error("Error deleting pending tips:", deleteError);
    process.exit(1);
  }

  console.log("Successfully cleared all pending tips!");
}

clearPendingTips();

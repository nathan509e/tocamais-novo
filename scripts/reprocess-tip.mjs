import { readFileSync } from 'fs';

const key = readFileSync('.env', 'utf8').match(/SUPABASE_SERVICE_KEY=(.*)/)[1].trim();
const url = 'https://byghtatgozsthshmxaem.supabase.co';
const headers = { 'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' };

// The orphan tip that was confirmed but never got music_request/notification
const tipId = 'a18b13fc-38dc-4a20-b37b-5e01b395bbe0';
const paymentId = 'pay_jbr18psv6giyset9';
const paymentValue = 5.00;

console.log('=== Reprocessing orphan tip ===');
console.log(`Tip ID: ${tipId}`);
console.log(`Payment ID: ${paymentId}`);
console.log(`Amount: R$ ${paymentValue}`);

// 1. Fetch the full pending tip
const tipResp = await fetch(`${url}/rest/v1/pending_tips?id=eq.${tipId}&select=*`, { headers });
const tips = await tipResp.json();
const tip = tips[0];

if (!tip) {
  console.error('Tip not found!');
  process.exit(1);
}

console.log(`\nTip data:`, JSON.stringify(tip, null, 2));

// 2. Check if music_request already exists for this payment
const existingReq = await fetch(`${url}/rest/v1/music_requests?pix_payment_id=eq.${paymentId}&select=id`, { headers });
const existingReqs = await existingReq.json();
if (existingReqs.length > 0) {
  console.log(`\nMusic request already exists (id=${existingReqs[0].id}), skipping insert.`);
} else {
  // 3. Insert music_request
  const musicRequest = {
    artist_id: tip.artist_id,
    musica_id: tip.musica_id || null,
    musica_titulo: tip.musica_titulo || 'Pedido com Gorjeta',
    musica_artista: tip.musica_artista || null,
    user_name: tip.user_name || 'Cliente',
    message: tip.user_message || null,
    status: 'pending',
    requested_at: new Date().toISOString(),
    amount: paymentValue,
    pix_payment_id: paymentId,
    pix_status: 'paid',
    rating: tip.rating || null
  };

  console.log('\nInserting music_request:', JSON.stringify(musicRequest, null, 2));
  const insertResp = await fetch(`${url}/rest/v1/music_requests`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(musicRequest)
  });
  const insertText = await insertResp.text();
  console.log(`Insert status: ${insertResp.status}`);
  console.log(`Insert body: ${insertText}`);
}

// 4. Check if notification already exists
const existingNotif = await fetch(`${url}/rest/v1/notifications?user_id=eq.${tip.artist_id}&title=like.*gorjeta*5.00*&select=id`, { headers });
const existingNotifs = await existingNotif.json();
if (existingNotifs.length > 0) {
  console.log(`\nNotification already exists (id=${existingNotifs[0].id}), skipping.`);
} else {
  // 5. Insert notification
  const notifTitle = `Novo pedido com gorjeta de R$ ${paymentValue.toFixed(2)}`;
  const notifContent = `${tip.user_name || 'Cliente'} pediu "${tip.musica_titulo || 'uma música'}"${tip.user_message ? `: ${tip.user_message}` : ''}`;

  console.log('\nInserting notification:', notifTitle);
  const notifResp = await fetch(`${url}/rest/v1/notifications`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify({
      user_id: tip.artist_id,
      title: notifTitle,
      content: notifContent,
      type: 'music_request',
      read: false
    })
  });
  const notifText = await notifResp.text();
  console.log(`Insert status: ${notifResp.status}`);
  console.log(`Insert body: ${notifText}`);
}

console.log('\n=== Done! ===');

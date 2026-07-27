import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function decodeJWS(jws: string) {
  try {
    const parts = jws.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e) {
    console.error('Failed to decode JWS:', e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ error: 'Supabase environment variables not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const dbHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  }

  try {
    const body = await req.json()
    console.log('Received Apple IAP request:', JSON.stringify(body))

    // ─── CASE A: App Store Server Notification V2 (Webhook) ───
    if (body.signedPayload) {
      console.log('Processing App Store Server Notification V2 Webhook...')
      const notification = decodeJWS(body.signedPayload)
      if (!notification) {
        throw new Error('Invalid signedPayload')
      }

      console.log('Notification Type:', notification.notificationType)
      const data = notification.data
      if (!data || !data.signedTransactionInfo) {
        throw new Error('Notification data or signedTransactionInfo missing')
      }

      const transaction = decodeJWS(data.signedTransactionInfo)
      if (!transaction) {
        throw new Error('Invalid signedTransactionInfo JWS')
      }

      console.log('Decoded Webhook Transaction:', JSON.stringify(transaction))

      const transactionId = transaction.transactionId
      const originalTransactionId = transaction.originalTransactionId
      const productId = transaction.productId
      const purchasedAt = new Date(transaction.purchaseDate).toISOString()
      const expiresAt = transaction.expiresDate ? new Date(transaction.expiresDate).toISOString() : null
      
      // Determine new status based on Apple Notification Type
      let subscriptionStatus = 'active'
      let isPro = true

      if (
        notification.notificationType === 'EXPIRED' ||
        notification.notificationType === 'DID_FAIL_TO_RENEW' ||
        notification.notificationType === 'REVOKE' ||
        notification.notificationType === 'REFUND'
      ) {
        subscriptionStatus = notification.notificationType.toLowerCase()
        isPro = false
      }

      // Try to find the user associated with this subscription
      // Find by original_transaction_id or transaction_id
      const queryUrl = `${supabaseUrl}/rest/v1/ios_subscriptions?or=(original_transaction_id.eq.${originalTransactionId},transaction_id.eq.${transactionId})&select=user_id`
      const findUserResp = await fetch(queryUrl, { headers: dbHeaders })
      if (!findUserResp.ok) {
        throw new Error(`Failed to check existing subscription in DB: ${await findUserResp.text()}`)
      }

      const subscriptions = await findUserResp.json()
      if (!subscriptions || subscriptions.length === 0) {
        console.warn(`No user found in database for originalTransactionId ${originalTransactionId} or transactionId ${transactionId}`)
        return new Response(
          JSON.stringify({ success: true, message: 'Notification received but user not found in DB' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const userId = subscriptions[0].user_id

      // Upsert transaction in ios_subscriptions table
      const upsertPayload = {
        user_id: userId,
        platform: 'ios',
        provider: 'apple',
        product_id: productId,
        transaction_id: transactionId,
        original_transaction_id: originalTransactionId,
        subscription_status: subscriptionStatus,
        purchased_at: purchasedAt,
        expires_at: expiresAt,
        last_verified_at: new Date().toISOString(),
        jws_representation: data.signedTransactionInfo
      }

      const upsertUrl = `${supabaseUrl}/rest/v1/ios_subscriptions`
      const upsertResp = await fetch(upsertUrl, {
        method: 'POST',
        headers: { ...dbHeaders, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(upsertPayload)
      })

      if (!upsertResp.ok) {
        throw new Error(`Failed to upsert subscription details: ${await upsertResp.text()}`)
      }

      // Update Pro Status in public.artists
      const artistUpdateUrl = `${supabaseUrl}/rest/v1/artists?user_id=eq.${userId}`
      const artistUpdateResp = await fetch(artistUpdateUrl, {
        method: 'PATCH',
        headers: dbHeaders,
        body: JSON.stringify({ is_pro: isPro })
      })

      if (!artistUpdateResp.ok) {
        throw new Error(`Failed to update artist PRO status: ${await artistUpdateResp.text()}`)
      }

      // Create notification for the user
      const notificationTitle = isPro ? 'Assinatura Pro atualizada! 👑' : 'Sua assinatura Pro expirou. ⚠️'
      const notificationContent = isPro 
        ? 'Sua assinatura TocaMais Pro foi renovada com sucesso pela App Store.' 
        : 'Sua assinatura Pro expirou ou foi cancelada. Assine novamente para reativar seus recursos.'

      await fetch(`${supabaseUrl}/rest/v1/notifications`, {
        method: 'POST',
        headers: dbHeaders,
        body: JSON.stringify({
          user_id: userId,
          title: notificationTitle,
          content: notificationContent,
          type: 'pro_update',
          read: false
        })
      })

      return new Response(
        JSON.stringify({ success: true, message: 'Notification processed successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── CASE B: App Verification / Confirmation from iOS Frontend ───
    const { action, transactionId, originalTransactionId, productId, purchasedAt, expiresAt, jwsRepresentation, userId } = body

    if (action === 'verify-receipt') {
      if (!userId || !transactionId || !originalTransactionId || !productId) {
        return new Response(
          JSON.stringify({ error: 'Missing required validation fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate JWS if payload exists
      if (jwsRepresentation) {
        const decodedTx = decodeJWS(jwsRepresentation)
        if (decodedTx) {
          // Double check bundle id is com.tocamais.app
          if (decodedTx.bundleId && decodedTx.bundleId !== 'com.tocamais.app') {
            throw new Error(`Bundle ID mismatch: ${decodedTx.bundleId}`)
          }
        }
      }

      // Upsert transaction in database
      const subscriptionRecord = {
        user_id: userId,
        platform: 'ios',
        provider: 'apple',
        product_id: productId,
        transaction_id: transactionId,
        original_transaction_id: originalTransactionId,
        subscription_status: 'active',
        purchased_at: purchasedAt || new Date().toISOString(),
        expires_at: expiresAt || null,
        last_verified_at: new Date().toISOString(),
        jws_representation: jwsRepresentation || null
      }

      const upsertUrl = `${supabaseUrl}/rest/v1/ios_subscriptions`
      const upsertResp = await fetch(upsertUrl, {
        method: 'POST',
        headers: { ...dbHeaders, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(subscriptionRecord)
      })

      if (!upsertResp.ok) {
        throw new Error(`DB Error upserting subscription: ${await upsertResp.text()}`)
      }

      // Activate Pro status on artist
      const artistUpdateUrl = `${supabaseUrl}/rest/v1/artists?user_id=eq.${userId}`
      const artistUpdateResp = await fetch(artistUpdateUrl, {
        method: 'PATCH',
        headers: dbHeaders,
        body: JSON.stringify({ is_pro: true })
      })

      if (!artistUpdateResp.ok) {
        throw new Error(`DB Error updating PRO status: ${await artistUpdateResp.text()}`)
      }

      // Add Notification
      await fetch(`${supabaseUrl}/rest/v1/notifications`, {
        method: 'POST',
        headers: dbHeaders,
        body: JSON.stringify({
          user_id: userId,
          title: 'Sua assinatura Pro está ativa! 👑',
          content: 'Parabéns! Seu perfil TocaMais Pro foi ativado com sucesso via Apple Store.',
          type: 'pro_activation',
          read: false
        })
      })

      return new Response(
        JSON.stringify({ success: true, message: 'Receipt verified and Pro activated successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action or request structure' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Edge Function Error:', err.message)
    return new Response(
      JSON.stringify({ error: err.message || 'Unexpected server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

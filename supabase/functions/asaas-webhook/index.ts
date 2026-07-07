import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Health check — GET requests return status without auth
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'alive', message: 'asaas-webhook is running', timestamp: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Verify Asaas webhook token — header OR query string
    const url = new URL(req.url)
    const asaasToken = req.headers.get('asaas-access-token') || url.searchParams.get('token')
    const expectedToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN')

    if (!expectedToken) {
      console.error('ASAAS_WEBHOOK_TOKEN not configured')
      return new Response(
        JSON.stringify({ error: 'Webhook token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (asaasToken !== expectedToken) {
      console.error('Invalid webhook token')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload = await req.json()
    const { event } = payload

    console.log(`Received webhook: ${event}`, JSON.stringify(payload).substring(0, 500))

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ─── PIX RECEIVED — Process tip payment ───
    if (event === 'PIX_RECEIVED' || event === 'PAYMENT_RECEIVED') {
      let paymentId: string
      let paymentValue: number
      let paymentDate: string
      let isSubscription = false

      if (payload.payment) {
        // Dynamic PIX via /v3/payments — full payment object
        const payment = payload.payment
        paymentId = payment.id
        paymentValue = Number(payment.value)
        paymentDate = payment.paymentDate || new Date().toISOString()
        isSubscription = !!payment.subscription
        console.log(`PIX received from payment: R$ ${paymentValue}, paymentId: ${paymentId}, subscription: ${isSubscription}`)
      } else if (payload.pixTransaction) {
        const tx = payload.pixTransaction
        paymentId = tx.id
        paymentValue = Number(tx.value)
        paymentDate = tx.dateCreated || new Date().toISOString()

        // Try exact EVP key match to avoid FIFO collisions
        const pixAddressingKey = tx.pixAddressingKey || null
        if (pixAddressingKey) {
          const { data: evpMatch, error: evpErr } = await supabase
            .from('pending_tips')
            .select('*')
            .eq('pix_key', pixAddressingKey)
            .eq('status', 'pending')
            .eq('amount', paymentValue)
            .maybeSingle()

          if (!evpErr && evpMatch) {
            console.log(`EVP key matched pending_tip: ${evpMatch.id}, artist: ${evpMatch.artist_id}, key: ${pixAddressingKey.substring(0, 8)}...`)

            if (evpMatch.status === 'confirmed') {
              console.log('Tip already confirmed (EVP), skipping:', evpMatch.id)
              return new Response(
                JSON.stringify({ success: true, message: 'Already processed (EVP)' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }

            await processTip(supabase, evpMatch, paymentId, paymentValue, paymentDate)
            return new Response(
              JSON.stringify({ success: true, message: 'Tip processed (EVP key match)', pendingTipId: evpMatch.id }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }

        console.log(`PIX received from pixTransaction: R$ ${paymentValue}, transactionId: ${paymentId}`)
      } else {
        console.log('No payment or pixTransaction in payload, acknowledging')
        return new Response(
          JSON.stringify({ success: true, message: 'No payment data' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // ─── Subscription payment received — activate Pro ───
      if (isSubscription) {
        const subId = payload.payment.subscription
        console.log(`Payment ${paymentId} is for subscription ${subId} — activating Pro`)

        const { data: subArtist, error: subFindErr } = await supabase
          .from('artists')
          .select('user_id')
          .eq('asaas_subscription_id', subId)
          .single()

        if (subFindErr || !subArtist) {
          console.error('Artist not found for subscription:', subId, subFindErr)
        } else {
          const { error: subUpdateErr } = await supabase
            .from('artists')
            .update({ is_pro: true })
            .eq('user_id', subArtist.user_id)

          if (subUpdateErr) {
            console.error('Failed to activate Pro:', subUpdateErr)
          } else {
            console.log(`Pro activated for artist ${subArtist.user_id}`)
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Subscription payment processed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // ─── Idempotency + find pending tip ───
      // Always fetch FULL record (*) — previous bug: only fetched {id, status} then used as full record
      const { data: pendingTip, error: findError } = await supabase
        .from('pending_tips')
        .select('*')
        .eq('asaas_transaction_id', paymentId)
        .single()

      if (findError || !pendingTip) {
        // Fallback: find oldest matching pending tip for this amount (FIFO)
        console.log(`No pending_tip by asaas_transaction_id=${paymentId}, trying FIFO by amount R$${paymentValue}`)
        const { data: byAmount, error: err2 } = await supabase
          .from('pending_tips')
          .select('*')
          .eq('status', 'pending')
          .eq('amount', paymentValue)
          .order('created_at', { ascending: true })
          .limit(1)

        if (!byAmount || byAmount.length === 0) {
          console.log('No matching pending tip found — storing as unmatched')
          return new Response(
            JSON.stringify({ success: true, message: 'No matching pending tip' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Use the FIFO match
        const tip = byAmount[0]
        console.log(`FIFO matched pending_tip: ${tip.id}, artist: ${tip.artist_id}`)

        // Check idempotency — if already confirmed, skip
        if (tip.status === 'confirmed') {
          console.log('Tip already confirmed, skipping:', tip.id)
          return new Response(
            JSON.stringify({ success: true, message: 'Already processed' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        await processTip(supabase, tip, paymentId, paymentValue, paymentDate)
        return new Response(
          JSON.stringify({ success: true, message: 'Tip processed (FIFO)', pendingTipId: tip.id }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Found by asaas_transaction_id
      console.log(`Matched pending_tip: ${pendingTip.id}, artist: ${pendingTip.artist_id}`)

      // Idempotency — if already confirmed, skip
      if (pendingTip.status === 'confirmed') {
        console.log('Tip already confirmed, skipping:', pendingTip.id)
        return new Response(
          JSON.stringify({ success: true, message: 'Already processed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      await processTip(supabase, pendingTip, paymentId, paymentValue, paymentDate)
      return new Response(
        JSON.stringify({ success: true, message: 'Tip processed', pendingTipId: pendingTip.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── SUBSCRIPTION EVENTS ───
    if (event === 'SUBSCRIPTION_INACTIVATED' || event === 'SUBSCRIPTION_DELETED') {
      const subscription = payload.subscription
      console.log(`Subscription ${event}: ${subscription?.id}`)

      const { data: artist, error: findErr } = await supabase
        .from('artists')
        .select('user_id')
        .eq('asaas_subscription_id', subscription?.id)
        .single()

      if (findErr || !artist) {
        console.error('Artist not found for subscription:', subscription?.id, findErr)
      } else {
        const { error: updateErr } = await supabase
          .from('artists')
          .update({ is_pro: false })
          .eq('user_id', artist.user_id)

        if (updateErr) {
          console.error('Failed to revoke Pro:', updateErr)
        } else {
          console.log(`Pro revoked for artist ${artist.user_id}`)
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: `${event} processed` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── Unknown event — acknowledge ───
    console.log(`Unhandled event: ${event}`)
    return new Response(
      JSON.stringify({ success: true, message: `Event ${event} acknowledged` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ─── Helper: process a matched tip ───
async function processTip(
  supabase: any,
  pendingTip: any,
  paymentId: string,
  paymentValue: number,
  paymentDate: string
) {
  console.log(`Processing tip: pending_tip=${pendingTip.id}, artist=${pendingTip.artist_id}, R$${paymentValue}`)

  // Update pending_tip status
  const { error: updateErr } = await supabase
    .from('pending_tips')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      asaas_transaction_id: paymentId,
      pix_received_value: paymentValue,
      pix_received_at: paymentDate
    })
    .eq('id', pendingTip.id)

  if (updateErr) {
    console.error('Failed to update pending_tips:', JSON.stringify(updateErr))
  }

  // ─── Transfer to artist (split logic) ───
  const apiKey = Deno.env.get('ASAAS_API_KEY') || ''
  const baseUrl = apiKey.includes('aact_hmlg')
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/v3'
  const authHeaders = { 'Content-Type': 'application/json', 'access_token': apiKey, 'User-Agent': 'TocaMais/1.0' }

  let transferStatus = 'not_attempted'
  let transferError: string | null = null

  if (pendingTip.artist_id) {
    // Fetch artist info
    const { data: artist } = await supabase
      .from('artists')
      .select('asaas_wallet_id, pix_key, user_id')
      .eq('user_id', pendingTip.artist_id)
      .single()

    if (artist?.asaas_wallet_id) {
      // Artist has Asaas wallet → transfer 70% via wallet-to-wallet transfer
      const artistShare = Math.round(paymentValue * 0.7 * 100) / 100
      try {
        const transferResp = await fetch(`${baseUrl}/transfers`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            value: artistShare,
            walletId: artist.asaas_wallet_id
          })
        })
        if (transferResp.ok) {
          transferStatus = 'completed'
          console.log(`Transferred R$ ${artistShare} to artist wallet ${artist.asaas_wallet_id}`)
        } else {
          const errText = await transferResp.text()
          console.error('Wallet transfer failed, trying PIX fallback:', errText)
          // Fallback: try PIX transfer if wallet transfer fails (accounts not linked)
          if (artist.pix_key) {
            const key = artist.pix_key
            let pixKeyType = 'EVP'
            if (key.includes('@')) pixKeyType = 'EMAIL'
            else if (/^\d{11}$/.test(key)) pixKeyType = 'CPF'
            else if (/^\d{14}$/.test(key)) pixKeyType = 'CNPJ'
            else if (/^\+?\d{10,13}$/.test(key)) pixKeyType = 'PHONE'

            const pixTransferResp = await fetch(`${baseUrl}/transfers`, {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify({
                value: artistShare,
                type: 'PIX',
                pixAddressKey: artist.pix_key,
                pixAddressKeyType: pixKeyType,
                description: 'Repasse TocaMais - Gorjeta'
              })
            })
            if (pixTransferResp.ok) {
              transferStatus = 'completed_pix_fallback'
              console.log(`PIX fallback: Transferred R$ ${artistShare} to artist PIX ${artist.pix_key}`)
            } else {
              const pixErr = await pixTransferResp.text()
              console.error('PIX fallback also failed:', pixErr)
              transferStatus = 'failed'
              transferError = `Wallet: ${errText.substring(0, 200)} | PIX: ${pixErr.substring(0, 200)}`
            }
          } else {
            transferStatus = 'failed'
            transferError = errText.substring(0, 500)
          }
        }
      } catch (e) {
        transferStatus = 'failed'
        transferError = e instanceof Error ? e.message : String(e)
      }
    } else if (artist?.pix_key) {
      // Pro artist with direct PIX key (no Asaas wallet)
      const artistShare = Math.round(paymentValue * 0.7 * 100) / 100
      try {
        const key = artist.pix_key
        let pixKeyType = 'EVP'
        if (key.includes('@')) pixKeyType = 'EMAIL'
        else if (/^\d{11}$/.test(key)) pixKeyType = 'CPF'
        else if (/^\d{14}$/.test(key)) pixKeyType = 'CNPJ'
        else if (/^\+?\d{10,13}$/.test(key)) pixKeyType = 'PHONE'

        const transferResp = await fetch(`${baseUrl}/transfers`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            value: artistShare,
            type: 'PIX',
            pixAddressKey: artist.pix_key,
            pixAddressKeyType: pixKeyType,
            description: 'Repasse TocaMais - Gorjeta'
          })
        })

        if (transferResp.ok) {
          transferStatus = 'completed'
        } else {
          const errText = await transferResp.text()
          console.error('Transfer to PIX key failed:', errText)
          transferStatus = 'failed'
          transferError = errText.substring(0, 500)
        }
      } catch (e) {
        transferStatus = 'failed'
        transferError = e instanceof Error ? e.message : String(e)
      }
    } else {
      transferStatus = 'no_pix_key'
      transferError = 'Artist has no wallet or PIX key'
    }

    // ─── Insert music request ───
    const musicRequest = {
      artist_id: pendingTip.artist_id,
      musica_id: pendingTip.musica_id || null,
      musica_titulo: pendingTip.musica_titulo || 'Pedido com Gorjeta',
      musica_artista: pendingTip.musica_artista || null,
      user_name: pendingTip.user_name || 'Cliente',
      message: pendingTip.user_message || null,
      status: 'pending',
      requested_at: new Date().toISOString(),
      amount: paymentValue,
      pix_payment_id: paymentId,
      pix_status: transferStatus === 'completed' || transferStatus === 'completed_pix_fallback' ? 'transferred' : 'paid',
      rating: pendingTip.rating || null
    }
    console.log('Inserting music_request:', JSON.stringify(musicRequest))

    const insertResp = await supabase
      .from('music_requests')
      .insert(musicRequest)
      .select('id')
      .single()

    if (insertResp.error) {
      console.error('Insert music_request FAILED:', JSON.stringify(insertResp.error))
    } else {
      console.log('music_request inserted:', insertResp.data?.id)
    }

    // ─── Create notification for artist ───
    let artistUserId = artist?.user_id
    if (!artistUserId && pendingTip.artist_id) {
      const { data: artistLookup } = await supabase
        .from('artists')
        .select('user_id')
        .eq('user_id', pendingTip.artist_id)
        .single()
      artistUserId = artistLookup?.user_id
    }

    if (artistUserId) {
      const notifTitle = paymentValue > 0
        ? `Novo pedido com gorjeta de R$ ${paymentValue.toFixed(2)}`
        : 'Novo pedido de música'
      const notifContent = `${pendingTip.user_name || 'Cliente'} pediu "${pendingTip.musica_titulo || 'uma música'}"${pendingTip.user_message ? `: ${pendingTip.user_message}` : ''}`

      console.log('Inserting notification for artist:', artistUserId)
      const notifResp = await supabase.from('notifications').insert({
        user_id: artistUserId,
        title: notifTitle,
        content: notifContent,
        type: 'music_request',
        read: false
      })
      if (notifResp.error) {
        console.error('Insert notification FAILED:', JSON.stringify(notifResp.error))
      } else {
        console.log('Notification inserted successfully')
      }
    } else {
      console.error('No artist user_id found for notification — artist_id:', pendingTip.artist_id)
    }

    // ─── Update artist rating ───
    if (pendingTip.rating && Number(pendingTip.rating) >= 1 && Number(pendingTip.rating) <= 5) {
      const { data: ratings } = await supabase
        .from('music_requests')
        .select('rating')
        .eq('artist_id', pendingTip.artist_id)
        .not('rating', 'is', null)

      if (ratings?.length) {
        const avg = ratings.reduce((sum: number, r: any) => sum + Number(r.rating), 0) / ratings.length
        await supabase
          .from('artists')
          .update({ rating: Math.round(avg * 10) / 10 })
          .eq('user_id', pendingTip.artist_id)
      }
    }
  }

  console.log(`Tip processed: pending_tip=${pendingTip.id}, transfer=${transferStatus}`)
}

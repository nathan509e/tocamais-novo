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
      const payment = payload.payment
      if (!payment) {
        console.log('No payment in payload, acknowledging')
        return new Response(
          JSON.stringify({ success: true, message: 'No payment data' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const paymentId = payment.id
      const paymentValue = Number(payment.value)
      const paymentDate = payment.paymentDate || new Date().toISOString()

      console.log(`PIX received: R$ ${paymentValue}, paymentId: ${paymentId}`)

      // ─── Subscription payment received — activate Pro ───
      if (payment.subscription) {
        console.log(`Payment ${paymentId} is for subscription ${payment.subscription} — activating Pro`)

        const { data: subArtist, error: subFindErr } = await supabase
          .from('artists')
          .select('user_id')
          .eq('asaas_subscription_id', payment.subscription)
          .single()

        if (subFindErr || !subArtist) {
          console.error('Artist not found for subscription:', payment.subscription, subFindErr)
        } else {
          const { error: subUpdateErr } = await supabase
            .from('artists')
            .update({ is_pro: true })
            .eq('user_id', subArtist.user_id)

          if (subUpdateErr) {
            console.error('Error activating Pro on payment:', subUpdateErr)
          } else {
            console.log(`Pro activated for user ${subArtist.user_id} (subscription payment)`)
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Subscription payment processed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if this payment was already processed (idempotency)
      const { data: existingTip } = await supabase
        .from('pending_tips')
        .select('id, status')
        .eq('asaas_transaction_id', paymentId)
        .single()

      if (existingTip && existingTip.status === 'confirmed') {
        console.log('Payment already processed, skipping:', paymentId)
        return new Response(
          JSON.stringify({ success: true, message: 'Already processed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Find the pending tip linked to this Asaas payment ID
      let pendingTip = null
      let findError = null

      if (existingTip) {
        // Already found by asaas_transaction_id above
        pendingTip = existingTip
      } else {
        // Try to find by asaas_transaction_id first (most reliable)
        const { data: byTransactionId, error: err1 } = await supabase
          .from('pending_tips')
          .select('*')
          .eq('asaas_transaction_id', paymentId)
          .single()

        if (byTransactionId) {
          pendingTip = byTransactionId
        } else {
          // Fallback: find oldest matching pending tip for this amount (FIFO)
          const { data: byAmount, error: err2 } = await supabase
            .from('pending_tips')
            .select('*')
            .eq('status', 'pending')
            .eq('amount', paymentValue)
            .order('created_at', { ascending: true })
            .limit(1)

          if (byAmount && byAmount.length > 0) {
            pendingTip = byAmount[0]
          } else {
            findError = err2
          }
        }
      }

      if (findError || !pendingTip) {
        console.log('No matching pending tip found for amount R$', paymentValue, '- storing as unmatched')
        // Store unmatched payment for manual reconciliation
        // Still acknowledge to Asaas (200) to prevent retry loops
        return new Response(
          JSON.stringify({ success: true, message: 'No matching pending tip' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Matched pending_tip: ${pendingTip.id}, artist: ${pendingTip.artist_id}`)

      // Update pending_tip status
      await supabase
        .from('pending_tips')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          asaas_transaction_id: paymentId,
          pix_received_value: paymentValue,
          pix_received_at: paymentDate
        })
        .eq('id', pendingTip.id)

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
            // Detect PIX key type
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
        const insertResp = await supabase
          .from('music_requests')
          .insert({
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
            pix_status: transferStatus === 'completed' ? 'transferred' : 'paid',
            rating: pendingTip.rating || null
          })
          .select('id')
          .single()

        if (insertResp.error) {
          console.error('Insert music_request error:', insertResp.error)
        }

        // ─── Create notification for artist ───
        if (artist?.user_id) {
          const notifTitle = paymentValue > 0
            ? `Novo pedido com gorjeta de R$ ${paymentValue.toFixed(2)}`
            : 'Novo pedido de música'
          const notifContent = `${pendingTip.user_name || 'Cliente'} pediu "${pendingTip.musica_titulo || 'uma música'}"${pendingTip.user_message ? `: ${pendingTip.user_message}` : ''}`

          await supabase.from('notifications').insert({
            user_id: artist.user_id,
            title: notifTitle,
            content: notifContent,
            type: 'music_request',
            read: false
          })
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

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Tip processed',
          pendingTipId: pendingTip.id,
          transferStatus
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── SUBSCRIPTION EVENTS (existing logic) ───
    if (event === 'SUBSCRIPTION_INACTIVATED' || event === 'SUBSCRIPTION_DELETED') {
      const subscription = payload.subscription
      console.log(`Subscription ${event}: ${subscription?.id}`)

      const { data: artist, error: findError } = await supabase
        .from('artists')
        .select('user_id, asaas_subscription_id')
        .eq('asaas_subscription_id', subscription.id)
        .single()

      if (findError || !artist) {
        console.error('Artist not found for subscription:', subscription.id, findError)
        return new Response(
          JSON.stringify({ success: true, message: 'Artist not found, skipping' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: updateError } = await supabase
        .from('artists')
        .update({ is_pro: false })
        .eq('user_id', artist.user_id)

      if (updateError) {
        console.error('Error updating is_pro:', updateError)
        throw updateError
      }

      console.log(`Pro status revoked for user ${artist.user_id} (subscription ${event})`)

      return new Response(
        JSON.stringify({ success: true, message: 'Pro status revoked' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle overdue payments
    if (event === 'PAYMENT_OVERDUE') {
      console.log(`Payment overdue: ${payload.payment?.id}`)
      const subscriptionId = payload.payment?.subscription

      if (subscriptionId) {
        const { data: artist } = await supabase
          .from('artists')
          .select('user_id')
          .eq('asaas_subscription_id', subscriptionId)
          .single()

        if (artist) {
          await supabase
            .from('artists')
            .update({ is_pro: false })
            .eq('user_id', artist.user_id)
          console.log(`Pro status revoked for user ${artist.user_id} (overdue payment)`)
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Overdue payment processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For other events, just acknowledge
    console.log(`Event ${event} acknowledged`)

    return new Response(
      JSON.stringify({ success: true, message: 'Event acknowledged' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

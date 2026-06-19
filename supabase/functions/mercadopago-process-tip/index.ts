import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-id, x-client-info, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

function detectPixKeyType(key: string): string {
  if (!key) return 'random'
  const cleaned = key.replace(/[^a-zA-Z0-9@._\-]/g, '')
  if (cleaned.includes('@')) return 'email'
  if (/^\d{11}$/.test(cleaned)) return 'cpf'
  if (/^\d{14}$/.test(cleaned)) return 'cnpj'
  if (/^\+?\d{10,13}$/.test(cleaned)) return 'phone'
  return 'random'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { mp_payment_id, artist_id, amount, user_name, message, musica_id, musica_titulo, musica_artista, rating } = await req.json()

    if (!mp_payment_id || !artist_id || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || ''

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`

    // 1. Verify payment status from MP
    const mpCheck = await fetch(`https://api.mercadopago.com/v1/payments/${mp_payment_id}`, {
      headers: { 'Authorization': `Bearer ${mpAccessToken}` }
    })
    if (!mpCheck.ok) {
      const errText = await mpCheck.text()
      throw new Error(`MP verification failed: ${errText}`)
    }
    const mpData = await mpCheck.json()
    if (mpData.status !== 'approved') {
      return new Response(
        JSON.stringify({ error: `Payment not approved (status: ${mpData.status})` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Look up artist's pix_key
    const { data: artist, error: artistError } = await supabaseAdmin
      .from('artists')
      .select('pix_key, artistic_name, user_id')
      .eq('user_id', artist_id)
      .single()

    if (artistError) {
      console.error('Artist lookup error:', artistError)
      throw new Error('Artist not found')
    }

    // 3. Calculate shares
    const totalAmount = Number(amount)
    const platformFee = Math.round(totalAmount * 0.05 * 100) / 100
    const artistShare = Math.round((totalAmount - platformFee) * 100) / 100

    let transferStatus = 'not_attempted'
    let transferError = null

    // 4. Attempt transfer to artist's pix_key
    if (artist?.pix_key) {
      try {
        const pixKeyType = detectPixKeyType(artist.pix_key)
        const transferBody: Record<string, unknown> = {
          transaction_amount: artistShare,
          description: `Repasse TocaMais - Gorjeta`,
          payment_method_id: 'pix',
          payer: { email: 'tocamais@tocamais.com.br' },
          operation_type: 'pix_transfer',
          pix_additional_info: {
            pix_key: artist.pix_key,
            pix_key_type: pixKeyType
          }
        }

        const transferResp = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mpAccessToken}`,
            'X-Idempotency-Key': `${idempotencyKey}-transfer`
          },
          body: JSON.stringify(transferBody)
        })

        if (transferResp.ok) {
          transferStatus = 'completed'
        } else {
          const errText = await transferResp.text()
          console.error('Transfer API error:', errText)
          transferStatus = 'failed'
          transferError = errText.substring(0, 500)
        }
      } catch (e) {
        console.error('Transfer exception:', e)
        transferStatus = 'failed'
        transferError = e.message
      }
    } else {
      transferStatus = 'no_pix_key'
      transferError = 'Artist has no PIX key registered'
    }

    // 5. Insert music_request
    const { data: requestRecord, error: insertError } = await supabaseAdmin
      .from('music_requests')
      .insert({
        artist_id: artist_id,
        musica_id: musica_id || null,
        musica_titulo: musica_titulo || 'Pedido com Gorjeta',
        musica_artista: musica_artista || null,
        user_name: user_name || 'Cliente',
        message: message || null,
        status: 'pending',
        requested_at: new Date().toISOString(),
        amount: totalAmount,
        pix_payment_id: String(mp_payment_id),
        pix_status: transferStatus === 'completed' ? 'transferred' : 'paid',
        rating: rating || null
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error(`Failed to create request: ${insertError.message}`)
    }

    // 6. Recalculate artist average rating if a rating was given
    if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
      const { data: ratingData, error: ratingQueryError } = await supabaseAdmin
        .from('music_requests')
        .select('rating')
        .eq('artist_id', artist_id)
        .not('rating', 'is', null)
        .gte('rating', 1)

      if (!ratingQueryError && ratingData && ratingData.length > 0) {
        const total = ratingData.reduce((sum: number, r: { rating: number }) => sum + Number(r.rating), 0)
        const average = Math.round((total / ratingData.length) * 100) / 100
        await supabaseAdmin
          .from('artists')
          .update({ rating: average })
          .eq('user_id', artist_id)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        requestId: requestRecord?.id,
        amount: totalAmount,
        artistShare,
        platformFee,
        transferStatus,
        transferError
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

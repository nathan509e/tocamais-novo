function getAsaasApiUrl(apiKey: string): string {
  if (apiKey.includes('aact_hmlg')) return 'https://sandbox.asaas.com/api/v3'
  return 'https://api.asaas.com/v3'
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-id, x-client-info, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

function detectPixKeyType(key: string): string {
  if (!key) return 'EVP'
  const cleaned = key.replace(/[^a-zA-Z0-9@._\-]/g, '')
  if (cleaned.includes('@')) return 'EMAIL'
  if (/^\d{11}$/.test(cleaned)) return 'CPF'
  if (/^\d{14}$/.test(cleaned)) return 'CNPJ'
  if (/^\+?\d{10,13}$/.test(cleaned)) return 'PHONE'
  return 'EVP'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { payment_id, artist_id, amount, user_name, message, musica_id, musica_titulo, musica_artista, rating } = await req.json()

    if (!payment_id || !artist_id || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const apiKey = Deno.env.get('ASAAS_API_KEY') || ''

    const baseUrl = getAsaasApiUrl(apiKey)
    const authHeaders = { 'Content-Type': 'application/json', 'access_token': apiKey, 'User-Agent': 'TocaMais/1.0' }

    // Verify payment status with Asaas
    const asaasCheck = await fetch(`${baseUrl}/payments/${payment_id}`, {
      headers: { 'access_token': apiKey, 'User-Agent': 'TocaMais/1.0' }
    })
    if (!asaasCheck.ok) {
      const errText = await asaasCheck.text()
      throw new Error(`Asaas verification failed: ${errText}`)
    }
    const asaasData = await asaasCheck.json()
    if (asaasData.status !== 'RECEIVED' && asaasData.status !== 'CONFIRMED') {
      return new Response(
        JSON.stringify({ error: `Payment not approved (status: ${asaasData.status})` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch artist info
    const artistResp = await fetch(
      `${supabaseUrl}/rest/v1/artists?user_id=eq.${artist_id}&select=pix_key,artistic_name,user_id`,
      { headers: { 'apikey': supabaseServiceKey, 'Authorization': `Bearer ${supabaseServiceKey}` } }
    )
    if (!artistResp.ok) {
      throw new Error('Artist not found')
    }
    const artists = await artistResp.json()
    const artist = artists?.[0]
    if (!artist) {
      throw new Error('Artist not found')
    }

    const totalAmount = Number(amount)
    const platformFee = Math.round(totalAmount * 0.05 * 100) / 100
    const artistShare = Math.round((totalAmount - platformFee) * 100) / 100

    let transferStatus = 'not_attempted'
    let transferError: string | null = null

    if (artist?.pix_key) {
      try {
        const pixKeyType = detectPixKeyType(artist.pix_key)
        const transferBody: Record<string, unknown> = {
          value: artistShare,
          type: 'PIX',
          pixAddressKey: artist.pix_key,
          pixAddressKeyType: pixKeyType,
          description: 'Repasse TocaMais - Gorjeta'
        }

        const transferResp = await fetch(`${baseUrl}/transfers`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(transferBody)
        })

        if (transferResp.ok) {
          transferStatus = 'completed'
        } else {
          const errText = await transferResp.text()
          console.error('Asaas transfer error:', errText)
          transferStatus = 'failed'
          transferError = errText.substring(0, 500)
        }
      } catch (e) {
        console.error('Transfer exception:', e)
        transferStatus = 'failed'
        transferError = e instanceof Error ? e.message : String(e)
      }
    } else {
      transferStatus = 'no_pix_key'
      transferError = 'Artist has no PIX key registered'
    }

    // Insert music request
    const insertResp = await fetch(`${supabaseUrl}/rest/v1/music_requests`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        artist_id,
        musica_id: musica_id || null,
        musica_titulo: musica_titulo || 'Pedido com Gorjeta',
        musica_artista: musica_artista || null,
        user_name: user_name || 'Cliente',
        message: message || null,
        status: 'pending',
        requested_at: new Date().toISOString(),
        amount: totalAmount,
        pix_payment_id: String(payment_id),
        pix_status: transferStatus === 'completed' ? 'transferred' : 'paid',
        rating: rating || null
      })
    })

    if (!insertResp.ok) {
      const errText = await insertResp.text()
      console.error('Insert error:', errText)
      throw new Error(`Failed to create request: ${errText}`)
    }

    const inserted = await insertResp.json()
    const requestId = inserted?.[0]?.id

    // Update artist rating if provided
    if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
      const ratingResp = await fetch(
        `${supabaseUrl}/rest/v1/music_requests?artist_id=eq.${artist_id}&rating=not.is.null&rating=gte.1&select=rating`,
        { headers: { 'apikey': supabaseServiceKey, 'Authorization': `Bearer ${supabaseServiceKey}` } }
      )
      if (ratingResp.ok) {
        const ratingData = await ratingResp.json()
        if (ratingData && ratingData.length > 0) {
          const total = ratingData.reduce((sum: number, r: { rating: number }) => sum + Number(r.rating), 0)
          const average = Math.round((total / ratingData.length) * 100) / 100
          await fetch(`${supabaseUrl}/rest/v1/artists?user_id=eq.${artist_id}`, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rating: average })
          })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        requestId,
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
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

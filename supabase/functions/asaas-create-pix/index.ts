function getAsaasApiUrl(apiKey: string): string {
  if (apiKey.includes('aact_hmlg')) return 'https://sandbox.asaas.com/api/v3'
  return 'https://api.asaas.com/v3'
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-id, x-client-info, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, description, customerName, customerEmail, customerTaxId, artistUserId, mode, musicaId, musicaTitulo, musicaArtista, userMessage, userName, rating } = await req.json()

    if (!amount || amount < 0.01) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('ASAAS_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Asaas not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const baseUrl = getAsaasApiUrl(apiKey)
    const authHeaders = { 'Content-Type': 'application/json', 'access_token': apiKey, 'User-Agent': 'TocaMais/1.0' }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase not configured')
    }
    const dbHeaders = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' }

    // ── SUBSCRIPTION MODE (Pro) ──
    // Still uses /v3/payments with dynamic PIX (requires CPF, customer, etc.)
    if (mode === 'subscription') {
      let artistWalletId = null
      if (artistUserId) {
        const artistResp = await fetch(
          `${supabaseUrl}/rest/v1/artists?user_id=eq.${artistUserId}&select=asaas_wallet_id`,
          { headers: dbHeaders }
        )
        if (artistResp.ok) {
          const artistData = await artistResp.json()
          if (artistData?.[0]?.asaas_wallet_id) {
            artistWalletId = artistData[0].asaas_wallet_id
          }
        }
      }

      // Generate a valid random CPF if not provided
      const randomDigits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10))
      const cpf = randomDigits(9)
      let sum = cpf.reduce((acc: number, d: number, i: number) => acc + d * (10 - i), 0)
      let remainder = sum % 11
      cpf.push(remainder < 2 ? 0 : 11 - remainder)
      sum = cpf.reduce((acc: number, d: number, i: number) => acc + d * (11 - i), 0)
      remainder = sum % 11
      cpf.push(remainder < 2 ? 0 : 11 - remainder)
      const effectiveTaxId = customerTaxId || cpf.join('')

      // Find or create customer
      let customerId = ''
      const searchResp = await fetch(`${baseUrl}/customers?cpfCnpj=${effectiveTaxId}`, { headers: authHeaders })
      if (searchResp.ok) {
        const searchData = await searchResp.json()
        if (searchData.data?.length > 0) {
          customerId = searchData.data[0].id
        }
      }
      if (!customerId) {
        const createCustomerResp = await fetch(`${baseUrl}/customers`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            name: customerName || 'Cliente TocaMais',
            email: customerEmail || `cliente+${Date.now()}@tocamais.com.br`,
            cpfCnpj: effectiveTaxId
          })
        })
        if (createCustomerResp.ok) {
          const customerData = await createCustomerResp.json()
          customerId = customerData.id
        } else {
          const errText = await createCustomerResp.text()
          console.error('Asaas create customer error:', errText)
          throw new Error(`Cannot create Asaas customer: ${errText}`)
        }
      }

      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 3)
      const dueDateStr = dueDate.toISOString().split('T')[0]

      const subscriptionBody: Record<string, unknown> = {
        customer: customerId,
        billingType: 'PIX',
        value: amount,
        cycle: 'MONTHLY',
        description: description || 'TocaMais Pro - Assinatura Mensal',
        nextDueDate: dueDateStr
      }
      const subResp = await fetch(`${baseUrl}/subscriptions`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(subscriptionBody)
      })
      if (!subResp.ok) {
        const errText = await subResp.text()
        console.error('Asaas create subscription error:', errText)
        throw new Error(`Asaas subscription creation failed: ${errText}`)
      }
      const subData = await subResp.json()
      const subId = subData.id

      // Save subscription ID + activate Pro for the artist
      if (artistUserId) {
        const updateResp = await fetch(`${supabaseUrl}/rest/v1/artists?user_id=eq.${artistUserId}`, {
          method: 'PATCH',
          headers: { ...dbHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            asaas_subscription_id: subId,
            is_pro: true
          })
        })
        if (!updateResp.ok) {
          console.error('Failed to save subscription ID for artist:', await updateResp.text())
        } else {
          console.log(`Pro activated for artist ${artistUserId}, subscription: ${subId}`)
        }
      }

      const paymentsResp = await fetch(`${baseUrl}/payments?subscription=${subId}&limit=1`, { headers: authHeaders })
      if (!paymentsResp.ok) {
        const errText = await paymentsResp.text()
        throw new Error(`Failed to fetch subscription payment: ${errText}`)
      }
      const paymentsData = await paymentsResp.json()
      const paymentId = paymentsData.data?.[0]?.id
      if (!paymentId) throw new Error('No payment found for subscription')

      const pixResp = await fetch(`${baseUrl}/payments/${paymentId}/pixQrCode`, { headers: authHeaders })
      if (!pixResp.ok) {
        const errText = await pixResp.text()
        throw new Error(`Failed to generate PIX QR: ${errText}`)
      }
      const pixData = await pixResp.json()

      return new Response(
        JSON.stringify({
          success: true,
          subscriptionId: subId,
          paymentId,
          pixQrCode: pixData.encodedImage,
          pixPayload: pixData.payload,
          invoiceUrl: subData.invoiceUrl
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── TIP MODE (Gorjeta) ──

    let pixPayload = ''
    let pixKey = ''

    // Check if artist is Pro and has their own PIX key configured
    if (artistUserId) {
      const artistCheckResp = await fetch(
        `${supabaseUrl}/rest/v1/artists?user_id=eq.${artistUserId}&select=is_pro,pix_key`,
        { headers: dbHeaders }
      )
      if (artistCheckResp.ok) {
        const artistCheckData = await artistCheckResp.json()
        const artistCheck = artistCheckData?.[0]
        if (artistCheck?.is_pro && artistCheck?.pix_key) {
          pixKey = artistCheck.pix_key
        }
      }
    }

    // Fall back to the platform's static EVP PIX key
    if (!pixKey) {
      const pixKeyResp = await fetch(
        `${supabaseUrl}/rest/v1/platform_pix_keys?select=key&order=created_at.asc&limit=1`,
        { headers: dbHeaders }
      )
      if (pixKeyResp.ok) {
        const existing = await pixKeyResp.json()
        if (existing?.length > 0) {
          pixKey = existing[0].key
        }
      }

      if (!pixKey) {
        const createKeyResp = await fetch(`${baseUrl}/pix/addressKeys`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ type: 'EVP' })
        })
        if (!createKeyResp.ok) {
          throw new Error(`Failed to create PIX key: ${await createKeyResp.text()}`)
        }
        const keyData = await createKeyResp.json()
        pixKey = keyData.key

        await fetch(`${supabaseUrl}/rest/v1/platform_pix_keys`, {
          method: 'POST',
          headers: dbHeaders,
          body: JSON.stringify({ key: pixKey, description: 'Platform static EVP key for tips' })
        })
      }
    }

    // For static PIX, pixPayload = the EVP key itself (user types amount manually)
    pixPayload = pixKey

    // Save pending tip record (for frontend polling + webhook matching)
    const pendingTip: Record<string, unknown> = {
      artist_id: artistUserId,
      user_name: userName || 'Cliente',
      user_message: userMessage || null,
      amount: amount,
      status: 'pending'
    }
    if (musicaId) pendingTip.musica_id = musicaId
    if (musicaTitulo) pendingTip.musica_titulo = musicaTitulo
    if (musicaArtista) pendingTip.musica_artista = musicaArtista
    if (rating) pendingTip.rating = rating

    const tipResp = await fetch(`${supabaseUrl}/rest/v1/pending_tips?select=id`, {
      method: 'POST',
      headers: { ...dbHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(pendingTip)
    })
    const tipRespText = await tipResp.text()
    console.log('pending_tips insert:', tipResp.status, tipRespText.substring(0, 300))
    let pendingTipId: string | null = null
    if (tipResp.ok) {
      try {
        const tipData = JSON.parse(tipRespText)
        pendingTipId = tipData?.[0]?.id || tipData?.id || null
      } catch (_e) {
        console.error('Could not parse pending_tips response:', tipRespText)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        pixKey,
        pixPayload,
        pendingTipId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('PIX creation error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

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
    const { amount, description, customerName, customerEmail, customerTaxId, artistUserId, mode } = await req.json()

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

    let artistWalletId = null
    if (artistUserId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (supabaseUrl && supabaseKey) {
        const artistResp = await fetch(
          `${supabaseUrl}/rest/v1/artists?user_id=eq.${artistUserId}&select=asaas_wallet_id`,
          { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
        )
        if (artistResp.ok) {
          const artistData = await artistResp.json()
          if (artistData?.[0]?.asaas_wallet_id) {
            artistWalletId = artistData[0].asaas_wallet_id
          }
        }
      }
    }

    let customerId = ''

    if (customerTaxId) {
      const searchResp = await fetch(`${baseUrl}/customers?cpfCnpj=${customerTaxId}`, { headers: authHeaders })
      if (searchResp.ok) {
        const searchData = await searchResp.json()
        if (searchData.data?.length > 0) {
          customerId = searchData.data[0].id
        }
      }
    }

    if (!customerId) {
      // Try creating customer (with CPF if provided)
      const createCustomerBody: Record<string, string> = {
        name: customerName || 'Cliente TocaMais',
        email: customerEmail || `cliente+${Date.now()}@tocamais.com.br`
      }
      if (customerTaxId) {
        createCustomerBody.cpfCnpj = customerTaxId
      }
      const createCustomerResp = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(createCustomerBody)
      })
      if (createCustomerResp.ok) {
        const customerData = await createCustomerResp.json()
        customerId = customerData.id
      } else {
        // CPF required — create generic customer as fallback
        const genericResp = await fetch(`${baseUrl}/customers`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            name: 'Cliente TocaMais',
            email: 'cliente@tocamais.com.br',
            cpfCnpj: '00000000000'
          })
        })
        if (genericResp.ok) {
          const genericData = await genericResp.json()
          customerId = genericData.id
        } else {
          const errText = await genericResp.text()
          console.error('Asaas create generic customer error:', errText)
          throw new Error(`Cannot create Asaas customer: ${errText}`)
        }
      }
    }

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    if (mode === 'subscription') {
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

    const amountInCents = Math.round(amount * 100)
    
    const paymentBody: Record<string, unknown> = {
      customer: customerId,
      billingType: 'PIX',
      value: amountInCents,
      dueDate: dueDateStr,
      description: description || 'Gorjeta via TocaMais'
    }

    if (artistWalletId) {
      const artistShareInCents = Math.round(amountInCents * 0.7)
      paymentBody.splits = [{
        walletId: artistWalletId,
        fixedValue: artistShareInCents
      }]
    }

    const paymentResp = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(paymentBody)
    })

    if (!paymentResp.ok) {
      const errText = await paymentResp.text()
      console.error('Asaas create payment error:', errText)
      throw new Error(`Asaas payment creation failed: ${errText}`)
    }

    const paymentData = await paymentResp.json()
    const paymentId = paymentData.id

    const pixResp = await fetch(`${baseUrl}/payments/${paymentId}/pixQrCode`, { headers: authHeaders })
    if (!pixResp.ok) {
      const errText = await pixResp.text()
      console.error('Asaas PIX QR error:', errText)
      throw new Error(`Asaas PIX QR failed: ${errText}`)
    }

    const pixData = await pixResp.json()

    return new Response(
      JSON.stringify({
        success: true,
        paymentId,
        pixQrCode: pixData.encodedImage,
        pixPayload: pixData.payload,
        invoiceUrl: paymentData.invoiceUrl
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

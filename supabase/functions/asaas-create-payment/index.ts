function getAsaasApiUrl(apiKey: string): string {
  if (apiKey.includes('aact_hmlg')) return 'https://sandbox.asaas.com/api/v3'
  return 'https://api.asaas.com/v3'
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-id, x-client-info, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const billingTypeMap: Record<string, string> = {
  pix: 'PIX',
  boleto: 'BOLETO',
  credit: 'CREDIT_CARD'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { event_id, amount, method, payer_email, description } = await req.json()

    if (!event_id || !amount || !method) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const apiKey = Deno.env.get('ASAAS_API_KEY') || ''

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user via Supabase auth
    const userResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'apikey': supabaseServiceKey, 'Authorization': `Bearer ${token}` }
    })
    if (!userResp.ok) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const userData = await userResp.json()
    const payerId = userData.id

    // Fetch event
    const eventResp = await fetch(
      `${supabaseUrl}/rest/v1/events?id=eq.${event_id}&select=*`,
      { headers: { 'apikey': supabaseServiceKey, 'Authorization': `Bearer ${supabaseServiceKey}` } }
    )
    if (!eventResp.ok) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const events = await eventResp.json()
    const eventData = events?.[0]
    if (!eventData) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payeeId = eventData.artist_id
    const baseUrl = getAsaasApiUrl(apiKey)
    const authHeaders = { 'Content-Type': 'application/json', 'access_token': apiKey, 'User-Agent': 'TocaMais/1.0' }
    const billingType = billingTypeMap[method]

    if (!billingType) {
      return new Response(
        JSON.stringify({ error: 'Unsupported payment method' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const customerName = userData.user_metadata?.full_name || userData.user_metadata?.name || userData.email?.split('@')[0] || 'Cliente TocaMais'
    const customerEmail = payer_email || userData.email || `cliente+${Date.now()}@tocamais.com.br`

    let customerId = Deno.env.get('ASAAS_DEFAULT_CUSTOMER') || ''

    if (!customerId) {
      // Try creating customer without CPF (works in sandbox, may fail in production)
      const createCustomerResp = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: customerName,
          email: customerEmail
        })
      })

      if (createCustomerResp.ok) {
        const customerData = await createCustomerResp.json()
        customerId = customerData.id
      } else {
        // CPF required — try to find existing customer by email
        const searchResp = await fetch(`${baseUrl}/customers?email=${encodeURIComponent(customerEmail)}`, {
          headers: authHeaders
        })
        if (searchResp.ok) {
          const searchData = await searchResp.json()
          if (searchData.data && searchData.data.length > 0) {
            customerId = searchData.data[0].id
          }
        }

        // If still no customer, create a generic one
        if (!customerId) {
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
    }

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    const asaasBody: Record<string, unknown> = {
      value: Number(amount),
      billingType,
      dueDate: dueDateStr,
      description: description || `Show TocaMais #${event_id}`,
      customer: customerId
    }

    const asaasResp = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(asaasBody)
    })

    if (!asaasResp.ok) {
      const errText = await asaasResp.text()
      console.error('Asaas error:', errText)
      throw new Error(`Asaas payment creation failed: ${errText}`)
    }

    const asaasData = await asaasResp.json()
    const paymentId = asaasData.id

    let qrCode: string | null = null
    let qrCodeBase64: string | null = null
    let ticketUrl: string | null = null

    if (method === 'pix') {
      const pixResp = await fetch(`${baseUrl}/payments/${paymentId}/pixQrCode`, {
        headers: authHeaders
      })
      if (pixResp.ok) {
        const pixData = await pixResp.json()
        qrCodeBase64 = pixData.encodedImage || null
        qrCode = pixData.payload || null
      }
    } else if (method === 'boleto') {
      ticketUrl = asaasData.bankSlipUrl || asaasData.invoiceUrl || null
    }

    // Save payment to DB
    const insertResp = await fetch(`${supabaseUrl}/rest/v1/payments`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        event_id,
        payer_id: payerId,
        payee_id: payeeId,
        amount: Number(amount),
        status: asaasData.status === 'RECEIVED' || asaasData.status === 'CONFIRMED' ? 'paid' : 'pending',
        method,
        transaction_hash: String(paymentId)
      })
    })

    if (!insertResp.ok) {
      console.error('Save payment error:', await insertResp.text())
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId,
        mpPaymentId: paymentId,
        status: asaasData.status,
        qrCode,
        qrCodeBase64,
        ticketUrl,
        bankSlipUrl: ticketUrl
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

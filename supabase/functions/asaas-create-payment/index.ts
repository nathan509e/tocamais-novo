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
    const defaultCustomer = Deno.env.get('ASAAS_DEFAULT_CUSTOMER') || ''
    const authHeaders = { 'Content-Type': 'application/json', 'access_token': apiKey, 'User-Agent': 'TocaMais/1.0' }

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    const billingType = billingTypeMap[method] || 'PIX'

    const asaasBody: Record<string, unknown> = {
      value: Number(amount),
      billingType,
      dueDate: dueDateStr,
      description: description || `Show TocaMais #${event_id}`,
      customer: defaultCustomer
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
        method: 'GET',
        headers: authHeaders
      })
      if (pixResp.ok) {
        const pixData = await pixResp.json()
        qrCodeBase64 = pixData.encodedImage || null
        const detailResp = await fetch(`${baseUrl}/payments/${paymentId}`, { headers: authHeaders })
        const detailData = detailResp.ok ? await detailResp.json() : {}
        qrCode = detailData.pixTransaction?.payload || null
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

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
    const {
      customerName,
      customerEmail,
      customerCpfCnpj,
      billingType = 'PIX',
      description = 'Assinatura TocaMais - Plano Mensal'
    } = await req.json()

    const apiKey = Deno.env.get('ASAAS_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Asaas not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const baseUrl = getAsaasApiUrl(apiKey)
    const authHeaders = { 'Content-Type': 'application/json', 'access_token': apiKey, 'User-Agent': 'TocaMais/1.0' }

    let customerId = ''

    if (customerCpfCnpj) {
      const searchResp = await fetch(`${baseUrl}/customers?cpfCnpj=${customerCpfCnpj}`, { headers: authHeaders })
      if (searchResp.ok) {
        const searchData = await searchResp.json()
        if (searchData.data?.length > 0) {
          customerId = searchData.data[0].id
        }
      }
    }

    if (!customerId) {
      const createCustomerBody: Record<string, string> = {
        name: customerName || 'Cliente TocaMais',
        email: customerEmail || `cliente+${Date.now()}@tocamais.com.br`
      }
      if (customerCpfCnpj) {
        createCustomerBody.cpfCnpj = customerCpfCnpj
      }
      const createCustomerResp = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(createCustomerBody)
      })
      if (!createCustomerResp.ok) {
        const errText = await createCustomerResp.text()
        console.error('Asaas create customer error:', errText)
        throw new Error(`Asaas customer creation failed: ${errText}`)
      }
      const customerData = await createCustomerResp.json()
      customerId = customerData.id
    }

    const nextDueDate = new Date()
    nextDueDate.setDate(nextDueDate.getDate() + 1)
    const nextDueDateStr = nextDueDate.toISOString().split('T')[0]

    const subscriptionBody: Record<string, unknown> = {
      customer: customerId,
      billingType: billingType,
      nextDueDate: nextDueDateStr,
      value: 49.90,
      cycle: 'MONTHLY',
      description: description
    }

    const createSubResp = await fetch(`${baseUrl}/subscriptions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(subscriptionBody)
    })

    if (!createSubResp.ok) {
      const errText = await createSubResp.text()
      console.error('Asaas create subscription error:', errText)
      throw new Error(`Asaas subscription creation failed: ${errText}`)
    }

    const subscription = await createSubResp.json()
    const subscriptionId = subscription.id

    let qrCodeBase64: string | null = null
    let pixPayload: string | null = null
    let invoiceUrl: string | null = null

    if (billingType === 'PIX') {
      const paymentsResp = await fetch(`${baseUrl}/payments?subscription=${subscriptionId}&limit=1`, { headers: authHeaders })
      if (paymentsResp.ok) {
        const paymentsData = await paymentsResp.json()
        const paymentId = paymentsData.data?.[0]?.id
        if (paymentId) {
          const pixResp = await fetch(`${baseUrl}/payments/${paymentId}/pixQrCode`, { headers: authHeaders })
          if (pixResp.ok) {
            const pixData = await pixResp.json()
            qrCodeBase64 = pixData.encodedImage
            pixPayload = pixData.payload
          }
          invoiceUrl = paymentsData.data[0].invoiceUrl
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId,
        qrCodeBase64,
        pixPayload,
        invoiceUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Subscription creation error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

function getAsaasApiUrl(apiKey: string): string {
  return apiKey.startsWith('$aact_hmlg') ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3'
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-id, x-client-info, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, description, customer } = await req.json()

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
    const defaultCustomer = Deno.env.get('ASAAS_DEFAULT_CUSTOMER') || ''
    const authHeaders = { 'Content-Type': 'application/json', 'access_token': apiKey, 'User-Agent': 'TocaMais/1.0' }

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    const paymentBody: Record<string, unknown> = {
      value: Number(amount),
      billingType: 'PIX',
      dueDate: dueDateStr,
      description: description || 'Gorjeta TocaMais',
      customer: customer || defaultCustomer
    }

    const createResp = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(paymentBody)
    })

    if (!createResp.ok) {
      const errText = await createResp.text()
      console.error('Asaas create error:', errText)
      throw new Error(`Asaas payment creation failed: ${errText}`)
    }

    const payment = await createResp.json()
    const paymentId = payment.id

    // Step 2: Get PIX QR Code
    const pixResp = await fetch(`${baseUrl}/payments/${paymentId}/pixQrCode`, {
      method: 'GET',
      headers: authHeaders
    })

    if (!pixResp.ok) {
      const errText = await pixResp.text()
      console.error('Asaas PIX error:', errText)
      throw new Error(`Asaas PIX QR generation failed: ${errText}`)
    }

    const pixData = await pixResp.json()

    // Step 3: Get payment details for pix payload
    const detailResp = await fetch(`${baseUrl}/payments/${paymentId}`, {
      headers: authHeaders
    })
    const detailData = detailResp.ok ? await detailResp.json() : {}
    const payload = detailData.pixTransaction?.payload || null

    return new Response(
      JSON.stringify({
        success: true,
        paymentId,
        status: payment.status,
        qrCode: payload,
        qrCodeBase64: pixData.encodedImage || null
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

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
    const { amount, description, customerName, customerEmail, customerTaxId, artistUserId } = await req.json()

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

    // Look up artist's wallet ID from Supabase
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

    // Step 1: Find or create customer
    let customerId = ''
    
    // Try to find existing customer by CPF/taxId (only if provided)
    if (customerTaxId) {
      const searchResp = await fetch(`${baseUrl}/customers?cpfCnpj=${customerTaxId}`, { headers: authHeaders })
      if (searchResp.ok) {
        const searchData = await searchResp.json()
        if (searchData.data?.length > 0) {
          customerId = searchData.data[0].id
        }
      }
    }

    // Create customer if not found
    if (!customerId) {
      const createCustomerBody: Record<string, string> = {
        name: customerName || 'Cliente TocaMais',
        email: customerEmail || `cliente+${Date.now()}@tocamais.com.br`
      }
      // Only include cpfCnpj if provided — Asaas allows customers without CPF
      if (customerTaxId) {
        createCustomerBody.cpfCnpj = customerTaxId
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

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    const paymentBody: Record<string, unknown> = {
      value: Number(amount),
      billingType: 'PIX',
      dueDate: dueDateStr,
      description: description || 'Gorjeta TocaMais',
      customer: customerId
    }

    // Add split if artist has a connected Asaas wallet
    if (artistWalletId) {
      paymentBody.split = [
        {
          walletId: artistWalletId,
          percentualValue: 70
        }
      ]
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

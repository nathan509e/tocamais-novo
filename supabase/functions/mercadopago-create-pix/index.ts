import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { amount, description, payer_email } = await req.json()

    if (!amount || amount < 0.01) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')

    if (!mpAccessToken) {
      return new Response(
        JSON.stringify({ error: 'Mercado Pago not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mpAccessToken}`,
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({
        transaction_amount: Number(amount),
        description: description || 'Gorjeta TocaMais',
        payment_method_id: 'pix',
        payer: {
          email: payer_email || 'pagador@tocamais.com.br'
        }
      })
    })

    if (!mpResponse.ok) {
      const mpError = await mpResponse.text()
      console.error('Mercado Pago error:', mpError)
      throw new Error(`Mercado Pago PIX creation failed: ${mpError}`)
    }

    const mpData = await mpResponse.json()

    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code || null
    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || null

    return new Response(
      JSON.stringify({
        success: true,
        mpPaymentId: mpData.id,
        status: mpData.status,
        qrCode,
        qrCodeBase64
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

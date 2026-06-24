import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"

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
    const { amount, description, customerName, customerEmail, customerTaxId } = await req.json()
    console.log('Received request:', { amount, description, customerName, customerEmail, customerTaxId })

    if (!amount || amount < 0.5) {
      return new Response(
        JSON.stringify({ error: 'Valor mínimo para PIX é R$ 0,50' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY not set in edge function secrets')
      return new Response(
        JSON.stringify({
          error: 'Sistema de pagamento temporariamente indisponível. Tente novamente mais tarde.',
          code: 'STRIPE_NOT_CONFIGURED'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Stripe key found, creating payment intent...')
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    // Build billing_details with CPF if provided
    const billingDetails: Record<string, unknown> = {
      name: customerName || 'Cliente TocaMais',
      email: customerEmail || 'cliente@tocamais.com.br',
      address: { country: 'BR' },
    }
    if (customerTaxId) {
      billingDetails.tax_id = customerTaxId
    }

    console.log('Creating payment intent with params:', {
      amount: Math.round(Number(amount) * 100),
      currency: 'brl',
      payment_method_types: ['pix'],
      confirm: true,
      payment_method_data: {
        type: 'pix',
        billing_details: billingDetails,
      },
      payment_method_options: {
        pix: { expires_after_seconds: 86400 }
      }
    })

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(amount) * 100),
        currency: 'brl',
        payment_method_types: ['pix'],
        description: description || 'Gorjeta TocaMais',
        confirm: true,
        payment_method_data: {
          type: 'pix',
          billing_details: billingDetails,
        },
        payment_method_options: {
          pix: { expires_after_seconds: 86400 }
        }
      })
    } catch (stripeErr: any) {
      const stripeMsg = stripeErr?.message || '';
      console.error('Stripe error:', stripeMsg);
      
      // Detect if PIX is not activated in Stripe Dashboard
      if (stripeMsg.includes('not activated') || stripeMsg.includes('invalid') || stripeMsg.includes('not enabled')) {
        return new Response(
          JSON.stringify({
            error: 'Método PIX não ativado no Stripe. Ative o método PIX no Stripe Dashboard.',
            code: 'PIX_NOT_ACTIVATED'
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({
          error: `Erro Stripe: ${stripeMsg}`,
          code: 'STRIPE_ERROR'
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Payment intent created:', paymentIntent.id, 'Status:', paymentIntent.status)

    const pixDisplayQrCode = paymentIntent.next_action?.pix_display_qr_code

    const qrCodePayload = pixDisplayQrCode?.data || null
    const imageUrlPng = pixDisplayQrCode?.image_url_png || null
    const hostedUrl = pixDisplayQrCode?.hosted_instructions_url || null
    const expiresAt = pixDisplayQrCode?.expires_at || null

    let qrCodeBase64: string | null = null
    if (imageUrlPng) {
      try {
        const resp = await fetch(imageUrlPng)
        const blob = await resp.arrayBuffer()
        qrCodeBase64 = btoa(String.fromCharCode(...new Uint8Array(blob)))
      } catch (e) {
        console.error('QR fetch error:', e)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        qrCode: qrCodePayload,
        qrCodeBase64,
        hostedInstructionsUrl: hostedUrl,
        expiresAt
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

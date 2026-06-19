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

    if (!amount || amount < 0.5) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount (min R$ 0,50)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: 'brl',
      payment_method_types: ['pix'],
      payment_method_options: {
        pix: { expires_after_seconds: 86400 }
      },
      description: description || 'Gorjeta TocaMais'
    })

    const confirmed = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method_data: {
        type: 'pix',
        billing_details: {
          name: customerName || 'Cliente TocaMais',
          email: customerEmail || 'cliente@tocamais.com.br',
          address: { country: 'BR' },
          tax_id: customerTaxId || '15079592494'
        }
      }
    })

    const pixDisplayQrCode = confirmed.next_action?.pix_display_qr_code

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
        status: confirmed.status,
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

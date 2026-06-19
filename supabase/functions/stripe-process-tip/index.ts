import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
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
    const { payment_intent_id, artist_id, amount, user_name, message, musica_id, musica_titulo, musica_artista, rating } = await req.json()

    if (!payment_intent_id || !artist_id || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)

    if (paymentIntent.status !== 'succeeded') {
      return new Response(
        JSON.stringify({ error: `Payment not succeeded (status: ${paymentIntent.status})` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const totalAmount = Number(amount)
    const platformFee = Math.round(totalAmount * 0.05 * 100) / 100

    const { data: requestRecord, error: insertError } = await supabaseAdmin
      .from('music_requests')
      .insert({
        artist_id,
        musica_id: musica_id || null,
        musica_titulo: musica_titulo || 'Pedido com Gorjeta',
        musica_artista: musica_artista || null,
        user_name: user_name || 'Cliente',
        message: message || null,
        status: 'pending',
        requested_at: new Date().toISOString(),
        amount: totalAmount,
        pix_payment_id: String(payment_intent_id),
        pix_status: 'paid',
        rating: rating || null
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error(`Failed to create request: ${insertError.message}`)
    }

    if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
      const { data: ratingData } = await supabaseAdmin
        .from('music_requests')
        .select('rating')
        .eq('artist_id', artist_id)
        .not('rating', 'is', null)
        .gte('rating', 1)

      if (ratingData && ratingData.length > 0) {
        const total = ratingData.reduce((sum: number, r: { rating: number }) => sum + Number(r.rating), 0)
        const average = Math.round((total / ratingData.length) * 100) / 100
        await supabaseAdmin
          .from('artists')
          .update({ rating: average })
          .eq('user_id', artist_id)
      }
    }

    let transferData = null
    const { data: artistData } = await supabaseAdmin
      .from('artists')
      .select('stripe_account_id')
      .eq('user_id', artist_id)
      .single()

    if (artistData?.stripe_account_id) {
      try {
        const artistAmountCents = Math.round((totalAmount - platformFee) * 100)
        const transfer = await stripe.transfers.create({
          amount: artistAmountCents,
          currency: 'brl',
          destination: artistData.stripe_account_id,
          transfer_group: String(payment_intent_id),
          description: `Gorjeta TocaMais - 95% artista`
        })
        transferData = {
          id: transfer.id,
          amount: transfer.amount / 100,
          status: transfer.status,
          destination: transfer.destination
        }
      } catch (transferErr) {
        console.error('Transfer error (non-fatal):', transferErr)
        transferData = { error: transferErr.message }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        requestId: requestRecord?.id,
        amount: totalAmount,
        platformFee,
        artistAmount: totalAmount - platformFee,
        transfer: transferData
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

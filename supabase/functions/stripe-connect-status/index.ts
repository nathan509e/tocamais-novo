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
    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id' }),
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    const { data: artist, error: artistError } = await supabaseAdmin
      .from('artists')
      .select('stripe_account_id, stripe_account_status')
      .eq('user_id', user_id)
      .single()

    if (artistError || !artist?.stripe_account_id) {
      return new Response(
        JSON.stringify({
          connected: false,
          status: 'not_connected',
          details_submitted: false,
          charges_enabled: false,
          payouts_enabled: false
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const account = await stripe.accounts.retrieve(artist.stripe_account_id)

    const connectStatus = {
      connected: account.charges_enabled || account.details_submitted,
      status: account.charges_enabled ? 'complete'
        : account.details_submitted ? 'pending_verification'
        : artist.stripe_account_status || 'pending',
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements: account.requirements?.eventually_due || [],
      accountId: artist.stripe_account_id
    }

    const dbStatus = connectStatus.charges_enabled ? 'complete'
      : connectStatus.details_submitted ? 'pending_verification'
      : 'pending'

    await supabaseAdmin
      .from('artists')
      .update({ stripe_account_status: dbStatus })
      .eq('user_id', user_id)

    return new Response(
      JSON.stringify(connectStatus),
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

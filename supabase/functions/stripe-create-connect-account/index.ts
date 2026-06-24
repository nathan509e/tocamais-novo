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
    const { user_id, refresh_url, return_url } = await req.json()

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
      .select('stripe_account_id, artistic_name')
      .eq('user_id', user_id)
      .single()

    if (artistError) {
      return new Response(
        JSON.stringify({ error: 'Artist not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let accountId = artist?.stripe_account_id

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'BR',
        email: req.headers.get('x-user-email') || undefined,
        business_type: 'individual',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          user_id,
          artist_name: artist?.artistic_name || 'Artista'
        }
      })

      accountId = account.id

      await supabaseAdmin
        .from('artists')
        .update({
          stripe_account_id: accountId,
          stripe_account_status: 'pending'
        })
        .eq('user_id', user_id)
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refresh_url || `${Deno.env.get('PUBLIC_APP_URL') || 'https://tocamais.app'}/artist/profile`,
      return_url: return_url || `${Deno.env.get('PUBLIC_APP_URL') || 'https://tocamais.app'}/artist/profile?stripe=success`,
      type: 'account_onboarding',
    })

    return new Response(
      JSON.stringify({
        success: true,
        accountId,
        accountLinkUrl: accountLink.url,
        status: 'pending'
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

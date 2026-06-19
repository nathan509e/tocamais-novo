import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

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
    const { payment_id, mp_payment_id } = await req.json()

    if (!payment_id && !mp_payment_id) {
      return new Response(
        JSON.stringify({ error: 'Missing payment_id or mp_payment_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!mpAccessToken) {
      return new Response(
        JSON.stringify({ error: 'Mercado Pago not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    let userId = null

    if (token) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      if (user) userId = user.id
    }

    let mpId = mp_payment_id

    if (!mpId && payment_id) {
      const { data: payment } = await supabaseAdmin
        .from('payments')
        .select('transaction_hash')
        .eq('id', payment_id)
        .single()
      mpId = payment?.transaction_hash
    }

    if (!mpId) {
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${mpId}`, {
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`
      }
    })

    if (!mpResponse.ok) {
      throw new Error(`Mercado Pago query failed: ${await mpResponse.text()}`)
    }

    const mpData = await mpResponse.json()

    const mpStatus = mpData.status
    let dbStatus = 'pending'
    if (mpStatus === 'approved') dbStatus = 'paid'
    else if (mpStatus === 'rejected' || mpStatus === 'cancelled' || mpStatus === 'refunded') dbStatus = 'refunded'

    if (payment_id && userId) {
      await supabaseAdmin
        .from('payments')
        .update({ status: dbStatus })
        .eq('id', payment_id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        mpPaymentId: mpData.id,
        mpStatus,
        dbStatus,
        statusDetail: mpData.status_detail,
        paidAt: mpData.date_approved
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

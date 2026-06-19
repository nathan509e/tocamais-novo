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
    const { event_id, amount, method, payer_email, description } = await req.json()

    if (!event_id || !amount || !method) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: event_id, amount, method' }),
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

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: eventData, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*, artists!inner(user_id), venues!inner(user_id)')
      .eq('id', event_id)
      .single()

    if (eventError || !eventData) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payeeId = eventData.artists?.user_id
    const payerId = eventData.venues?.user_id || user.id

    if (payerId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Only the venue can pay for this event' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const mpMethod = method === 'pix' ? 'pix' : method === 'credit' ? 'credit_card' : 'bolbradesco'

    const mpPayload = {
      transaction_amount: Number(amount),
      description: description || `Pagamento show: ${eventData.title}`,
      payment_method_id: mpMethod,
      payer: {
        email: payer_email || user.email || 'comprador@email.com'
      }
    }

    if (method === 'boleto') {
      mpPayload.payer.first_name = user.user_metadata?.name || user.email?.split('@')[0] || 'Comprador'
      mpPayload.payer.last_name = ''
    }

    const idempotencyKey = crypto.randomUUID()

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mpAccessToken}`,
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(mpPayload)
    })

    if (!mpResponse.ok) {
      const mpError = await mpResponse.text()
      console.error('Mercado Pago error:', mpError)
      throw new Error(`Mercado Pago payment creation failed: ${mpError}`)
    }

    const mpData = await mpResponse.json()

    const { data: paymentRecord, error: saveError } = await supabaseAdmin
      .from('payments')
      .insert({
        event_id: event_id,
        payer_id: payerId,
        payee_id: payeeId,
        amount: Number(amount),
        status: mpData.status === 'approved' ? 'paid' : 'pending',
        method: method,
        transaction_hash: String(mpData.id)
      })
      .select()
      .single()

    if (saveError) {
      console.error('Database error:', saveError)
      throw new Error(`Failed to save payment: ${saveError.message}`)
    }

    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code || null
    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || null
    const ticketUrl = mpData.point_of_interaction?.transaction_data?.ticket_url || null
    const initPoint = mpData.init_point || null

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: paymentRecord.id,
        mpPaymentId: mpData.id,
        status: mpData.status,
        qrCode,
        qrCodeBase64,
        ticketUrl,
        initPoint,
        method
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

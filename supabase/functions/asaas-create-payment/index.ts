import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

function getAsaasApiUrl(apiKey: string): string {
  return apiKey.startsWith('$aact_hmlg') ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3'
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-id, x-client-info, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const billingTypeMap: Record<string, string> = {
  pix: 'PIX',
  boleto: 'BOLETO',
  credit: 'CREDIT_CARD'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { event_id, amount, method, payer_email, description } = await req.json()

    if (!event_id || !amount || !method) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const apiKey = Deno.env.get('ASAAS_API_KEY') || ''

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
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
    const payerId = user.id

    const { data: eventData, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single()

    if (eventError || !eventData) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payeeId = eventData.artist_id
    const baseUrl = getAsaasApiUrl(apiKey)
    const defaultCustomer = Deno.env.get('ASAAS_DEFAULT_CUSTOMER') || ''
    const authHeaders = { 'Content-Type': 'application/json', 'access_token': apiKey, 'User-Agent': 'TocaMais/1.0' }

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    const billingType = billingTypeMap[method] || 'PIX'

    const asaasBody: Record<string, unknown> = {
      value: Number(amount),
      billingType,
      dueDate: dueDateStr,
      description: description || `Show TocaMais #${event_id}`,
      customer: defaultCustomer
    }

    const asaasResp = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(asaasBody)
    })

    if (!asaasResp.ok) {
      const errText = await asaasResp.text()
      console.error('Asaas error:', errText)
      throw new Error(`Asaas payment creation failed: ${errText}`)
    }

    const asaasData = await asaasResp.json()
    const paymentId = asaasData.id

    let qrCode: string | null = null
    let qrCodeBase64: string | null = null
    let ticketUrl: string | null = null

    if (method === 'pix') {
      const pixResp = await fetch(`${baseUrl}/payments/${paymentId}/pixQrCode`, {
        method: 'GET',
        headers: authHeaders
      })
      if (pixResp.ok) {
        const pixData = await pixResp.json()
        qrCodeBase64 = pixData.encodedImage || null
        const detailResp = await fetch(`${baseUrl}/payments/${paymentId}`, { headers: authHeaders })
        const detailData = detailResp.ok ? await detailResp.json() : {}
        qrCode = detailData.pixTransaction?.payload || null
      }
    } else if (method === 'boleto') {
      ticketUrl = asaasData.bankSlipUrl || asaasData.invoiceUrl || null
    }

    const { error: saveError } = await supabaseAdmin
      .from('payments')
      .insert({
        event_id,
        payer_id: payerId,
        payee_id: payeeId,
        amount: Number(amount),
        status: asaasData.status === 'RECEIVED' || asaasData.status === 'CONFIRMED' ? 'paid' : 'pending',
        method,
        transaction_hash: String(paymentId)
      })

    if (saveError) {
      console.error('Save payment error:', saveError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId,
        mpPaymentId: paymentId,
        status: asaasData.status,
        qrCode,
        qrCodeBase64,
        ticketUrl,
        bankSlipUrl: ticketUrl
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

function getAsaasApiUrl(apiKey: string): string {
  if (apiKey.includes('aact_hmlg')) return 'https://sandbox.asaas.com/api/v3'
  return 'https://api.asaas.com/v3'
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-id, x-client-info, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const statusMap: Record<string, string> = {
  PENDING: 'pending',
  RECEIVED: 'approved',
  CONFIRMED: 'approved',
  OVERDUE: 'overdue',
  REFUNDED: 'refunded',
  RECEIVED_IN_CASH: 'approved',
  PARTIAL: 'partial',
  CANCELLED: 'cancelled'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { payment_id } = await req.json()
    if (!payment_id) {
      return new Response(
        JSON.stringify({ error: 'Missing payment_id' }),
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

    const asaasResp = await fetch(`${baseUrl}/payments/${payment_id}`, {
      headers: { 'access_token': apiKey, 'User-Agent': 'TocaMais/1.0' }
    })

    if (!asaasResp.ok) {
      const errText = await asaasResp.text()
      throw new Error(`Asaas check failed: ${errText}`)
    }

    const asaasData = await asaasResp.json()
    const mpStatus = statusMap[asaasData.status] || asaasData.status.toLowerCase()

    return new Response(
      JSON.stringify({
        success: true,
        mpPaymentId: payment_id,
        mpStatus,
        asaasStatus: asaasData.status,
        statusDetail: asaasData.status,
        paidAt: asaasData.paymentDate || null
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

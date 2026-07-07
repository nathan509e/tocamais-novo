import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const apiKey = Deno.env.get('ASAAS_API_KEY')
    if (!apiKey) throw new Error('ASAAS_API_KEY not set')

    const isSandbox = apiKey.includes('aact_hmlg')
    const baseUrl = isSandbox
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/v3'

    const authHeaders = { 'Content-Type': 'application/json', 'access_token': apiKey, 'User-Agent': 'TocaMais/1.0' }

    // Test connectivity: list recent PIX payments
    const listResp = await fetch(`${baseUrl}/payments?billingType=PIX&limit=10`, { headers: authHeaders })
    const listText = await listResp.text()
    let listData = null
    try { listData = JSON.parse(listText) } catch {}

    const ids = ['pay_kdeiwbplj5xp6i6j', 'pay_gtp54dla49clmeb0', 'pay_ykn2lwcchk5e5x08']
    const results = []
    for (const id of ids) {
      // Try to get payment info first
      const infoResp = await fetch(`${baseUrl}/payments/${id}`, { headers: authHeaders })
      const infoText = await infoResp.text()
      let infoJson = null
      try { infoJson = JSON.parse(infoText) } catch {}

      let simResult = null
      if (infoResp.ok) {
        const simResp = await fetch(`${baseUrl}/payments/${id}/simulateReceivedPix`, {
          method: 'POST', headers: authHeaders
        })
        const simText = await simResp.text()
        try { simResult = { status: simResp.status, data: JSON.parse(simText) } } catch { simResult = { status: simResp.status, data: simText } }
      }

      results.push({ paymentId: id, infoStatus: infoResp.status, info: infoJson, simulation: simResult })
    }

    return new Response(JSON.stringify({
      env: { isSandbox, baseUrl, keyPrefix: apiKey.substring(0, 12) + '...' },
      recentPayments: listData,
      targetedPayments: results
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

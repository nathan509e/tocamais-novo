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

serve(async (req) => {
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const apiKey = Deno.env.get('ASAAS_API_KEY')

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Asaas not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const baseUrl = getAsaasApiUrl(apiKey)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    let userId: string | null = null
    if (token) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      userId = user?.id || null
    }

    const asaasResp = await fetch(`${baseUrl}/payments/${payment_id}`, {
      headers: { 'access_token': apiKey, 'User-Agent': 'TocaMais/1.0' }
    })

    if (!asaasResp.ok) {
      const errText = await asaasResp.text()
      throw new Error(`Asaas check failed: ${errText}`)
    }

    const asaasData = await asaasResp.json()
    const mpStatus = statusMap[asaasData.status] || asaasData.status.toLowerCase()

    if (userId) {
      await supabaseAdmin
        .from('payments')
        .update({
          status: mpStatus === 'approved' ? 'paid' : mpStatus,
          transaction_hash: String(payment_id)
        })
        .eq('transaction_hash', String(payment_id))
    }

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
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { apiKey } = await req.json()

    if (!apiKey || !apiKey.trim()) {
      return new Response(JSON.stringify({ error: 'API key is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const trimmedKey = apiKey.trim()

    // Determine base URL from key prefix
    const isSandbox = trimmedKey.startsWith('$aact_hmlg_')
    const baseUrl = isSandbox ? 'https://api-sandbox.asaas.com/v3' : 'https://api.asaas.com/v3'

    // Call GET /v3/accounts to retrieve the account info including walletId
    const accountResp = await fetch(`${baseUrl}/accounts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': trimmedKey,
      }
    })

    if (!accountResp.ok) {
      const errText = await accountResp.text()
      console.error('Asaas account fetch failed:', accountResp.status, errText)
      return new Response(JSON.stringify({
        error: 'Falha ao validar a chave de API. Verifique se está correta.',
        details: errText.substring(0, 500)
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const accountData = await accountResp.json()
    console.log('Asaas account data:', JSON.stringify(accountData))

    // Extract walletId from the response (check for list/collection first, then single object)
    const walletId = accountData?.walletId || accountData?.id || accountData?.data?.[0]?.walletId || accountData?.data?.[0]?.id

    if (!walletId) {
      return new Response(JSON.stringify({
        error: 'Não foi possível obter o Wallet ID desta conta.',
        details: JSON.stringify(accountData).substring(0, 500)
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Save walletId to the artist's profile
    const { error: updateError } = await supabase
      .from('artists')
      .update({ asaas_wallet_id: walletId })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return new Response(JSON.stringify({ error: 'Erro ao salvar Wallet ID' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      walletId,
      accountName: accountData?.name || null,
      email: accountData?.email || null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    console.error('Error:', e)
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

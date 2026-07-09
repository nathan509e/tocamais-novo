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

  // ALL responses return 200 — Supabase client swallows body on non-2xx
  const resp = (data: Record<string, unknown>) =>
    new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return resp({ success: false, error: 'Unauthorized' })
    }

    // Get artist data
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (artistError || !artist) {
      return resp({ success: false, error: 'Artist profile not found' })
    }

    // Check if already connected
    if (artist.asaas_wallet_id) {
      return resp({ 
        success: false, 
        error: 'Conta Asaas já conectada',
        walletId: artist.asaas_wallet_id 
      })
    }

    const apiKey = Deno.env.get('ASAAS_API_KEY')
    if (!apiKey) {
      return resp({ success: false, error: 'Asaas not configured — ASAAS_API_KEY missing' })
    }

    // Determine base URL from key prefix
    const isSandbox = apiKey.startsWith('$aact_hmlg_')
    const baseUrl = isSandbox ? 'https://sandbox.asaas.com/v3' : 'https://api.asaas.com/v3'
    console.log('Using Asaas base URL:', baseUrl, 'isSandbox:', isSandbox)

    // Parse request body
    let cpfCnpj = ''
    let birthDate = ''
    let postalCode = ''
    let phone = ''
    let address = ''
    let addressNumber = ''
    let complement = ''
    let province = ''
    let companyType = 'MEI'
    let incomeValue = 0
    try {
      const body = await req.json()
      cpfCnpj = body.cpfCnpj || ''
      birthDate = body.birthDate || ''
      postalCode = body.postalCode || ''
      phone = body.phone || ''
      address = body.address || ''
      addressNumber = body.addressNumber || ''
      complement = body.complement || ''
      province = body.province || ''
      companyType = body.companyType || 'MEI'
      incomeValue = body.incomeValue || 0
    } catch (_) {
      // No body or invalid JSON
    }

    // CPF/CNPJ is required
    if (!cpfCnpj || cpfCnpj.replace(/\D/g, '').length < 11) {
      return resp({
        success: false,
        error: 'CPF ou CNPJ é obrigatório para criar conta Asaas',
        details: 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.'
      })
    }

    // Date of birth is required by Asaas (field name: birthDate, format: YYYY-MM-DD)
    if (!birthDate) {
      return resp({
        success: false,
        error: 'Data de nascimento é obrigatória',
        details: 'Informe sua data de nascimento.'
      })
    }

    // CEP (postalCode) is required by Asaas
    if (!postalCode || postalCode.replace(/\D/g, '').length < 8) {
      return resp({
        success: false,
        error: 'CEP é obrigatório para criar conta Asaas',
        details: 'Informe um CEP válido (8 dígitos).'
      })
    }

    // Phone is required by Asaas
    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length < 10) {
      return resp({
        success: false,
        error: 'Telefone é obrigatório para criar conta Asaas',
        details: 'Informe um telefone válido com DDD (mínimo 10 dígitos).'
      })
    }

    // Clean CPF/CNPJ (digits only)
    const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '')
    const isCpf = cleanCpfCnpj.length === 11
    // Clean CEP (digits only)
    const cleanPostalCode = postalCode.replace(/\D/g, '')

    // Format phone for Asaas: remove formatting, use digits only with area code
    // Asaas accepts formats like "11 993367861" or "11993367861"
    const formattedPhone = cleanPhone.length === 11
      ? `${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2)}`
      : `${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2)}`

    // Asaas expects birthDate as YYYY-MM-DD (no conversion needed, frontend sends this format)
    // Build body for Asaas subaccount creation — per docs: https://docs.asaas.com/reference/criar-subconta
    // IMPORTANT: companyType and incomeValue are ONLY for CNPJ (pessoa jurídica) — CPF accounts reject them
    const subaccountBody: Record<string, unknown> = {
      name: artist.artistic_name || user.user_metadata?.name || 'Artista TocaMais',
      email: user.email,
      cpfCnpj: cleanCpfCnpj,
      birthDate: birthDate,
      phone: formattedPhone,
      mobilePhone: formattedPhone,
      address: address || 'Rua não informada',
      addressNumber: addressNumber || '0',
      complement: complement || '',
      province: province || '',
      postalCode: cleanPostalCode,
    }

    // companyType is only for CNPJ (pessoa jurídica)
    if (!isCpf) {
      subaccountBody.companyType = companyType || 'MEI'
    }
    // incomeValue (renda/faturamento) is required by Asaas for ALL account types (CPF and CNPJ)
    subaccountBody.incomeValue = incomeValue || 3000

    console.log('Creating subaccount for artist:', user.id)
    console.log('Body sent to Asaas:', JSON.stringify(subaccountBody))

    const subaccountResp = await fetch(`${baseUrl}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify(subaccountBody)
    })

    const respText = await subaccountResp.text()
    console.log('Asaas response status:', subaccountResp.status)
    console.log('Asaas response body:', respText)

    // If creation failed, check if it's because CPF/CNPJ is already in use
    // In that case, search for the existing account and link it
    let walletId = ''
    let subaccountApiKey = ''

    if (!subaccountResp.ok) {
      const respLower = respText.toLowerCase()
      console.log('Error response for detection:', respLower)
      // Check for CPF already in use — match the exact Asaas error pattern
      const isCpfInUse = respLower.includes('cpf') && respLower.includes('em uso')
      
      if (isCpfInUse) {
        console.log('CPF/CNPJ already in use — searching for existing account...')

        // Helper: search through a list of accounts for matching CPF
        const findInList = (accounts: any[]) =>
          Array.isArray(accounts)
            ? accounts.find((a: any) => (a.cpfCnpj || '').replace(/\D/g, '') === cleanCpfCnpj)
            : null

        // Strategy 1: filtered query
        const s1Resp = await fetch(`${baseUrl}/accounts?cpfCnpj=${cleanCpfCnpj}`, {
          headers: { 'access_token': apiKey }
        })
        const s1Text = await s1Resp.text()
        console.log('Strategy 1 (filter):', s1Resp.status, s1Text.substring(0, 300))
        if (s1Resp.ok) {
          try {
            const d = JSON.parse(s1Text)
            const found = findInList(d.data || d)
            if (found?.walletId || found?.id) { walletId = found.walletId || found.id; subaccountApiKey = found.apiKey || '' }
          } catch (_) {}
        }

        // Strategy 2: list first page without filter
        if (!walletId) {
          const s2Resp = await fetch(`${baseUrl}/accounts?limit=100&offset=0`, {
            headers: { 'access_token': apiKey }
          })
          const s2Text = await s2Resp.text()
          console.log('Strategy 2 (page 0):', s2Resp.status, s2Text.substring(0, 300))
          if (s2Resp.ok) {
            try {
              const d = JSON.parse(s2Text)
              const accounts = d.data || d
              const found = findInList(accounts)
              if (found?.walletId || found?.id) { walletId = found.walletId || found.id; subaccountApiKey = found.apiKey || '' }
              // Strategy 3: paginate further if total > 100
              if (!walletId && d.totalCount > 100) {
                const totalPages = Math.ceil(d.totalCount / 100)
                for (let page = 1; page < Math.min(totalPages, 5) && !walletId; page++) {
                  const sPageResp = await fetch(`${baseUrl}/accounts?limit=100&offset=${page * 100}`, {
                    headers: { 'access_token': apiKey }
                  })
                  if (sPageResp.ok) {
                    try {
                      const pd = await sPageResp.json()
                      const pFound = findInList(pd.data || pd)
                      if (pFound?.walletId || pFound?.id) { walletId = pFound.walletId || pFound.id; subaccountApiKey = pFound.apiKey || '' }
                    } catch (_) {}
                  }
                }
              }
            } catch (_) {}
          }
        }
        
        // If still not found — return a special code so the frontend can show a manual input
        if (!walletId) {
          return resp({
            success: false,
            code: 'cpf_in_use',
            error: 'CPF/CNPJ já está em uso no Asaas, mas não foi possível localizar a conta automaticamente.',
            details: respText.substring(0, 500),
            hint: 'Informe manualmente o Wallet ID da sua conta Asaas.'
          })
        }
        
        // We found the existing account — proceed to save it
        console.log('Linking existing Asaas account:', walletId)
        
      } else {
        // Some other error — return as-is
        return resp({
          success: false,
          error: `Asaas retornou status ${subaccountResp.status}`,
          details: respText.substring(0, 1000),
          sentBody: subaccountBody
        })
      }
    } else {
      // Success — parse the new account
      let subaccountData: Record<string, unknown> = {}
      try {
        subaccountData = JSON.parse(respText)
      } catch (_) {
        return resp({
          success: false,
          error: 'Resposta inválida do Asaas (não é JSON)',
          details: respText.substring(0, 500)
        })
      }

      console.log('Subaccount created:', JSON.stringify(subaccountData))

      walletId = (subaccountData as any).walletId || (subaccountData as any).id || ''
      subaccountApiKey = (subaccountData as any).apiKey || ''
    }

    if (!walletId) {
      return resp({
        success: false,
        error: 'Resposta do Asaas não contém id',
        details: respText.substring(0, 500)
      })
    }

    // Save to database
    const updateData: Record<string, unknown> = {
      asaas_wallet_id: walletId,
    }
    if (subaccountApiKey) updateData.asaas_api_key = subaccountApiKey
    updateData.asaas_account_status = 'pending_verification'
    updateData.cpf_cnpj = cleanCpfCnpj

    const { error: updateError } = await supabase
      .from('artists')
      .update(updateData)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      // Try without extra columns
      const { error: retryError } = await supabase
        .from('artists')
        .update({ asaas_wallet_id: walletId })
        .eq('user_id', user.id)

      if (retryError) {
        return resp({ success: false, error: 'Erro ao salvar dados da conta no banco' })
      }
    }

    return resp({
      success: true,
      walletId,
      message: 'Conta Asaas criada com sucesso! Verifique seu email para ativar a conta.',
      accountStatus: 'pending_verification'
    })

  } catch (e) {
    console.error('Error:', e)
    return resp({ success: false, error: (e as Error).message || 'Internal server error' })
  }
})

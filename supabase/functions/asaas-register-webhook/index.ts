import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type, apikey',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('ASAAS_API_KEY')
    const webhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
    
    if (!apiKey || !webhookToken) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine base URL based on API key
    const baseUrl = apiKey.includes('aact_hmlg') 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/v3'

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const webhookUrl = `${supabaseUrl}/functions/v1/asaas-webhook`

    console.log(`Registering webhook at: ${webhookUrl}`)

    // First, check if webhook already exists
    const listResponse = await fetch(`${baseUrl}/webhooks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      }
    })

    const existingWebhooks = await listResponse.json()
    console.log('Existing webhooks:', JSON.stringify(existingWebhooks))

    // Check if our webhook URL already exists
    const existingWebhook = existingWebhooks.data?.find((w: any) => w.url === webhookUrl)
    
    if (existingWebhook) {
      // If webhook is interrupted, delete it and recreate
      if (existingWebhook.interrupted) {
        console.log('Webhook is interrupted, deleting and recreating...')
        
        // Delete the interrupted webhook
        const deleteResponse = await fetch(`${baseUrl}/webhooks/${existingWebhook.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'access_token': apiKey,
          }
        })
        console.log('Delete response status:', deleteResponse.status)
        
        if (!deleteResponse.ok) {
          const deleteError = await deleteResponse.text()
          console.log('Delete error:', deleteError)
          // Continue anyway, try to create new one
        }
      } else {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Webhook already registered and active',
            url: webhookUrl,
            webhookId: existingWebhook.id,
            enabled: existingWebhook.enabled,
            interrupted: existingWebhook.interrupted
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Create new webhook
    const createResponse = await fetch(`${baseUrl}/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify({
        name: 'TocaMais PIX Webhook',
        url: webhookUrl,
        email: 'maximiano.nathan@gmail.com',
        enabled: true,
        interrupted: false,
        authToken: webhookToken,
        sendType: 'SEQUENTIALLY',
    events: [
      'PAYMENT_RECEIVED',
      'PIX_RECEIVED',
      'PAYMENT_CONFIRMED',
          'PAYMENT_UPDATED',
          'PAYMENT_CREATED',
          'PAYMENT_OVERDUE',
          'PAYMENT_DELETED',
          'PAYMENT_REFUNDED',
          'PAYMENT_RESTORED',
          'SUBSCRIPTION_CREATED',
          'SUBSCRIPTION_UPDATED',
          'SUBSCRIPTION_DELETED',
          'SUBSCRIPTION_INACTIVATED'
        ]
      })
    })

    const result = await createResponse.json()
    console.log('Webhook creation result:', JSON.stringify(result))

    if (!createResponse.ok) {
      throw new Error(`Failed to create webhook: ${JSON.stringify(result)}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook registered successfully',
        webhookId: result.id,
        url: webhookUrl 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error registering webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
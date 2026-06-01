// Supabase Edge Function: Refresh Google Access Token
// Deploy this to: supabase/functions/google-refresh-token

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-id, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tokenId } = await req.json()

    if (!tokenId) {
      return new Response(
        JSON.stringify({ error: 'Missing tokenId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get environment variables
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get auth user
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch the token from database
    const { data: tokenData, error: fetchError } = await supabaseAdmin
      .from('google_calendar_tokens')
      .select('refresh_token, user_id')
      .eq('id', tokenId)
      .single()

    if (fetchError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'Token not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify ownership
    if (tokenData.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Token belongs to another user' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Refresh the token with Google
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }).toString(),
    })

    if (!refreshResponse.ok) {
      const errorData = await refreshResponse.text()
      console.error('Google refresh failed:', errorData)
      
      // If refresh fails, mark token as invalid
      await supabaseAdmin
        .from('google_calendar_tokens')
        .update({ is_active: false })
        .eq('id', tokenId)

      throw new Error(`Google token refresh failed: ${errorData}`)
    }

    const refreshData = await refreshResponse.json()
    const { access_token, expires_in } = refreshData
    const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    // Update the token in database
    const { error: updateError } = await supabaseAdmin
      .from('google_calendar_tokens')
      .update({
        access_token,
        access_token_expires_at: newExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenId)

    if (updateError) {
      throw new Error(`Failed to update token: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        accessToken: access_token,
        expiresAt: newExpiresAt,
        expiresIn: expires_in
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

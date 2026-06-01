// Supabase Edge Function: Exchange Google Authorization Code for Tokens
// Deploy this to: supabase/functions/google-oauth-callback

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
    const { code, artistId } = await req.json()

    if (!code || !artistId) {
      return new Response(
        JSON.stringify({ error: 'Missing code or artistId' }),
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

    if (!googleClientId || !googleClientSecret) {
      return new Response(
        JSON.stringify({ error: 'Missing Google credentials' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: 'http://localhost:5173', // Update for production
        grant_type: 'authorization_code',
      }).toString(),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      throw new Error(`Google token exchange failed: ${errorData}`)
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokenData

    // Get user info from Google
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    )

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info from Google')
    }

    const userData = await userInfoResponse.json()

    // Create Supabase client with service role
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

    // Save tokens to database
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    const { data: tokenRecord, error: saveError } = await supabaseAdmin
      .from('google_calendar_tokens')
      .upsert({
        artist_id: artistId,
        user_id: user.id,
        google_email: userData.email,
        google_user_id: userData.id,
        google_picture_url: userData.picture,
        access_token,
        access_token_expires_at: expiresAt,
        refresh_token,
        import_blocks: true,
        export_shows: true,
        auto_sync: false,
        last_sync_status: 'pending',
        ip_address_connected: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
      }, { onConflict: 'artist_id' })
      .select()
      .single()

    if (saveError) {
      console.error('Database error:', saveError)
      throw new Error(`Failed to save tokens: ${saveError.message}`)
    }

    // Log the connection
    await supabaseAdmin
      .from('google_sync_logs')
      .insert({
        artist_id: artistId,
        token_id: tokenRecord.id,
        sync_type: 'import',
        status: 'success',
        items_synced: 0,
        error_message: 'Connection established',
      })

    return new Response(
      JSON.stringify({
        success: true,
        tokenId: tokenRecord.id,
        accessToken: access_token,
        expiresAt,
        message: 'Google Calendar conectado com sucesso!'
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
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

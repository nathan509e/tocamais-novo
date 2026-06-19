import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-id, x-client-info, content-type, apikey',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all music_requests
    const { data: requests, error: reqError } = await supabaseAdmin
      .from('music_requests')
      .select('*')
      .order('requested_at', { ascending: false })
      .limit(200)

    if (reqError) throw new Error(reqError.message)

    // Fetch matching artists
    const artistIds = [...new Set((requests || []).map(r => r.artist_id).filter(Boolean))]
    const { data: artists, error: artError } = artistIds.length > 0
      ? await supabaseAdmin.from('artists').select('user_id, artistic_name, photo_url, pix_key').in('user_id', artistIds)
      : { data: [], error: null }

    if (artError) throw new Error(artError.message)

    const artistMap = new Map((artists || []).map(a => [a.user_id, a]))

    const enriched = (requests || []).map(r => ({
      ...r,
      artist: artistMap.get(r.artist_id) || null
    }))

    return new Response(
      JSON.stringify({ success: true, data: enriched }),
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

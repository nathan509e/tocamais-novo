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

    // Fetch pending tips (status = 'pending')
    const { data: pendingTips, error: pendingError } = await supabaseAdmin
      .from('pending_tips')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(100)

    if (pendingError) throw new Error(pendingError.message)

    // Get unique artist IDs from both lists
    const artistIds = [
      ...new Set([
        ...(requests || []).map(r => r.artist_id),
        ...(pendingTips || []).map(p => p.artist_id)
      ].filter(Boolean))
    ]

    const { data: artists, error: artError } = artistIds.length > 0
      ? await supabaseAdmin.from('artists').select('user_id, artistic_name, photo_url, pix_key').in('user_id', artistIds)
      : { data: [], error: null }

    if (artError) throw new Error(artError.message)

    const artistMap = new Map((artists || []).map(a => [a.user_id, a]))

    const enrichedRequests = (requests || []).map(r => ({
      ...r,
      artist: artistMap.get(r.artist_id) || null
    }))

    const enrichedPending = (pendingTips || []).map(p => ({
      id: String(p.id),
      artist_id: p.artist_id,
      user_name: p.user_name,
      musica_id: p.musica_id,
      musica_titulo: p.musica_titulo || 'Gorjeta Avulsa',
      musica_artista: p.musica_artista,
      status: 'pending',
      pix_status: 'pending',
      amount: p.amount,
      requested_at: p.created_at,
      message: p.user_message,
      rating: p.rating,
      artist: artistMap.get(p.artist_id) || null
    }))

    // Merge and sort by requested_at desc
    const combined = [...enrichedRequests, ...enrichedPending].sort((a, b) => {
      return new Date(b.requested_at || 0).getTime() - new Date(a.requested_at || 0).getTime()
    })

    return new Response(
      JSON.stringify({ success: true, data: combined }),
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

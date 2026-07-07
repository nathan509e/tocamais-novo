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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseKey) throw new Error('Missing env vars')
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Get last 5 pending_tips
    const { data: tips, error: tipsErr } = await supabase
      .from('pending_tips')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    // 2. Get last 5 music_requests
    const { data: requests, error: reqErr } = await supabase
      .from('music_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    // 3. Get last 5 notifications
    const { data: notifs, error: notErr } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    // 4. Check platform_pix_keys
    const { data: pixKeys, error: pixErr } = await supabase
      .from('platform_pix_keys')
      .select('*')

    return new Response(
      JSON.stringify({
        pending_tips: { data: tips, error: tipsErr?.message },
        music_requests: { data: requests, error: reqErr?.message },
        notifications: { data: notifs, error: notErr?.message },
        platform_pix_keys: { data: pixKeys, error: pixErr?.message }
      }, null, 2),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

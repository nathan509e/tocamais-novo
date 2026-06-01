-- Google Calendar Integration - Secure Token Storage
-- This table stores encrypted access tokens and refresh tokens for Google Calendar integration

CREATE TABLE IF NOT EXISTS public.google_calendar_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL UNIQUE REFERENCES public.artists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Google OAuth Credentials
    google_email TEXT NOT NULL,
    google_user_id TEXT NOT NULL,
    google_picture_url TEXT,
    
    -- Access Token (short-lived, ~1 hour)
    access_token TEXT NOT NULL,
    access_token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Refresh Token (long-lived, for renewal)
    refresh_token TEXT,
    
    -- Sync Settings
    import_blocks BOOLEAN DEFAULT true,
    export_shows BOOLEAN DEFAULT true,
    auto_sync BOOLEAN DEFAULT false,
    sync_calendar_id TEXT DEFAULT 'primary',
    
    -- Sync Tracking
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_status TEXT DEFAULT 'pending',
    last_sync_error TEXT,
    total_syncs_count INTEGER DEFAULT 0,
    
    -- Metadata
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    scopes TEXT[] DEFAULT ARRAY['openid', 'profile', 'email', 'https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly'],
    
    -- Security & Audit
    ip_address_connected TEXT,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    disconnected_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_google_tokens_artist_id ON public.google_calendar_tokens(artist_id);
CREATE INDEX IF NOT EXISTS idx_google_tokens_user_id ON public.google_calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_google_tokens_access_token_expires ON public.google_calendar_tokens(access_token_expires_at);
CREATE INDEX IF NOT EXISTS idx_google_tokens_google_email ON public.google_calendar_tokens(google_email);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_google_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_google_tokens_updated_at ON public.google_calendar_tokens;
CREATE TRIGGER trigger_google_tokens_updated_at
BEFORE UPDATE ON public.google_calendar_tokens
FOR EACH ROW
EXECUTE FUNCTION update_google_tokens_updated_at();

-- Create table for sync history/audit log
CREATE TABLE IF NOT EXISTS public.google_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    token_id UUID NOT NULL REFERENCES public.google_calendar_tokens(id) ON DELETE CASCADE,
    
    sync_type TEXT NOT NULL CHECK (sync_type IN ('import', 'export', 'full', 'manual')),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
    
    items_synced INTEGER DEFAULT 0,
    items_created INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    
    error_message TEXT,
    duration_ms INTEGER, -- How long the sync took
    
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for sync logs
CREATE INDEX IF NOT EXISTS idx_sync_logs_artist_id ON public.google_sync_logs(artist_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_token_id ON public.google_sync_logs(token_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_synced_at ON public.google_sync_logs(synced_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_sync_logs ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own tokens
CREATE POLICY "Users can view their own Google tokens"
    ON public.google_calendar_tokens
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own Google tokens"
    ON public.google_calendar_tokens
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own Google tokens"
    ON public.google_calendar_tokens
    FOR DELETE
    USING (user_id = auth.uid());

-- Only allow users to see sync logs for their tokens
CREATE POLICY "Users can view their own sync logs"
    ON public.google_sync_logs
    FOR SELECT
    USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

-- Migration: Add asaas_subscription_id to artists table
-- This allows us to track which Asaas subscription belongs to which artist
-- and revoke Pro status when subscription is cancelled/expired

-- Add asaas_subscription_id column
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_artists_asaas_subscription_id ON public.artists(asaas_subscription_id);

-- Add comment
COMMENT ON COLUMN public.artists.asaas_subscription_id IS 'Asaas subscription ID for Pro plan (sub_xxx)';

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'artists' 
AND column_name IN ('is_pro', 'asaas_subscription_id')
ORDER BY column_name;
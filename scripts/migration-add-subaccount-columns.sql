-- Migration: Add Asaas subaccount columns to artists table
-- Run this in Supabase Dashboard > SQL Editor

-- API key for the artist's Asaas subaccount (returned once on creation)
ALTER TABLE artists ADD COLUMN IF NOT EXISTS asaas_api_key TEXT;

-- Account status: 'pending_verification', 'active', 'inactive'
ALTER TABLE artists ADD COLUMN IF NOT EXISTS asaas_account_status TEXT DEFAULT NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_artists_asaas_account_status ON artists(asaas_account_status);

-- Verify
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'artists' 
AND column_name IN ('asaas_wallet_id', 'asaas_api_key', 'asaas_account_status', 'pix_key')
ORDER BY column_name;

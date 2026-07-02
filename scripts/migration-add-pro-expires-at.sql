-- Migration: Add pro_expires_at column to artists table
-- This stores when the Pro subscription expires (30 days from payment)
-- Checked on login to auto-revoke if not renewed

ALTER TABLE public.artists
ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMP WITH TIME ZONE;

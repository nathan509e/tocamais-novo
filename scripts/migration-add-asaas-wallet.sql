-- Migration: Add Asaas wallet and PIX key columns to artists table
-- Run this on the Supabase SQL editor

ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS asaas_wallet_id TEXT;
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS pix_key TEXT;

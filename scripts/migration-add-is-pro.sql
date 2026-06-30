-- Migration: Add is_pro column to artists table
-- Run this in Supabase SQL Editor

ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_artists_is_pro ON public.artists(is_pro);

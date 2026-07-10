-- Add setlists JSONB column to artists table
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS setlists JSONB DEFAULT '[]'::jsonb;

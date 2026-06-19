ALTER TABLE IF EXISTS public.artists
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'incomplete';

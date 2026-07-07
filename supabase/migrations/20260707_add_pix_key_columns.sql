-- Add pix_key column to pending_tips for EVP key matching (round-robin per-tip key)
ALTER TABLE pending_tips ADD COLUMN IF NOT EXISTS pix_key TEXT;

-- Add last_used_at column to platform_pix_keys for round-robin ordering
ALTER TABLE platform_pix_keys ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

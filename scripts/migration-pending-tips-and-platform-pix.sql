-- =============================================================
-- Migration: pending_tips + platform_pix_keys
-- Purpose: Support static EVP Pix flow (no /v3/payments)
-- =============================================================

-- 1. Store the platform's static EVP Pix key (created once, reused forever)
CREATE TABLE IF NOT EXISTS platform_pix_keys (
  id TEXT PRIMARY KEY,           -- Asaas addressKey id
  key TEXT NOT NULL,             -- The EVP key value (UUID-like)
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  qr_code_payload TEXT,          -- PIX copy-paste payload
  qr_code_image TEXT,            -- Base64 encoded QR code image
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Only one active key ever needed
ALTER TABLE platform_pix_keys ADD CONSTRAINT unique_active_key UNIQUE (key);

-- 2. Pending tips — created when user clicks "Pay", matched on webhook
CREATE TABLE IF NOT EXISTS pending_tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL,       -- artists.user_id
  user_name TEXT DEFAULT 'Cliente',
  user_message TEXT,
  amount NUMERIC(10,2) NOT NULL,
  musica_id UUID,
  musica_titulo TEXT,
  musica_artista TEXT,
  rating INTEGER,
  status TEXT DEFAULT 'pending', -- pending | confirmed | expired
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  -- Webhook matching fields
  asaas_transaction_id TEXT,     -- Filled when webhook matches
  pix_received_value NUMERIC(10,2),
  pix_received_at TIMESTAMPTZ
);

-- Index for fast webhook matching: find oldest pending tip for a given amount
CREATE INDEX IF NOT EXISTS idx_pending_tips_match
  ON pending_tips (status, amount, created_at)
  WHERE status = 'pending';

-- Index for cleanup of old pending tips
CREATE INDEX IF NOT EXISTS idx_pending_tips_created
  ON pending_tips (created_at);

-- RLS policies
ALTER TABLE pending_tips ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (edge functions use service role)
CREATE POLICY "service_all_pending_tips" ON pending_tips
  FOR ALL
  USING (true)
  WITH CHECK (true);

ALTER TABLE platform_pix_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_pix_keys" ON platform_pix_keys
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Public read for platform pix key (needed to display QR on frontend)
CREATE POLICY "public_read_pix_keys" ON platform_pix_keys
  FOR SELECT
  USING (status = 'ACTIVE');

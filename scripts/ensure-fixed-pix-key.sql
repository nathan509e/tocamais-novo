-- Cleanup: Remove the old hardcoded PIX key from platform_pix_keys
-- Run this in Supabase Dashboard SQL Editor

-- Delete ALL existing keys (the code will create a fresh one automatically on next tip)
DELETE FROM platform_pix_keys;

-- Verify it's empty
SELECT * FROM platform_pix_keys;

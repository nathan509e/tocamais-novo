SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'artists' 
AND column_name IN ('is_pro', 'asaas_subscription_id', 'pro_expires_at', 'asaas_wallet_id', 'pix_key')
ORDER BY column_name;

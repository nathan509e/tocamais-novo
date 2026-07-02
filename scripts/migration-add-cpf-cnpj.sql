-- Migration: Add cpf_cnpj column to artists table
-- Required for Asaas subaccount creation (CNPJ accounts only can create subaccounts)

ALTER TABLE artists ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;

-- Verify
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'artists' 
AND column_name IN ('asaas_wallet_id', 'asaas_api_key', 'asaas_account_status', 'pix_key', 'cpf_cnpj')
ORDER BY column_name;

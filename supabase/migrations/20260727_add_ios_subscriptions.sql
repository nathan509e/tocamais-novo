-- Migration to add ios_subscriptions table for In-App Purchases tracking

CREATE TABLE IF NOT EXISTS public.ios_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL DEFAULT 'ios',
    provider TEXT NOT NULL DEFAULT 'apple',
    product_id TEXT NOT NULL,
    transaction_id TEXT NOT NULL UNIQUE,
    original_transaction_id TEXT NOT NULL,
    subscription_status TEXT NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    jws_representation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ios_subscriptions ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow users to view their own subscription records
CREATE POLICY "Allow users to read their own subscriptions" 
    ON public.ios_subscriptions 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_ios_subscriptions_user ON public.ios_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_ios_subscriptions_original_tx ON public.ios_subscriptions(original_transaction_id);

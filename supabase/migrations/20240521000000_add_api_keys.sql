-- Add paybill, till_number, is_subscriber to profiles (missing from init migration)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paybill TEXT,
  ADD COLUMN IF NOT EXISTS till_number TEXT,
  ADD COLUMN IF NOT EXISTS is_subscriber BOOLEAN DEFAULT false NOT NULL;

-- ─────────────────────────────────────────────
-- API Keys table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  -- SHA-256 hex digest of the raw key. The raw key is NEVER stored.
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  -- 'live' keys hit real M-Pesa; 'test' keys use sandbox only
  mode TEXT NOT NULL DEFAULT 'test' CHECK (mode IN ('live', 'test')),
  last_used_at TIMESTAMPTZ,
  monthly_request_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own API keys"
  ON public.api_keys
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Webhooks table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  -- Array of event names to subscribe to
  events TEXT[] NOT NULL DEFAULT ARRAY[
    'escrow.created',
    'escrow.deposited',
    'escrow.completed',
    'offramp.initiated',
    'offramp.completed'
  ],
  -- Raw secret used for HMAC-SHA256 signing. Stored hashed via app layer.
  secret TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  last_triggered_at TIMESTAMPTZ,
  failure_count INT NOT NULL DEFAULT 0
);

-- RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own webhooks"
  ON public.webhooks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Webhook delivery log (for retries and debugging)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID REFERENCES public.webhooks ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INT,
  response_body TEXT,
  attempt_count INT NOT NULL DEFAULT 1,
  delivered_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false
);

-- Service role only — no user-facing RLS needed for delivery logs
-- (they are read by Edge Functions running as service role)
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to webhook deliveries"
  ON public.webhook_deliveries
  FOR ALL
  USING (true);

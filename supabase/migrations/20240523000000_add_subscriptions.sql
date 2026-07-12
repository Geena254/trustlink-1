-- ── Subscriptions audit table ────────────────────────────────────────────────
-- Stores every successful Paystack payment so we have a full payment history,
-- even if is_subscriber is toggled manually later.

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,

  -- Paystack identifiers
  paystack_reference TEXT NOT NULL UNIQUE,  -- e.g. "tl_sub_abc123"
  paystack_transaction_id BIGINT,           -- numeric ID returned by Paystack

  amount_kobo INT NOT NULL,   -- amount in smallest currency unit (kobo for NGN, pesewas for GHS, etc.)
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending'    -- 'pending' | 'success' | 'failed'
    CHECK (status IN ('pending', 'success', 'failed')),

  -- Subscription period covered
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,     -- period_start + 30 days

  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- RLS: users can only read their own subscription records
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_reference
  ON public.subscriptions(paystack_reference);

-- Add subscription_expires_at to profiles so we can gate access by date,
-- not just the boolean flag (makes renewals work correctly).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

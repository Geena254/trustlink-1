-- ── Indexes on hot-path columns ─────────────────────────────────────────────

-- API key lookups (every authenticated API request hits this)
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash
  ON public.api_keys(key_hash);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id
  ON public.api_keys(user_id);

-- Escrow queries by owner and status (dashboard + withdraw page)
CREATE INDEX IF NOT EXISTS idx_escrows_seller_id
  ON public.escrows(seller_id);

CREATE INDEX IF NOT EXISTS idx_escrows_seller_status
  ON public.escrows(seller_id, status);

-- Webhook lookups by owner (dispatched on every escrow event)
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id
  ON public.webhooks(user_id, is_active);

-- Webhook delivery log (debugging queries)
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id
  ON public.webhook_deliveries(webhook_id);

-- ── Monthly request counter reset via pg_cron ─────────────────────────────
-- Requires the pg_cron extension to be enabled in your Supabase project
-- (Database → Extensions → pg_cron).
-- Runs at midnight UTC on the 1st of every month.

SELECT cron.schedule(
  'reset-monthly-request-counts',           -- job name (idempotent)
  '0 0 1 * *',                              -- cron expression: 1st of month, 00:00 UTC
  $$
    UPDATE public.api_keys
    SET monthly_request_count = 0
    WHERE monthly_request_count > 0;
  $$
);

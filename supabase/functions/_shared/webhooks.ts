import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sha256Hex } from "./auth.ts";

export type WebhookEvent =
  | "escrow.created"
  | "escrow.deposited"
  | "escrow.completed"
  | "offramp.initiated"
  | "offramp.completed";

export interface WebhookPayload {
  id: string;          // Unique delivery ID (UUID)
  event: WebhookEvent;
  created_at: string;  // ISO timestamp
  data: Record<string, unknown>;
}

/**
 * Dispatch a webhook event to all active subscribers for a given user.
 *
 * - Fetches all webhooks for `userId` that subscribe to `event`.
 * - Signs each request with HMAC-SHA256 using the webhook's secret.
 * - Logs each delivery attempt to `webhook_deliveries`.
 * - Does NOT retry here — retries are handled by the delivery log + a separate cron.
 */
export async function dispatchWebhook(
  supabase: SupabaseClient,
  userId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  const { data: hooks, error } = await supabase
    .from("webhooks")
    .select("id, url, secret, events")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error || !hooks || hooks.length === 0) return;

  const relevantHooks = hooks.filter(
    (h: { events: string[] }) => h.events.includes(event)
  );

  if (relevantHooks.length === 0) return;

  const deliveryId = crypto.randomUUID();
  const payload: WebhookPayload = {
    id: deliveryId,
    event,
    created_at: new Date().toISOString(),
    data,
  };
  const body = JSON.stringify(payload);

  await Promise.allSettled(
    relevantHooks.map(async (hook: { id: string; url: string; secret: string }) => {
      const signature = await hmacSha256(hook.secret, body);
      let responseStatus: number | null = null;
      let responseBody: string | null = null;
      let success = false;

      try {
        const res = await fetch(hook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-TrustLink-Signature": `sha256=${signature}`,
            "X-TrustLink-Event": event,
            "X-TrustLink-Delivery": deliveryId,
          },
          body,
        });
        responseStatus = res.status;
        responseBody = await res.text().catch(() => null);
        success = res.ok;
      } catch (err: any) {
        responseBody = err?.message ?? "Network error";
      }

      // Log the delivery attempt
      await supabase.from("webhook_deliveries").insert({
        webhook_id: hook.id,
        event_type: event,
        payload,
        response_status: responseStatus,
        response_body: responseBody,
        success,
        attempt_count: 1,
      });

      // Update failure count and last_triggered_at on the webhook itself
      await supabase
        .from("webhooks")
        .update({
          last_triggered_at: new Date().toISOString(),
          failure_count: success ? 0 : supabase.rpc("increment", { row_id: hook.id }),
        })
        .eq("id", hook.id);
    })
  );
}

/**
 * Compute HMAC-SHA256 signature.
 * Used both for signing outgoing webhooks and for clients to verify received payloads.
 */
async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

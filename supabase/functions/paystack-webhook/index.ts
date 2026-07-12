import { serve } from "@std/http/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /functions/v1/paystack-webhook
 *
 * Receives event notifications from Paystack.
 * Verifies the HMAC-SHA512 signature, then activates the subscription
 * on a successful "charge.success" event.
 *
 * Configure this URL in your Paystack Dashboard →
 * Settings → API Keys & Webhooks → Webhook URL
 *
 * No CORS needed — this is called by Paystack's servers, not browsers.
 */
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const rawBody = await req.text();

    // ── 1. Verify Paystack signature ─────────────────────────────────────────
    // Paystack sends X-Paystack-Signature: HMAC-SHA512 of the raw body
    // signed with your secret key.
    const paystackSig = req.headers.get("x-paystack-signature");
    if (!paystackSig) {
      console.warn("Webhook received without signature");
      return new Response("Unauthorized", { status: 401 });
    }

    const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
    const expectedSig = await hmacSha512(secretKey, rawBody);

    if (expectedSig !== paystackSig) {
      console.warn("Webhook signature mismatch");
      return new Response("Unauthorized", { status: 401 });
    }

    // ── 2. Parse payload ──────────────────────────────────────────────────────
    const event = JSON.parse(rawBody);
    console.log("Paystack webhook event:", event.event, event.data?.reference);

    // ── 3. Handle charge.success ──────────────────────────────────────────────
    if (event.event === "charge.success") {
      const { reference, amount, currency, id: transactionId, metadata } = event.data;

      // Retrieve the pending subscription record by reference
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .select("id, user_id, status")
        .eq("paystack_reference", reference)
        .single();

      if (subError || !subscription) {
        console.error("Subscription not found for reference:", reference);
        // Return 200 so Paystack doesn't keep retrying for unknown references
        return new Response("OK", { status: 200 });
      }

      // Guard: don't double-activate
      if (subscription.status === "success") {
        console.log("Subscription already activated:", reference);
        return new Response("OK", { status: 200 });
      }

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30); // 30-day subscription

      // Update subscription record
      const { error: updateSubError } = await supabase
        .from("subscriptions")
        .update({
          status: "success",
          paystack_transaction_id: transactionId,
          amount_kobo: amount,
          currency,
          period_start: now.toISOString(),
          period_end: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("paystack_reference", reference);

      if (updateSubError) throw updateSubError;

      // Activate subscription on the profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          is_subscriber: true,
          subscription_expires_at: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", subscription.user_id);

      if (profileError) throw profileError;

      console.log(`Subscription activated for user ${subscription.user_id} until ${periodEnd.toISOString()}`);
    }

    // ── 4. Handle charge.failed / transfer.failed ─────────────────────────────
    if (event.event === "charge.failed") {
      const { reference } = event.data;
      await supabase
        .from("subscriptions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("paystack_reference", reference)
        .eq("status", "pending"); // only update if still pending
    }

    return new Response("OK", { status: 200 });
  } catch (err: any) {
    console.error("paystack-webhook error:", err.message);
    // Return 200 to prevent Paystack from retrying for server errors we need to debug
    return new Response("OK", { status: 200 });
  }
});

// ── Crypto helpers ────────────────────────────────────────────────────────────

async function hmacSha512(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

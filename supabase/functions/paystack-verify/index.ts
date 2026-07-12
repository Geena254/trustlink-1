import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/auth.ts";

/**
 * GET /functions/v1/paystack-verify?reference=tl_sub_...
 *
 * Called by the /subscribe/callback page after Paystack redirects the user back.
 * Verifies the transaction with Paystack and returns the subscription status.
 *
 * Auth: Supabase JWT (logged-in user)
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse("Unauthorized", 401);

    const url = new URL(req.url);
    const reference = url.searchParams.get("reference");
    if (!reference) return errorResponse("reference query param is required");

    // ── Verify with Paystack ──────────────────────────────────────────────────
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        },
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return errorResponse(paystackData.message ?? "Verification failed");
    }

    const tx = paystackData.data;

    // ── Check our subscriptions table for activation status ───────────────────
    // The webhook may have already activated it; if not, we activate here as a
    // safety net (webhook can sometimes arrive after the redirect).
    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: subscription } = await serviceSupabase
      .from("subscriptions")
      .select("status, period_end")
      .eq("paystack_reference", reference)
      .eq("user_id", user.id)
      .single();

    // If Paystack says success but webhook hasn't fired yet, activate now
    if (tx.status === "success" && subscription?.status !== "success") {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);

      await serviceSupabase
        .from("subscriptions")
        .update({
          status: "success",
          paystack_transaction_id: tx.id,
          period_start: now.toISOString(),
          period_end: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("paystack_reference", reference);

      await serviceSupabase
        .from("profiles")
        .update({
          is_subscriber: true,
          subscription_expires_at: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", user.id);
    }

    return jsonResponse({
      success: tx.status === "success",
      reference,
      amount: tx.amount / 100,      // convert cents back to dollars
      currency: tx.currency,
      paid_at: tx.paid_at,
      subscription_status: tx.status === "success" ? "active" : "failed",
    });
  } catch (err: any) {
    console.error("paystack-verify error:", err.message);
    return errorResponse(err.message ?? "Internal server error", 500);
  }
});

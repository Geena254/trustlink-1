import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/auth.ts";

/**
 * POST /functions/v1/paystack-initialize
 *
 * Called from the Subscribe page when the user clicks "Get Started Pro".
 * Creates a Paystack transaction and returns the hosted checkout URL.
 *
 * Auth: Supabase JWT (logged-in user only)
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
    // ── 1. Authenticate the caller ───────────────────────────────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse("Unauthorized", 401);

    // ── 2. Check if already subscribed and active ────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_subscriber, subscription_expires_at")
      .eq("id", user.id)
      .single();

    if (
      profile?.is_subscriber &&
      profile?.subscription_expires_at &&
      new Date(profile.subscription_expires_at) > new Date()
    ) {
      return errorResponse("You already have an active TrustLink Pro subscription.", 409);
    }

    // ── 3. Generate a unique reference ────────────────────────────────────────
    // Format: tl_sub_<userId_first8>_<timestamp>
    const reference = `tl_sub_${user.id.slice(0, 8)}_${Date.now()}`;

    // ── 4. Create a pending subscription record ───────────────────────────────
    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await serviceSupabase.from("subscriptions").insert({
      user_id: user.id,
      paystack_reference: reference,
      amount_kobo: 2900 * 100, // $29 — stored as cents (Paystack uses smallest unit)
      currency: "USD",
      status: "pending",
    });

    // ── 5. Initialize Paystack transaction ────────────────────────────────────
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: 2900 * 100,   // Amount in kobo/cents ($29.00 USD = 2900 cents)
        currency: "USD",
        reference,
        callback_url: `${Deno.env.get("APP_URL")}/subscribe/callback`,
        metadata: {
          user_id: user.id,
          plan: "pro_monthly",
          cancel_action: `${Deno.env.get("APP_URL")}/subscribe`,
        },
        channels: ["card", "bank_transfer", "mobile_money"],
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      // Clean up the pending record if Paystack rejected it
      await serviceSupabase
        .from("subscriptions")
        .delete()
        .eq("paystack_reference", reference);

      return errorResponse(paystackData.message ?? "Paystack initialization failed");
    }

    // ── 6. Return the hosted checkout URL ─────────────────────────────────────
    return jsonResponse({
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
      access_code: paystackData.data.access_code,
    });
  } catch (err: any) {
    console.error("paystack-initialize error:", err);
    return errorResponse(err.message ?? "Internal server error", 500);
  }
});

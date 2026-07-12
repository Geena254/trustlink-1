import { serve } from "@std/http/server";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/auth.ts";
import { dispatchWebhook } from "../_shared/webhooks.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Support both: Supabase JWT (from the UI) and API Key (from external apps)
  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );
  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { amount, chain, seller_wallet, payout_method, mpesa_phone, paybill, till_number } =
      await req.json();

    const {
      data: { user },
    } = await supabaseAnon.auth.getUser();
    if (!user) return errorResponse("Unauthorized", 401);

    if (!amount || !chain || !seller_wallet || !payout_method) {
      return errorResponse("Missing required fields: amount, chain, seller_wallet, payout_method");
    }

    const { data, error } = await supabaseAnon
      .from("escrows")
      .insert({
        seller_id: user.id,
        amount: parseFloat(amount),
        currency: "USDC",
        chain,
        seller_wallet,
        payout_method: payout_method ?? "phone",
        mpesa_phone: mpesa_phone ?? null,
        paybill: paybill ?? null,
        till_number: till_number ?? null,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    // Dispatch webhook via service role
    await dispatchWebhook(supabaseService, user.id, "escrow.created", data);

    return jsonResponse(
      {
        ...data,
        payment_url: `${Deno.env.get("APP_URL") ?? ""}/pay/${data.id}`,
      },
      201
    );
  } catch (error: any) {
    return errorResponse(error.message);
  }
});

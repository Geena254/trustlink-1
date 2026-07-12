import { serve } from "@std/http/server";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/auth.ts";
import { dispatchWebhook } from "../_shared/webhooks.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { escrow_id } = await req.json();

    const { data: escrow, error: fetchError } = await supabase
      .from("escrows")
      .select("*")
      .eq("id", escrow_id)
      .single();

    if (fetchError || !escrow) {
      return errorResponse("Escrow not found", 404);
    }

    if (escrow.status !== "completed") {
      return errorResponse(
        `Cannot initiate withdrawal: escrow status is '${escrow.status}'. Expected 'completed'.`
      );
    }

    const mpesaUrl = "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest";

    const mpesaResponse = await fetch(mpesaUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("MPESA_ACCESS_TOKEN")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        InitiatorName: Deno.env.get("MPESA_INITIATOR_NAME"),
        SecurityCredential: Deno.env.get("MPESA_SECURITY_CREDENTIAL"),
        CommandID: "BusinessPayment",
        Amount: escrow.amount,
        PartyA: Deno.env.get("MPESA_SHORTCODE"),
        PartyB: escrow.mpesa_phone,
        Remarks: `TrustLink escrow payout ${escrow_id}`,
        QueueTimeOutURL: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-callback`,
        ResultURL: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-callback`,
        Occasion: "Escrow Release",
      }),
    });

    const mpesaResult = await mpesaResponse.json();

    const { error: updateError } = await supabase
      .from("escrows")
      .update({ status: "offramp_initiated", updated_at: new Date().toISOString() })
      .eq("id", escrow_id);

    if (updateError) throw updateError;

    await dispatchWebhook(supabase, escrow.seller_id, "offramp.initiated", {
      ...escrow,
      status: "offramp_initiated",
    });

    return jsonResponse({ message: "M-Pesa payout initiated", result: mpesaResult });
  } catch (error: any) {
    return errorResponse(error.message);
  }
});

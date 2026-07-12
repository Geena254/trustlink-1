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
    const payload = await req.json();
    console.log("M-Pesa Callback received:", payload);

    const result = payload.Result;
    if (result.ResultCode === 0) {
      // Parse escrow ID from remarks: "TrustLink escrow payout <uuid>"
      const escrowId = result.Remarks?.split("payout ")[1]?.trim();
      if (!escrowId) {
        console.error("Could not parse escrow ID from remarks:", result.Remarks);
        return new Response("OK", { status: 200 });
      }

      const { data: escrow, error: fetchError } = await supabase
        .from("escrows")
        .select("seller_id")
        .eq("id", escrowId)
        .single();

      if (fetchError || !escrow) {
        console.error("Escrow not found for callback:", escrowId);
        return new Response("OK", { status: 200 });
      }

      const { error } = await supabase
        .from("escrows")
        .update({
          status: "offramp_completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", escrowId);

      if (error) throw error;

      // Dispatch webhook to merchant
      await dispatchWebhook(supabase, escrow.seller_id, "offramp.completed", {
        id: escrowId,
        status: "offramp_completed",
        mpesa_transaction_id: result.TransactionID,
      });
    } else {
      console.error("M-Pesa Payout Failed:", result.ResultDesc);
    }

    return new Response("OK", { status: 200 });
  } catch (error: any) {
    console.error("Error in M-Pesa Callback:", error.message);
    return new Response(error.message, { status: 500 });
  }
});

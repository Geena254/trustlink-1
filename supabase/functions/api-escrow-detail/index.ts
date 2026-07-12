import { serve } from "@std/http/server";
import { createClient } from "@supabase/supabase-js";
import {
  verifyApiKey,
  corsHeaders,
  errorResponse,
  jsonResponse,
} from "../_shared/auth.ts";
import { dispatchWebhook } from "../_shared/webhooks.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Extract escrow ID from path: /functions/v1/api-escrow-detail/:id
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const escrowId = pathParts[pathParts.length - 1];

  if (!escrowId || escrowId === "api-escrow-detail") {
    return errorResponse("Escrow ID is required in the path", 400);
  }

  try {
    const { userId } = await verifyApiKey(req, supabase);

    // ── Fetch the escrow and verify ownership ────────────────────────────
    const { data: escrow, error: fetchError } = await supabase
      .from("escrows")
      .select("*")
      .eq("id", escrowId)
      .single();

    if (fetchError || !escrow) {
      return errorResponse("Escrow not found", 404);
    }

    if (escrow.seller_id !== userId) {
      return errorResponse("Forbidden: you do not own this escrow", 403);
    }

    if (req.method === "GET") {
      // ── Get escrow detail ──────────────────────────────────────────────
      return jsonResponse({
        ...escrow,
        payment_url: `${Deno.env.get("APP_URL") ?? ""}/pay/${escrow.id}`,
      });
    }

    if (req.method === "POST") {
      const url2 = new URL(req.url);
      const action = url2.searchParams.get("action");

      if (action === "release") {
        // ── Confirm delivery & release funds ──────────────────────────────
        if (escrow.status !== "deposited") {
          return errorResponse(
            `Cannot release escrow with status '${escrow.status}'. Status must be 'deposited'.`
          );
        }

        const { error } = await supabase
          .from("escrows")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", escrowId);

        if (error) throw error;

        await dispatchWebhook(supabase, userId, "escrow.completed", {
          ...escrow,
          status: "completed",
        });

        return jsonResponse({ id: escrowId, status: "completed" });
      }

      if (action === "withdraw") {
        // ── Trigger M-Pesa off-ramp ────────────────────────────────────────
        if (escrow.status !== "completed") {
          return errorResponse(
            `Cannot withdraw escrow with status '${escrow.status}'. Status must be 'completed'.`
          );
        }

        const mpesaUrl = escrow.mode === "live"
          ? "https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest"
          : "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest";

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
            Remarks: `TrustLink escrow payout ${escrowId}`,
            QueueTimeOutURL: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-callback`,
            ResultURL: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-callback`,
            Occasion: "Escrow Release",
          }),
        });

        const mpesaResult = await mpesaResponse.json();

        const { error: updateError } = await supabase
          .from("escrows")
          .update({
            status: "offramp_initiated",
            updated_at: new Date().toISOString(),
          })
          .eq("id", escrowId);

        if (updateError) throw updateError;

        await dispatchWebhook(supabase, userId, "offramp.initiated", {
          ...escrow,
          status: "offramp_initiated",
        });

        return jsonResponse({
          id: escrowId,
          status: "offramp_initiated",
          mpesa: mpesaResult,
        });
      }

      return errorResponse("Unknown action. Use ?action=release or ?action=withdraw");
    }

    return errorResponse("Method not allowed", 405);
  } catch (err: any) {
    const status =
      err.message?.includes("Unauthorized") || err.message?.includes("API key")
        ? 401
        : err.message?.includes("Forbidden")
        ? 403
        : 400;
    return errorResponse(err.message, status);
  }
});

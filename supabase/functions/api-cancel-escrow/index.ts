import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/auth.ts";
import { dispatchWebhook } from "../_shared/webhooks.ts";

/**
 * POST /functions/v1/api-cancel-escrow
 * Body: { escrow_id: string }
 *
 * Cancels a pending escrow. Only the seller can cancel, and only while
 * the escrow is still in 'pending' status (not yet deposited by a buyer).
 *
 * Supports both UI (Supabase JWT) and API (Bearer tl_... key) auth.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  try {
    const { escrow_id } = await req.json();
    if (!escrow_id) return errorResponse("escrow_id is required");

    const { data: { user } } = await supabaseAnon.auth.getUser();
    if (!user) return errorResponse("Unauthorized", 401);

    // Fetch + ownership check in one query
    const { data: escrow, error: fetchError } = await supabaseAnon
      .from("escrows")
      .select("id, status, seller_id")
      .eq("id", escrow_id)
      .eq("seller_id", user.id)   // RLS + explicit ownership
      .single();

    if (fetchError || !escrow) {
      return errorResponse("Escrow not found or you do not own it", 404);
    }

    if (escrow.status !== "pending") {
      return errorResponse(
        `Cannot cancel an escrow with status '${escrow.status}'. Only 'pending' escrows can be cancelled.`
      );
    }

    const { error } = await supabaseAnon
      .from("escrows")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", escrow_id)
      .eq("status", "pending"); // double-guard against race condition

    if (error) throw error;

    // Dispatch webhook using service role so it bypasses RLS
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    await dispatchWebhook(supabaseService, user.id, "escrow.completed", {
      id: escrow_id,
      status: "cancelled",
    });

    return jsonResponse({ id: escrow_id, status: "cancelled" });
  } catch (err: any) {
    return errorResponse(err.message);
  }
});

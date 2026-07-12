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

  try {
    const { userId } = await verifyApiKey(req, supabase);

    if (req.method === "POST") {
      // ── Create a new escrow ──────────────────────────────────────────────
      const body = await req.json();
      const { amount, chain, seller_wallet, payout_method, mpesa_phone, paybill, till_number } = body;

      if (!amount || !chain || !seller_wallet || !payout_method) {
        return errorResponse("Missing required fields: amount, chain, seller_wallet, payout_method");
      }

      // Amount limits
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount < 1) {
        return errorResponse("Minimum escrow amount is 1 USDC");
      }
      if (parsedAmount > 50000) {
        return errorResponse("Maximum escrow amount is 50,000 USDC");
      }

      // Chain whitelist
      const validChains = ["base", "avalanche", "lisk"];
      if (!validChains.includes(chain)) {
        return errorResponse(`Invalid chain '${chain}'. Must be one of: ${validChains.join(", ")}`);
      }

      // EVM wallet address format
      if (!/^0x[0-9a-fA-F]{40}$/.test(seller_wallet)) {
        return errorResponse("Invalid seller_wallet. Must be a valid EVM address (0x + 40 hex chars)");
      }

      // Payout method validation
      const validMethods = ["phone", "paybill", "till"];
      if (!validMethods.includes(payout_method)) {
        return errorResponse(`Invalid payout_method. Must be one of: ${validMethods.join(", ")}`);
      }
      if (payout_method === "phone" && !mpesa_phone) {
        return errorResponse("mpesa_phone is required when payout_method is 'phone'");
      }
      if (payout_method === "phone" && !/^2547\d{8}$|^2541\d{8}$/.test(mpesa_phone)) {
        return errorResponse("Invalid mpesa_phone format. Use: 2547XXXXXXXX");
      }
      if (payout_method === "paybill" && !paybill) {
        return errorResponse("paybill is required when payout_method is 'paybill'");
      }
      if (payout_method === "till" && !till_number) {
        return errorResponse("till_number is required when payout_method is 'till'");
      }

      const { data, error } = await supabase
        .from("escrows")
        .insert({
          seller_id: userId,
          amount: parseFloat(amount),
          currency: "USDC",
          chain,
          seller_wallet,
          payout_method,
          mpesa_phone: mpesa_phone ?? null,
          paybill: paybill ?? null,
          till_number: till_number ?? null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Dispatch webhook
      await dispatchWebhook(supabase, userId, "escrow.created", data);

      return jsonResponse(
        {
          ...data,
          payment_url: `${Deno.env.get("APP_URL") ?? ""}/pay/${data.id}`,
        },
        201
      );
    }

    if (req.method === "GET") {
      // ── List all escrows for this merchant ───────────────────────────────
      const url = new URL(req.url);
      const status = url.searchParams.get("status");
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
      const offset = parseInt(url.searchParams.get("offset") ?? "0");

      let query = supabase
        .from("escrows")
        .select("*", { count: "exact" })
        .eq("seller_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return jsonResponse({ data, total: count, limit, offset });
    }

    return errorResponse("Method not allowed", 405);
  } catch (err: any) {
    const status = err.message?.includes("Unauthorized") || err.message?.includes("API key")
      ? 401
      : 400;
    return errorResponse(err.message, status);
  }
});

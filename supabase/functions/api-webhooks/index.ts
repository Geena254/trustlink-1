import { serve } from "@std/http/server";
import { createClient } from "@supabase/supabase-js";
import {
  verifyApiKey,
  corsHeaders,
  errorResponse,
  jsonResponse,
  sha256Hex,
} from "../_shared/auth.ts";

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

    if (req.method === "GET") {
      // ── List webhooks ──────────────────────────────────────────────────
      const { data, error } = await supabase
        .from("webhooks")
        .select("id, url, events, is_active, created_at, last_triggered_at, failure_count")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return jsonResponse({ data });
    }

    if (req.method === "POST") {
      // ── Register a new webhook ─────────────────────────────────────────
      const body = await req.json();
      const { url, events, secret } = body;

      if (!url || !secret) {
        return errorResponse("Missing required fields: url, secret");
      }

      const validEvents = [
        "escrow.created",
        "escrow.deposited",
        "escrow.completed",
        "offramp.initiated",
        "offramp.completed",
      ];

      const requestedEvents: string[] = events ?? validEvents;
      const invalidEvents = requestedEvents.filter((e) => !validEvents.includes(e));
      if (invalidEvents.length > 0) {
        return errorResponse(
          `Invalid events: ${invalidEvents.join(", ")}. Valid events: ${validEvents.join(", ")}`
        );
      }

      // Validate the URL is reachable (basic check)
      try {
        new URL(url);
      } catch {
        return errorResponse("Invalid webhook URL");
      }

      const { data, error } = await supabase
        .from("webhooks")
        .insert({
          user_id: userId,
          url,
          events: requestedEvents,
          secret,
          is_active: true,
        })
        .select("id, url, events, is_active, created_at")
        .single();

      if (error) throw error;

      return jsonResponse(data, 201);
    }

    if (req.method === "DELETE") {
      // ── Delete a webhook ───────────────────────────────────────────────
      const urlObj = new URL(req.url);
      const webhookId = urlObj.searchParams.get("id");
      if (!webhookId) return errorResponse("Webhook ID required as query param ?id=");

      const { error } = await supabase
        .from("webhooks")
        .delete()
        .eq("id", webhookId)
        .eq("user_id", userId);

      if (error) throw error;
      return jsonResponse({ deleted: true, id: webhookId });
    }

    return errorResponse("Method not allowed", 405);
  } catch (err: any) {
    const status =
      err.message?.includes("Unauthorized") || err.message?.includes("API key") ? 401 : 400;
    return errorResponse(err.message, status);
  }
});

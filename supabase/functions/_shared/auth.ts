import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Verify an API key from the Authorization header.
 * Expects: `Authorization: Bearer tl_live_<key>` or `Authorization: Bearer tl_test_<key>`
 *
 * Returns the `user_id` and `mode` of the API key owner.
 * Throws with a descriptive message if the key is missing, malformed, or invalid.
 */
export async function verifyApiKey(
  req: Request,
  supabase: SupabaseClient
): Promise<{ userId: string; mode: "live" | "test" }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  const rawKey = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!rawKey.startsWith("tl_live_") && !rawKey.startsWith("tl_test_")) {
    throw new Error("Invalid API key format. Keys must start with tl_live_ or tl_test_");
  }

  const keyHash = await sha256Hex(rawKey);

  const { data, error } = await supabase
    .from("api_keys")
    .select("user_id, mode, is_active")
    .eq("key_hash", keyHash)
    .single();

  if (error || !data) {
    throw new Error("Invalid API key");
  }

  if (!data.is_active) {
    throw new Error("API key has been revoked");
  }

  // Fire-and-forget: update last_used_at and increment counter
  supabase
    .from("api_keys")
    .update({
      last_used_at: new Date().toISOString(),
      monthly_request_count: data.monthly_request_count + 1,
    })
    .eq("key_hash", keyHash)
    .then(() => {/* ignore */});

  return { userId: data.user_id, mode: data.mode as "live" | "test" };
}

/**
 * Compute SHA-256 hex digest of a string using the Web Crypto API (available in Deno).
 */
export async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Standard CORS headers for all public API endpoints.
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

/**
 * Helper to build a JSON error response.
 */
export function errorResponse(
  message: string,
  status = 400,
  extra?: Record<string, unknown>
): Response {
  return new Response(
    JSON.stringify({ error: message, ...extra }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    }
  );
}

/**
 * Helper to build a JSON success response.
 */
export function jsonResponse(
  data: unknown,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

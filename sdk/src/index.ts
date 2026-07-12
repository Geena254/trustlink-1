import type {
  TrustLinkConfig,
  Escrow,
  CreateEscrowParams,
  ListEscrowsParams,
  ListEscrowsResponse,
  Webhook,
  CreateWebhookParams,
  ListWebhooksResponse,
} from "./types.js";

const DEFAULT_BASE_URL =
  "https://ozvfnaancojxsizqqtnt.supabase.co/functions/v1";

// ─── Internal fetch helper ────────────────────────────────────────────────────

async function apiFetch<T>(
  apiKey: string,
  baseUrl: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { error: text };
  }

  if (!res.ok) {
    const msg = (data as { error?: string })?.error ?? `HTTP ${res.status}`;
    throw new TrustLinkError(msg, res.status, data);
  }

  return data as T;
}

// ─── Error class ─────────────────────────────────────────────────────────────

export class TrustLinkError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly body: unknown
  ) {
    super(message);
    this.name = "TrustLinkError";
  }
}

// ─── Escrows resource ────────────────────────────────────────────────────────

class EscrowsResource {
  constructor(private apiKey: string, private baseUrl: string) {}

  /** Create a new escrow payment link. */
  async create(params: CreateEscrowParams): Promise<Escrow> {
    return apiFetch<Escrow>(this.apiKey, this.baseUrl, "/api-escrows", {
      method: "POST",
      body: JSON.stringify({
        amount: params.amount,
        chain: params.chain,
        seller_wallet: params.sellerWallet,
        payout_method: params.payoutMethod,
        mpesa_phone: params.mpesaPhone,
        paybill: params.paybill,
        till_number: params.tillNumber,
      }),
    });
  }

  /** List escrows with optional status filter and pagination. */
  async list(params: ListEscrowsParams = {}): Promise<ListEscrowsResponse> {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    if (params.offset !== undefined) qs.set("offset", String(params.offset));
    const query = qs.toString() ? `?${qs}` : "";
    return apiFetch<ListEscrowsResponse>(
      this.apiKey,
      this.baseUrl,
      `/api-escrows${query}`
    );
  }

  /** Get a single escrow by ID. */
  async get(id: string): Promise<Escrow> {
    return apiFetch<Escrow>(
      this.apiKey,
      this.baseUrl,
      `/api-escrow-detail/${id}`
    );
  }

  /**
   * Confirm delivery and release funds to the seller.
   * The escrow must be in the 'deposited' state.
   */
  async release(id: string): Promise<{ id: string; status: string }> {
    return apiFetch(
      this.apiKey,
      this.baseUrl,
      `/api-escrow-detail/${id}?action=release`,
      { method: "POST" }
    );
  }

  /**
   * Trigger the M-Pesa off-ramp payout (USDC → KES).
   * The escrow must be in the 'completed' state.
   */
  async withdraw(id: string): Promise<{ id: string; status: string; mpesa: unknown }> {
    return apiFetch(
      this.apiKey,
      this.baseUrl,
      `/api-escrow-detail/${id}?action=withdraw`,
      { method: "POST" }
    );
  }
}

// ─── Webhooks resource ────────────────────────────────────────────────────────

class WebhooksResource {
  constructor(private apiKey: string, private baseUrl: string) {}

  /** Register a new webhook endpoint. */
  async create(params: CreateWebhookParams): Promise<Webhook> {
    return apiFetch<Webhook>(this.apiKey, this.baseUrl, "/api-webhooks", {
      method: "POST",
      body: JSON.stringify({
        url: params.url,
        secret: params.secret,
        events: params.events,
      }),
    });
  }

  /** List all registered webhooks. */
  async list(): Promise<ListWebhooksResponse> {
    return apiFetch<ListWebhooksResponse>(
      this.apiKey,
      this.baseUrl,
      "/api-webhooks"
    );
  }

  /** Delete a webhook by ID. */
  async delete(id: string): Promise<{ deleted: boolean; id: string }> {
    return apiFetch(
      this.apiKey,
      this.baseUrl,
      `/api-webhooks?id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  }
}

// ─── Main TrustLink client ────────────────────────────────────────────────────

export class TrustLink {
  readonly escrows: EscrowsResource;
  readonly webhooks: WebhooksResource;

  constructor(config: TrustLinkConfig) {
    const baseUrl = config.baseUrl?.replace(/\/$/, "") ?? DEFAULT_BASE_URL;
    this.escrows = new EscrowsResource(config.apiKey, baseUrl);
    this.webhooks = new WebhooksResource(config.apiKey, baseUrl);
  }

  /**
   * Verify the HMAC-SHA256 signature on an incoming webhook request.
   *
   * @example
   * const isValid = await TrustLink.verifyWebhookSignature({
   *   payload: rawBodyString,
   *   signature: req.headers["x-trustlink-signature"],
   *   secret: process.env.WEBHOOK_SECRET,
   * });
   */
  static async verifyWebhookSignature({
    payload,
    signature,
    secret,
  }: {
    payload: string;
    signature: string;
    secret: string;
  }): Promise<boolean> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
    const hex = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const expected = `sha256=${hex}`;
    // Constant-time comparison to prevent timing attacks
    if (expected.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  }
}

export type {
  TrustLinkConfig,
  Escrow,
  CreateEscrowParams,
  ListEscrowsParams,
  ListEscrowsResponse,
  Webhook,
  CreateWebhookParams,
  ListWebhooksResponse,
};
export type { EscrowStatus, BlockchainChain, PayoutMethod, WebhookEvent } from "./types.js";

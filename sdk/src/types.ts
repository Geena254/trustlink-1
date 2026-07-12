export type EscrowStatus =
  | "pending"
  | "deposited"
  | "completed"
  | "cancelled"
  | "offramp_initiated"
  | "offramp_completed";

export type BlockchainChain = "base" | "avalanche" | "lisk";
export type PayoutMethod = "phone" | "paybill" | "till";
export type WebhookEvent =
  | "escrow.created"
  | "escrow.deposited"
  | "escrow.completed"
  | "offramp.initiated"
  | "offramp.completed";

// ─── Escrow ──────────────────────────────────────────────────────────────────

export interface Escrow {
  id: string;
  seller_id: string;
  amount: number;
  currency: string;
  chain: BlockchainChain;
  buyer_wallet?: string;
  seller_wallet: string;
  contract_address?: string;
  escrow_id_on_chain?: string;
  status: EscrowStatus;
  payout_method: PayoutMethod;
  mpesa_phone?: string;
  paybill?: string;
  till_number?: string;
  payment_url: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEscrowParams {
  amount: number;
  chain: BlockchainChain;
  sellerWallet: string;
  payoutMethod: PayoutMethod;
  /** Required when payoutMethod = 'phone'. Format: 254XXXXXXXXX */
  mpesaPhone?: string;
  /** Required when payoutMethod = 'paybill' */
  paybill?: string;
  /** Required when payoutMethod = 'till' */
  tillNumber?: string;
}

export interface ListEscrowsParams {
  status?: EscrowStatus;
  limit?: number;
  offset?: number;
}

export interface ListEscrowsResponse {
  data: Escrow[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Webhook ─────────────────────────────────────────────────────────────────

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  is_active: boolean;
  created_at: string;
  last_triggered_at?: string;
  failure_count: number;
}

export interface CreateWebhookParams {
  url: string;
  secret: string;
  events?: WebhookEvent[];
}

export interface ListWebhooksResponse {
  data: Webhook[];
}

// ─── SDK Config ──────────────────────────────────────────────────────────────

export interface TrustLinkConfig {
  apiKey: string;
  /** Override the base URL (useful for self-hosted deployments) */
  baseUrl?: string;
}

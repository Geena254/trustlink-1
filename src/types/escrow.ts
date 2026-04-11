export type EscrowStatus = 
  | 'pending' 
  | 'deposited' 
  | 'completed' 
  | 'cancelled' 
  | 'offramp_initiated' 
  | 'offramp_completed';

export type BlockchainChain = 'base' | 'avalanche' | 'lisk';

export type PayoutMethod = 'phone' | 'paybill' | 'till';

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
  mpesa_phone?: string;
  paybill?: string;
  till_number?: string;
  payout_method: PayoutMethod;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  mpesa_phone: string;
  paybill?: string;
  till_number?: string;
  is_subscriber: boolean;
  updated_at: string;
}
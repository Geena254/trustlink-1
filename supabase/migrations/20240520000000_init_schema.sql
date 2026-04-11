-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name TEXT,
  mpesa_phone TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create escrows table
CREATE TABLE IF NOT EXISTS public.escrows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'USDC' NOT NULL,
  chain TEXT NOT NULL, -- 'base', 'avalanche', 'lisk'
  buyer_wallet TEXT,
  seller_wallet TEXT NOT NULL,
  contract_address TEXT,
  escrow_id_on_chain TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'deposited', 'completed', 'cancelled', 'offramp_initiated', 'offramp_completed')),
  mpesa_phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrows ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Escrows Policies
CREATE POLICY "Users can view their own escrows." ON public.escrows
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Users can create their own escrows." ON public.escrows
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own escrows." ON public.escrows
  FOR UPDATE USING (auth.uid() = seller_id);

-- Anyone with the link (ID) can view escrow details (for buyers)
CREATE POLICY "Anyone can view escrow by ID." ON public.escrows
  FOR SELECT USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.escrows;
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { escrow_id } = await req.json()

    // 1. Fetch escrow record
    const { data: escrow, error: fetchError } = await supabaseClient
      .from('escrows')
      .select('*')
      .eq('id', escrow_id)
      .single()

    if (fetchError || !escrow) throw new Error('Escrow not found')

    // 2. In a real scenario, verify on-chain that funds are released to the bridge/our wallet
    // For this example, we assume the trigger is valid.
    
    // 3. Initiate M-Pesa B2C Payout (Using Daraja API mock logic)
    // You would call: https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest
    const mpesaResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('MPESA_ACCESS_TOKEN')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        InitiatorName: Deno.env.get('MPESA_INITIATOR_NAME'),
        SecurityCredential: Deno.env.get('MPESA_SECURITY_CREDENTIAL'),
        CommandID: 'BusinessPayment',
        Amount: escrow.amount, // Realistically, you'd calculate the KES exchange rate here
        PartyA: Deno.env.get('MPESA_SHORTCODE'),
        PartyB: escrow.mpesa_phone,
        Remarks: `Escrow payment for link ${escrow_id}`,
        QueueTimeOutURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`,
        ResultURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`,
        Occasion: 'Escrow Release'
      })
    })

    const mpesaResult = await mpesaResponse.json()

    // 4. Update escrow status to 'offramp_initiated'
    const { error: updateError } = await supabaseClient
      .from('escrows')
      .update({ status: 'offramp_initiated', updated_at: new Date() })
      .eq('id', escrow_id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ message: 'M-Pesa payout initiated', result: mpesaResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
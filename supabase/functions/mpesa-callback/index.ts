import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    console.log('M-Pesa Callback received:', payload)

    const result = payload.Result
    if (result.ResultCode === 0) {
      // Payment successful
      const escrowId = result.Remarks.split('link ')[1] // Simple parsing for this example
      const transactionId = result.TransactionID

      const { error } = await supabaseClient
        .from('escrows')
        .update({ 
          status: 'offramp_completed', 
          mpesa_transaction_id: transactionId, 
          updated_at: new Date() 
        })
        .eq('id', escrowId)

      if (error) throw error
    } else {
      console.error('M-Pesa Payout Failed:', result.ResultDesc)
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Error in M-Pesa Callback:', error.message)
    return new Response(error.message, { status: 500 })
  }
})
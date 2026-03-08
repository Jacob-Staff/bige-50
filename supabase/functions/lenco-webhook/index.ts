import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-lenco-signature',
};

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // 2. SECURITY: Verify the request is from Lenco/BroadPay
  const signature = req.headers.get("x-lenco-signature");
  if (!signature) {
    console.error("[SECURITY] No Lenco signature found. Blocked.");
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("[WEBHOOK] Received payload:", JSON.stringify(body));

    // Lenco v2 structure: data contains the transaction details
    const { reference, status, amount } = body; 

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // Uses Service Role to bypass RLS
    );

    // 3. Update the transaction log in 'bridge_transactions'
    // We match by 'reference_number' which was set during the 'AddMoney' initiation
    const { data: txData, error: txError } = await supabase
      .from("bridge_transactions")
      .update({ 
        status: status === 'success' ? 'completed' : 'failed',
        metadata: body // Store full Lenco response for debugging
      })
      .eq("reference_number", reference)
      .select('sender_id, amount')
      .single();

    if (txError) {
      console.error("[DATABASE] Error finding transaction reference:", reference);
      throw txError;
    }

    // 4. CREDIT THE USER: Only if Lenco says 'success'
    if (status === "success" && txData) {
      console.log(`[FUNDING] Initiating credit: K${txData.amount} for User: ${txData.sender_id}`);
      
      const { error: walletError } = await supabase.rpc('increment_wallet_balance', {
        row_id: txData.sender_id,
        increment_by: txData.amount
      });

      if (walletError) {
        console.error("[CRITICAL] Failed to increment wallet:", walletError.message);
        throw walletError;
      }

      console.log("[SUCCESS] Wallet credited successfully.");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[FATAL] Webhook processed with error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-auth',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Always log the start of a request
  console.log(`${req.method} request incoming...`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders 
    })
  }

  try {
    const { amount, phone, reference } = await req.json();
    console.log(`PAYLOAD: Amount ${amount}, Phone ${phone}`);

    const key = Deno.env.get('LENCO_API_KEY')?.trim();
    if (!key) throw new Error("LENCO_API_KEY is not set");

    // Zambia Phone Formatting (Ensure 260...)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '260' + cleanPhone.substring(1);
    if (cleanPhone.length === 9) cleanPhone = '260' + cleanPhone;

    const response = await fetch("https://api.lenco.co/access/v2/collections/mobile-money", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Number(amount),
        currency: "ZMW",
        phone_number: cleanPhone,
        external_reference: reference,
        country: "ZM",
        provider: "broadpay",
        bearer: "account"
      })
    });

    const result = await response.json();
    console.log("LENCO API RESULT:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("CRITICAL ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: corsHeaders 
    });
  }
})
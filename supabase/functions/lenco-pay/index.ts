import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { amount, userEmail, userId, phone } = await req.json()
    const key = Deno.env.get('LENCO_API_KEY')?.trim()

    // Clean phone for Zambia (260 format)
    let clean = phone.replace(/\D/g, '')
    if (clean.startsWith('0')) clean = '260' + clean.substring(1)
    
    // Broadpay v2 Zambia sometimes uses 'operator' and 'provider'
    let operator = "airtel"
    if (clean.startsWith('26096') || clean.startsWith('26076')) operator = "mtn"

    const response = await fetch("https://api.lenco.co/access/v2/collections/mobile-money", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Number(amount),
        currency: "ZMW",
        phone_number: clean, // Use 26097...
        external_reference: `BIGE-${userId}-${Date.now()}`,
        customer_email: userEmail,
        operator: operator,
        country: "ZM",
        provider: "broadpay",
        bearer: "account"
      })
    })

    const result = await response.json()
    console.log("FINAL ATTEMPT RESULT:", JSON.stringify(result))

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.status
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})
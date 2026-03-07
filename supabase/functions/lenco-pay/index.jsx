import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { amount, userEmail, userId } = await req.json()
    const apiKey = Deno.env.get('LENCO_API_KEY')?.trim()
    const baseUrl = Deno.env.get('LENCO_API_URL')?.trim() // Should be https://api.lenco.co

    // ENDPOINT: Create a Checkout Session
    const finalUrl = `${baseUrl}/access/v2/checkout/get-link`

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        currency: "ZMW",
        external_reference: `VAULT-${userId}-${Date.now()}`,
        customer_email: userEmail,
        // Where the user goes after paying
        redirect_url: "https://your-app.com/payment-success", 
        // Title shown on the payment page
        title: "Vault Institutional Upgrade"
      })
    })

    const data = await response.json()
    
    // data.data.url will contain the link to the payment page
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.status
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
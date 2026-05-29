import Stripe from "npm:stripe@^14.21.0";

// Ensure the apiVersion matches your older SDK package version
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bookingId, amount, paymentType, customerEmail, description } = await req.json()

    // Validate inputs
    if (!bookingId || !amount || !paymentType || !customerEmail) {
      throw new Error('Missing required fields')
    }

    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 })
    let customer
    if (customers.data.length > 0) {
      customer = customers.data[0]
    } else {
      customer = await stripe.customers.create({ email: customerEmail })
    }

    // Fallback for origin header if running locally or missing
    const origin = req.headers.get('origin') || 'http://localhost:3000'

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer: customer.id,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Camp Tiny Tails',
              description: description || 'Booking payment', // Fallback value
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId,
        paymentType,
      },
      success_url: `${origin}/account?booking=success`,
      cancel_url: `${origin}/booking`,
    })

    return new Response(
      JSON.stringify({ checkoutUrl: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  }
  catch (error) {
    console.error('Stripe error:', error.message, error)
    return new Response(
      JSON.stringify({ error: error.message, details: error.toString() }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }


})

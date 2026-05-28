import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body      = await req.text()
    const signature = req.headers.get('stripe-signature') ?? ''
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
      const session     = event.data.object
      const bookingId   = session.metadata?.bookingId
      const paymentType = session.metadata?.paymentType

      if (!bookingId) throw new Error('No booking ID in session metadata')

      const isPaidInFull = paymentType === 'full'

      const { error } = await supabase
        .from('bookings')
        .update({
          deposit_paid:             true,
          paid_in_full:             isPaidInFull,
          status:                   'confirmed',
          stripe_payment_intent_id: session.payment_intent,
          stripe_customer_id:       session.customer,
        })
        .eq('id', bookingId)

      if (error) throw error
    }

    if (event.type === 'checkout.session.expired') {
      const session   = event.data.object
      const bookingId = session.metadata?.bookingId
      if (bookingId) {
        await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', bookingId)
      }
    }

    // Invoice paid — mark balance paid
    if (event.type === 'invoice.paid') {
      const invoice   = event.data.object
      const bookingId = invoice.metadata?.bookingId
      if (bookingId) {
        await supabase
          .from('bookings')
          .update({
            balance_paid:    true,
            balance_paid_at: new Date().toISOString(),
          })
          .eq('id', bookingId)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

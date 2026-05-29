import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno&no-check'
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
    const { bookingId } = await req.json()
    if (!bookingId) throw new Error('Missing bookingId')

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`*, profiles(full_name, email), dogs(name)`)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) throw new Error('Booking not found')
    if (booking.paid_in_full) throw new Error('Booking already paid in full')
    if (booking.balance_paid) throw new Error('Balance already paid')

    const balanceDue = booking.subtotal - booking.deposit_amount
    if (balanceDue <= 0) throw new Error('No balance due')

    console.log('Booking found:', JSON.stringify({
      id: booking.id,
      subtotal: booking.subtotal,
      deposit_amount: booking.deposit_amount,
      paid_in_full: booking.paid_in_full,
      balance_paid: booking.balance_paid,
      stripe_customer_id: booking.stripe_customer_id,
      profile_email: booking.profiles?.email,
      dog_name: booking.dogs?.name
    }))
    console.log('Balance due:', balanceDue)

    const checkIn = new Date(booking.check_in + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const checkOut = new Date(booking.check_out + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const dogNames = booking.dogs?.name || 'your pup'
    const description = `Camp Tiny Tails Balance Due for ${dogNames} — ${checkIn} to ${checkOut}`

    const customerEmail = booking.profiles?.email
    if (!customerEmail) throw new Error('No customer email found')

    let customerId = booking.stripe_customer_id

    if (!customerId) {
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 })
      if (customers.data.length > 0) {
        customerId = customers.data[0].id
      } else {
        const customer = await stripe.customers.create({
          email: customerEmail,
          name: booking.profiles?.full_name || '',
        })
        customerId = customer.id
      }

      await supabase
        .from('bookings')
        .update({ stripe_customer_id: customerId })
        .eq('id', bookingId)
    }

    // 1. Create invoice FIRST
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 7,
      metadata: { bookingId },
      footer: 'Thank you for staying at Camp Tiny Tails! 🦴',
    })

    // 2. Create item attached to THAT specific invoice only
    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id, 
      amount: Math.round(balanceDue * 100),
      currency: 'usd',
      description,
    })

    // 3. Finalize
    await stripe.invoices.finalizeInvoice(invoice.id)

    return new Response(
      JSON.stringify({
        success: true,
        invoiceId: invoice.id,
        amount: balanceDue,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
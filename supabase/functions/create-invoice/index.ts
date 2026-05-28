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
    const { bookingId } = await req.json()
    if (!bookingId) throw new Error('Missing bookingId')

    // Fetch full booking details including dogs and profile
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles(full_name, email),
        dogs(name)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) throw new Error('Booking not found')
    if (booking.paid_in_full) throw new Error('Booking already paid in full')
    if (booking.balance_paid) throw new Error('Balance already paid')

    const balanceDue = booking.subtotal - booking.deposit_amount
    if (balanceDue <= 0) throw new Error('No balance due')

    // Format dates
    const checkIn  = new Date(booking.check_in + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const checkOut = new Date(booking.check_out + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    // Dog names
    const dogNames = booking.dogs?.name || 'your pup'

    // Invoice description
    const description = `Camp Tiny Tails Balance Due for ${dogNames} — ${checkIn} to ${checkOut}`

    // Get or create Stripe customer
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

      // Save customer ID to booking
      await supabase
        .from('bookings')
        .update({ stripe_customer_id: customerId })
        .eq('id', bookingId)
    }

    // Create invoice item
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: Math.round(balanceDue * 100),
      currency: 'usd',
      description,
    })

    // Create and send invoice automatically
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true,  // auto-finalize
      collection_method: 'send_invoice',
      days_until_due: 7,
      metadata: { bookingId },
      footer: 'Thank you for staying at Camp Tiny Tails! 🦴',
    })

    // Send it immediately
    await stripe.invoices.sendInvoice(invoice.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        invoiceId: invoice.id,
        invoiceUrl: invoice.hosted_invoice_url,
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

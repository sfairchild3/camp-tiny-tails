import Stripe from 'npm:stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey    = Deno.env.get('RESEND_API_KEY') ?? ''
  const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'hello@camptinytails.com'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    `Camp Tiny Tails <${fromEmail}>`,
      to:      [to],
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Resend error: ${error}`)
  }
  return res.json()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bookingId } = await req.json()
    if (!bookingId) throw new Error('Missing bookingId')

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`*, profiles(full_name, email), dogs(name)`)
      .eq('id', bookingId)
      .single()

    if (error || !booking) throw new Error('Booking not found')

    const siteUrl       = Deno.env.get('SITE_URL') ?? 'https://www.camptinytails.com'
    const customerEmail = booking.profiles?.email
    const customerName  = booking.profiles?.full_name

    // Get or create Stripe customer
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 })
    let customerId  = customers.data.length > 0 ? customers.data[0].id : null
    if (!customerId) {
      const customer = await stripe.customers.create({ email: customerEmail, name: customerName })
      customerId = customer.id
    }

    const checkIn  = new Date(booking.check_in  + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const checkOut = new Date(booking.check_out + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    // Create Stripe checkout session for deposit
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer: customerId,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Camp Tiny Tails — Deposit',
            description: `${booking.nights} night stay for ${booking.dogs?.name} · ${checkIn} to ${checkOut}`,
          },
          unit_amount: Math.round(booking.deposit_amount * 100),
        },
        quantity: 1,
      }],
      metadata: { bookingId, paymentType: 'deposit' },
      success_url: `${siteUrl}/account?booking=success`,
      cancel_url:  `${siteUrl}/account`,
    })

    // Update booking to approved with checkout URL
    await supabase
      .from('bookings')
      .update({ status: 'approved', stripe_checkout_url: session.url })
      .eq('id', bookingId)

    const firstName = customerName?.split(' ')[0] || 'there'

    const html = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: Arial, sans-serif; background: #F5EDD6; margin: 0; padding: 20px; }
  .card { background: white; border-radius: 12px; padding: 32px; max-width: 560px; margin: 0 auto; }
  h1 { font-size: 1.4rem; color: #2D5016; margin-bottom: 4px; }
  .badge { background: #7A9E5A; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; display: inline-block; margin-bottom: 20px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E8D5A3; font-size: 0.9rem; }
  .label { color: #888; }
  .value { font-weight: bold; color: #333; }
  .deposit { font-size: 1.2rem; color: #C4622D; font-weight: bold; }
  .btn { display: block; background: #C4622D; color: white; padding: 16px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 1rem; text-align: center; margin-top: 28px; }
  .note { font-size: 0.8rem; color: #aaa; margin-top: 10px; text-align: center; line-height: 1.5; }
  .footer { text-align: center; color: #aaa; font-size: 0.78rem; margin-top: 24px; }
</style>
</head>
<body>
<div class="card">
  <h1>🦴 Your Booking is Approved!</h1>
  <div class="badge">✅ Approved</div>

  <p style="color:#555;margin-bottom:20px;font-size:0.95rem">
    Great news, ${firstName}! Your booking request for <strong>${booking.dogs?.name}</strong> has been approved.
    Pay your deposit below to confirm your spot at camp.
  </p>

  <div class="row"><span class="label">Dog</span><span class="value">${booking.dogs?.name}</span></div>
  <div class="row"><span class="label">Check-in</span><span class="value">${checkIn}</span></div>
  <div class="row"><span class="label">Check-out</span><span class="value">${checkOut}</span></div>
  <div class="row"><span class="label">Nights</span><span class="value">${booking.nights}${booking.discount_applied ? ' · 10% discount 🎉' : ''}</span></div>
  <div class="row"><span class="label">Total Stay</span><span class="value">$${booking.subtotal?.toFixed(2)}</span></div>
  <div class="row"><span class="label">Deposit Due Now</span><span class="value deposit">$${booking.deposit_amount?.toFixed(2)}</span></div>
  <div class="row"><span class="label">Balance Due at Pickup</span><span class="value">$${(booking.subtotal - booking.deposit_amount).toFixed(2)}</span></div>

  <a href="${session.url}" class="btn">Pay $${booking.deposit_amount?.toFixed(2)} Deposit to Confirm →</a>

  <p class="note">
    Free cancellation anytime · Secure payment via Stripe<br>
    This link expires in 24 hours. If it expires, log into your account at
    <a href="${siteUrl}/account">${siteUrl}</a> to contact us for a new one.
  </p>
</div>
<div class="footer">
  Camp Tiny Tails · Alameda, California ·
  <a href="${siteUrl}/privacy-policy.html">Privacy Policy</a>
</div>
</body>
</html>`

    await sendEmail({
      to:      customerEmail,
      subject: `🦴 Your Camp Tiny Tails booking is approved — pay your deposit to confirm!`,
      html,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('send-approval error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

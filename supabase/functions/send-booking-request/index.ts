import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from './resend.ts'

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

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`*, profiles(full_name, email, phone), dogs(name, breed, weight)`)
      .eq('id', bookingId)
      .single()

    if (error || !booking) throw new Error('Booking not found')

    const adminEmail = Deno.env.get('ADMIN_EMAIL') ?? ''
    const siteUrl   = Deno.env.get('SITE_URL') ?? 'https://www.camptinytails.com'

    const checkIn  = new Date(booking.check_in  + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    const checkOut = new Date(booking.check_out + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

    const html = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: Arial, sans-serif; background: #F5EDD6; margin: 0; padding: 20px; }
  .card { background: white; border-radius: 12px; padding: 32px; max-width: 560px; margin: 0 auto; }
  h1 { font-size: 1.4rem; color: #2D5016; margin-bottom: 4px; }
  .badge { background: #D4943A; color: #2D5016; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; display: inline-block; margin-bottom: 24px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E8D5A3; font-size: 0.9rem; }
  .label { color: #888; }
  .value { font-weight: bold; color: #333; }
  .price { font-size: 1.1rem; color: #C4622D; }
  .buttons { display: flex; gap: 12px; margin-top: 28px; flex-wrap: wrap; }
  .btn-approve { background: #2D5016; color: white; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 0.9rem; display: inline-block; }
  .btn-decline { background: #f5f5f5; color: #666; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 0.9rem; display: inline-block; }
  .footer { text-align: center; color: #aaa; font-size: 0.78rem; margin-top: 24px; }
</style>
</head>
<body>
<div class="card">
  <h1>🦴 New Booking Request</h1>
  <div class="badge">Pending Your Approval</div>

  <div class="row"><span class="label">Client</span><span class="value">${booking.profiles?.full_name}</span></div>
  <div class="row"><span class="label">Email</span><span class="value">${booking.profiles?.email}</span></div>
  <div class="row"><span class="label">Phone</span><span class="value">${booking.profiles?.phone || 'Not provided'}</span></div>
  <div class="row"><span class="label">Dog</span><span class="value">${booking.dogs?.name} (${booking.dogs?.breed}${booking.dogs?.weight ? ', ' + booking.dogs.weight + 'lbs' : ''})</span></div>
  <div class="row"><span class="label">Check-in</span><span class="value">${checkIn}</span></div>
  <div class="row"><span class="label">Check-out</span><span class="value">${checkOut}</span></div>
  <div class="row"><span class="label">Nights</span><span class="value">${booking.nights}${booking.discount_applied ? ' · 10% discount applied 🎉' : ''}</span></div>
  <div class="row"><span class="label">Total</span><span class="value price">$${booking.subtotal?.toFixed(2)}</span></div>

  <div class="buttons">
    <a href="${siteUrl}/admin" class="btn-approve">✅ Go to Admin Dashboard</a>
  </div>
  <p style="font-size:0.82rem;color:#aaa;margin-top:12px">Approve or decline from your <a href="${siteUrl}/admin">admin dashboard</a>.</p>
</div>
<div class="footer">Camp Tiny Tails · Alameda, California</div>
</body>
</html>`

    await sendEmail({
      to:      adminEmail,
      subject: `🦴 New Booking Request — ${booking.profiles?.full_name} (${booking.nights} nights)`,
      html,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('send-booking-request error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { bookingId, reason } = await req.json()
    if (!bookingId) throw new Error('Missing bookingId')

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`*, profiles(full_name, email), dogs(name)`)
      .eq('id', bookingId)
      .single()

    if (error || !booking) throw new Error('Booking not found')

    const siteUrl       = Deno.env.get('SITE_URL') ?? 'https://www.camptinytails.com'
    const customerEmail = booking.profiles?.email
    const firstName     = booking.profiles?.full_name?.split(' ')[0] || 'there'

    const checkIn  = new Date(booking.check_in  + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const checkOut = new Date(booking.check_out + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    const reasonBlock = reason
      ? `<div style="background:#fff8f0;border-left:4px solid #C4622D;padding:14px 16px;border-radius:0 8px 8px 0;margin:20px 0;font-size:0.9rem;color:#555">
           <strong>Message from Camp Tiny Tails:</strong><br>${reason}
         </div>`
      : ''

    const html = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: Arial, sans-serif; background: #F5EDD6; margin: 0; padding: 20px; }
  .card { background: white; border-radius: 12px; padding: 32px; max-width: 560px; margin: 0 auto; }
  h1 { font-size: 1.4rem; color: #2D5016; margin-bottom: 4px; }
  .badge { background: #aaa; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; display: inline-block; margin-bottom: 20px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E8D5A3; font-size: 0.9rem; }
  .label { color: #888; }
  .value { font-weight: bold; color: #333; }
  .btn { display: block; background: #2D5016; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 0.95rem; text-align: center; margin-top: 24px; }
  .footer { text-align: center; color: #aaa; font-size: 0.78rem; margin-top: 24px; }
</style>
</head>
<body>
<div class="card">
  <h1>🦴 Camp Tiny Tails</h1>
  <div class="badge">Booking Request Update</div>

  <p style="color:#555;margin-bottom:16px;font-size:0.95rem">
    Hi ${firstName}, thank you so much for your interest in Camp Tiny Tails!
    Unfortunately we're unable to accommodate your request for the following dates:
  </p>

  <div class="row"><span class="label">Dog</span><span class="value">${booking.dogs?.name}</span></div>
  <div class="row"><span class="label">Check-in</span><span class="value">${checkIn}</span></div>
  <div class="row"><span class="label">Check-out</span><span class="value">${checkOut}</span></div>

  ${reasonBlock}

  <p style="color:#555;font-size:0.9rem;margin-top:16px;line-height:1.6">
    We'd love to have <strong>${booking.dogs?.name}</strong> at camp another time!
    You're welcome to log into your account and submit a request for different dates.
  </p>

  <a href="${siteUrl}/booking" class="btn">Check Available Dates →</a>
</div>
<div class="footer">
  Camp Tiny Tails · Alameda, California ·
  <a href="${siteUrl}/privacy-policy.html">Privacy Policy</a>
</div>
</body>
</html>`

    // Update booking status and save decline reason
    await supabase
      .from('bookings')
      .update({ status: 'declined', decline_reason: reason || null })
      .eq('id', bookingId)

    await sendEmail({
      to:      customerEmail,
      subject: `Camp Tiny Tails — Update on your booking request`,
      html,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('send-decline error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

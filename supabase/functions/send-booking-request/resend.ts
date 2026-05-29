// Shared email sender using Resend HTTP API
// Used by all three edge functions

export async function sendEmail({
  to,
  subject,
  html,
  fromName = 'Camp Tiny Tails',
}: {
  to: string
  subject: string
  html: string
  fromName?: string
}) {
  const apiKey  = Deno.env.get('RESEND_API_KEY') ?? ''
  const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'hello@camptinytails.com'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    `${fromName} <${fromEmail}>`,
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

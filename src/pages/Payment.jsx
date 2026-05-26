import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './Payment.css'

export default function Payment() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const { booking, summary } = location.state || {}

  const [paymentChoice, setPaymentChoice] = useState('deposit') // deposit | full
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (!booking || !summary) { navigate('/booking'); return }
  }, [user, booking, summary])

  const amountToPay = paymentChoice === 'full'
    ? summary?.subtotal
    : summary?.depositAmount

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      // Call Supabase Edge Function to create Stripe payment intent
      const { data, error: fnError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          bookingId: booking.id,
          amount: amountToPay,
          paymentType: paymentChoice, // 'deposit' or 'full'
          customerEmail: user.email,
          description: `Camp Tiny Tails — ${summary.nights} night${summary.nights > 1 ? 's' : ''} ${paymentChoice === 'full' ? '(Paid in Full)' : '(Deposit)'}`,
        }
      })

      if (fnError) throw fnError

      // Redirect to Stripe hosted checkout
      window.location.href = data.checkoutUrl

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleBack = async () => {
    // Cancel the pending booking so dates are freed up
    await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking.id)

    navigate('/booking', {
      state: {
        checkIn: booking.check_in,
        checkOut: booking.check_out
      }
    })
  }

  if (!booking || !summary) return null

  return (
    <div className="payment-wrap">
      <div className="payment-card">
        <div className="payment-logo">🦴</div>
        <h1 className="payment-title">Complete Your Booking</h1>
        <p className="payment-sub">You're almost there! Choose how you'd like to pay.</p>

        {/* Booking summary */}
        <div className="payment-booking-summary">
          <div className="pbs-row">
            <span>Check-in</span>
            <strong>{new Date(booking.check_in + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
          </div>
          <div className="pbs-row">
            <span>Check-out</span>
            <strong>{new Date(booking.check_out + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
          </div>
          <div className="pbs-divider" />
          <div className="pbs-row">
            <span>{summary.nights} night{summary.nights > 1 ? 's' : ''} × ${summary.nightlyRate}/night</span>
            <span>${(summary.nightlyRate * summary.nights).toFixed(2)}</span>
          </div>
          {summary.discountApplied && (
            <div className="pbs-row discount">
              <span>🎉 10% discount</span>
              <span>-${((summary.nightlyRate * summary.nights) - summary.subtotal).toFixed(2)}</span>
            </div>
          )}
          <div className="pbs-row total">
            <span>Total</span>
            <strong>${summary.subtotal.toFixed(2)}</strong>
          </div>
        </div>

        {/* Payment choice */}
        <div className="payment-options">
          <div
            className={`payment-option ${paymentChoice === 'deposit' ? 'selected' : ''}`}
            onClick={() => setPaymentChoice('deposit')}
          >
            <div className="po-radio">
              <div className={`po-radio-dot ${paymentChoice === 'deposit' ? 'active' : ''}`} />
            </div>
            <div className="po-info">
              <div className="po-title">Pay Deposit Now</div>
              <div className="po-desc">Hold your spot with a $50 deposit. Balance of ${summary.balanceDue.toFixed(2)} due at pickup.</div>
            </div>
            <div className="po-amount">${summary.depositAmount}</div>
          </div>

          <div
            className={`payment-option ${paymentChoice === 'full' ? 'selected' : ''}`}
            onClick={() => setPaymentChoice('full')}
          >
            <div className="po-radio">
              <div className={`po-radio-dot ${paymentChoice === 'full' ? 'active' : ''}`} />
            </div>
            <div className="po-info">
              <div className="po-title">Pay in Full</div>
              <div className="po-desc">Pay the full amount now. Nothing due at pickup!</div>
              {summary.discountApplied && (
                <div className="po-badge">🎉 Includes 10% discount</div>
              )}
            </div>
            <div className="po-amount">${summary.subtotal.toFixed(2)}</div>
          </div>
        </div>

        {/* Policies */}
        <div className="payment-policies">
          <div className="policy-item">✅ Free cancellation anytime</div>
          <div className="policy-item">🔒 Secure payment via Stripe</div>
          <div className="policy-item">✉️ Receipt sent to {user?.email}</div>
        </div>

        {error && <div className="payment-error">{error}</div>}

        <button
          className="btn-pay"
          onClick={handlePayment}
          disabled={loading}
        >
          {loading
            ? 'Redirecting to payment...'
            : `Pay $${amountToPay?.toFixed(2)} securely →`}
        </button>

        <button className="btn-back" onClick={handleBack} disabled={loading}>
          ← Back to booking
        </button>
      </div>
    </div>
  )
}

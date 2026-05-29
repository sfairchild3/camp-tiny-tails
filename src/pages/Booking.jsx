import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { calculateBooking, BASE_NIGHTLY_RATE, EXTRA_DOG_RATE } from '../lib/stripe'
import { useAuth } from '../lib/AuthContext'
import './Booking.css'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function Booking() {
  const { user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [blockedDates, setBlockedDates]   = useState([])
  const [bookedDates, setBookedDates]     = useState([])
  const [checkIn, setCheckIn]             = useState(null)
  const [checkOut, setCheckOut]           = useState(null)
  const [selecting, setSelecting]         = useState('checkin')
  const [currentMonth, setCurrentMonth]   = useState(new Date())
  const [summary, setSummary]             = useState(null)
  const [loading, setLoading]             = useState(false)
  const [success, setSuccess]             = useState(false)
  const [error, setError]                 = useState('')
  const [dogs, setDogs]                   = useState([])
  const [selectedDogs, setSelectedDogs]   = useState([])
  const [customRate, setCustomRate]       = useState(null) // null = standard rate

  useEffect(() => { fetchUnavailableDates() }, [])

  useEffect(() => {
    if (user) {
      fetchUserDogs()
      fetchCustomRate()
    }
  }, [user])

  useEffect(() => {
    if (checkIn && checkOut) {
      const rate = customRate ?? BASE_NIGHTLY_RATE
      const dogCount = selectedDogs.length || 1
      setSummary(calculateBooking(checkIn, checkOut, dogCount, rate))
    } else {
      setSummary(null)
    }
  }, [checkIn, checkOut, selectedDogs, customRate])

  const fetchCustomRate = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('custom_nightly_rate')
      .eq('id', user.id)
      .single()
    if (data?.custom_nightly_rate) {
      setCustomRate(data.custom_nightly_rate)
    }
  }

  const fetchUnavailableDates = async () => {
    const { data: blocked } = await supabase.from('blocked_dates').select('date')
    setBlockedDates(blocked?.map(b => b.date) || [])

    const { data: bookings } = await supabase
      .from('bookings')
      .select('check_in, check_out')
      .in('status', ['confirmed', 'pending_approval', 'approved'])

    const dates = []
    bookings?.forEach(b => {
      const start = new Date(b.check_in)
      const end   = new Date(b.check_out)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0])
      }
    })
    setBookedDates(dates)
  }

  const fetchUserDogs = async () => {
    const { data } = await supabase
      .from('dogs')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })
    setDogs(data || [])
    if (data && data.length > 0) setSelectedDogs([data[0].id])
  }

  const toggleDog = (dogId) => {
    setSelectedDogs(prev => {
      if (prev.includes(dogId)) {
        if (prev.length === 1) return prev
        return prev.filter(id => id !== dogId)
      }
      return [...prev, dogId]
    })
  }

  const isUnavailable = (date) => {
    const s = date.toISOString().split('T')[0]
    return blockedDates.includes(s) || bookedDates.includes(s)
  }

  const isPast = (date) => {
    const today = new Date(); today.setHours(0,0,0,0)
    return date < today
  }

  const isInRange  = (date) => { if (!checkIn || !checkOut) return false; const d = date.toISOString().split('T')[0]; return d > checkIn && d < checkOut }
  const isCheckIn  = (date) => checkIn  === date.toISOString().split('T')[0]
  const isCheckOut = (date) => checkOut === date.toISOString().split('T')[0]

  const handleDateClick = (date) => {
    if (isPast(date) || isUnavailable(date)) return
    const dateStr = date.toISOString().split('T')[0]

    if (selecting === 'checkin') {
      setCheckIn(dateStr)
      setCheckOut(null)
      setSelecting('checkout')
    } else {
      if (dateStr <= checkIn) {
        setCheckIn(dateStr)
        setCheckOut(null)
        return
      }

      // Check for conflicts in the selected range
      const start = new Date(checkIn)
      const end   = new Date(dateStr)
      let hasConflict = false
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (isUnavailable(d)) { hasConflict = true; break }
      }

      if (hasConflict) {
        setError('Your selected dates overlap an existing booking or unavailable date. Please choose different dates.')
        setCheckIn(null)
        setCheckOut(null)
        setSelecting('checkin')
        return
      }

      setError('')
      setCheckOut(dateStr)
      setSelecting('checkin')
    }
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear(), month = date.getMonth()
    return {
      firstDay:    new Date(year, month, 1).getDay(),
      daysInMonth: new Date(year, month + 1, 0).getDate(),
      year, month
    }
  }

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  const handleSubmitRequest = async () => {
    if (!user) { navigate('/login', { state: { from: '/booking' } }); return }
    if (!checkIn || !checkOut || !summary) return

    setLoading(true)
    setError('')

    try {
      if (dogs.length === 0) {
        navigate('/account', { state: { setupDog: true, checkIn, checkOut } })
        return
      }

      const bookedDogIds = selectedDogs.length > 0 ? selectedDogs : [dogs[0].id]

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          client_id:        user.id,
          dog_id:           bookedDogIds[0],
          dog_count:        bookedDogIds.length,
          check_in:         checkIn,
          check_out:        checkOut,
          nights:           summary.nights,
          nightly_rate:     summary.nightlyRate,
          discount_applied: summary.discountApplied,
          subtotal:         summary.subtotal,
          deposit_amount:   summary.depositAmount,
          status:           'pending_approval',
          custom_rate:      customRate ?? null,
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      await supabase.functions.invoke('send-booking-request', {
        body: { bookingId: booking.id }
      })

      setSuccess(true)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const { firstDay, daysInMonth, year, month } = getDaysInMonth(currentMonth)
  const effectiveRate = customRate ?? BASE_NIGHTLY_RATE

  if (success) {
    return (
      <div className="booking-wrap">
        <div className="container">
          <div className="booking-success">
            <div className="success-icon">🦴</div>
            <h2>Request Sent!</h2>
            <p>Your booking request has been sent to Camp Tiny Tails. You'll receive an email once your request is reviewed — usually within 24 hours.</p>
            <p className="success-sub">If approved you'll receive a link to pay your deposit and confirm your spot.</p>
            <button onClick={() => navigate('/account')} className="btn-primary">View My Bookings</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-wrap">
      <div className="container">
        <div className="booking-header">
          <span className="section-label">Reserve Your Spot</span>
          <h1 className="section-title">Request a Stay at Camp</h1>
          <p className="section-body">
            Select your dates and submit a booking request. We'll review it and send you a
            payment link within 24 hours if approved.
            {!customRate && ` Stays of 5+ nights get 10% off. Bringing a second dog? Just `}
            {!customRate && <strong>+${EXTRA_DOG_RATE}/night</strong>}
            {!customRate && `!`}
          </p>
          {customRate && (
            <div className="custom-rate-badge">
              🦴 Your loyalty rate: <strong>${customRate}/night</strong>
            </div>
          )}
        </div>

        <div className="booking-layout">
          {/* Calendar */}
          <div className="calendar-card">
            <div className="cal-nav">
              <button onClick={prevMonth} className="cal-nav-btn">←</button>
              <span className="cal-month">{MONTHS[month]} {year}</span>
              <button onClick={nextMonth} className="cal-nav-btn">→</button>
            </div>

            <div className="cal-instruction">
              {selecting === 'checkin' ? '📅 Select check-in date' : '📅 Select check-out date'}
            </div>

            <div className="cal-grid">
              {DAYS.map(d => <div key={d} className="cal-day-label">{d}</div>)}
              {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
              {Array(daysInMonth).fill(null).map((_, i) => {
                const date    = new Date(year, month, i + 1)
                const past    = isPast(date)
                const unavail = isUnavailable(date)
                const inRange = isInRange(date)
                const isCI    = isCheckIn(date)
                const isCO    = isCheckOut(date)
                return (
                  <button
                    key={i}
                    className={`cal-date ${past?'past':''} ${unavail?'unavailable':''} ${inRange?'in-range':''} ${isCI?'check-in':''} ${isCO?'check-out':''}`}
                    onClick={() => handleDateClick(date)}
                    disabled={past || unavail}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>

            <div className="cal-legend">
              <div className="legend-item"><span className="dot available" />Available</div>
              <div className="legend-item"><span className="dot unavailable-dot" />Unavailable</div>
              <div className="legend-item"><span className="dot selected" />Selected</div>
            </div>

            {user && dogs.length > 0 && (
              <div className="dog-selector">
                <div className="dog-selector-title">Which dog(s) are coming?</div>
                {dogs.map(dog => (
                  <label key={dog.id} className="dog-checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedDogs.includes(dog.id)}
                      onChange={() => toggleDog(dog.id)}
                    />
                    <span className="dog-checkbox-info">
                      <strong>{dog.name}</strong>
                      <span>{dog.breed}{dog.weight ? ` · ${dog.weight}lbs` : ''}</span>
                    </span>
                    {selectedDogs.includes(dog.id) && dogs.length > 1 && (
                      <span className="dog-rate">
                        {selectedDogs.indexOf(dog.id) === 0
                          ? `$${effectiveRate}/night`
                          : `+$${EXTRA_DOG_RATE}/night`}
                      </span>
                    )}
                  </label>
                ))}
                {dogs.length < 2 && (
                  <button
                    className="btn-add-dog-link"
                    onClick={() => navigate('/account', { state: { setupDog: true } })}
                  >
                    + Add another dog to your profile
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="summary-card">
            <h3>Booking Summary</h3>

            {!checkIn && !checkOut && (
              <p className="summary-prompt">Select your dates on the calendar to see pricing.</p>
            )}

            {checkIn && (
              <div className="summary-row">
                <span>Check-in</span>
                <strong>{new Date(checkIn + 'T12:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}</strong>
              </div>
            )}
            {checkOut && (
              <div className="summary-row">
                <span>Check-out</span>
                <strong>{new Date(checkOut + 'T12:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}</strong>
              </div>
            )}

            {summary && (
              <>
                <div className="summary-divider" />

                {customRate && (
                  <div className="summary-row legacy-rate">
                    <span>🦴 Your loyalty rate</span>
                    <span>${customRate}/night</span>
                  </div>
                )}

                <div className="summary-row">
                  <span>${summary.nightlyRate}/night × {summary.nights} nights</span>
                  <span>${(summary.nightlyRate * summary.nights).toFixed(2)}</span>
                </div>

                {summary.dogCount > 1 && (
                  <div className="summary-row dog-extra">
                    <span>🦴 2nd dog included</span>
                  </div>
                )}

                {summary.discountApplied && (
                  <div className="summary-row discount">
                    <span>🎉 10% discount (5+ nights)</span>
                    <span>-${((summary.nightlyRate * summary.nights) - summary.subtotal).toFixed(2)}</span>
                  </div>
                )}

                <div className="summary-row total">
                  <span>Total</span>
                  <strong>${summary.subtotal.toFixed(2)}</strong>
                </div>

                <div className="summary-divider" />

                <div className="summary-row deposit">
                  <span>Deposit (if approved)</span>
                  <strong>${summary.depositAmount}</strong>
                </div>
                <div className="summary-row">
                  <span>Balance due at pickup</span>
                  <span>${summary.balanceDue.toFixed(2)}</span>
                </div>

                <div className="summary-policy">
                  📋 We'll review your request within 24 hours
                </div>
              </>
            )}

            {error && <div className="summary-error">{error}</div>}

            <button
              className="btn-book"
              onClick={handleSubmitRequest}
              disabled={!checkIn || !checkOut || !summary || loading || authLoading}
            >
              {loading
                ? 'Submitting request...'
                : user
                  ? 'Submit Booking Request →'
                  : 'Log In to Request →'}
            </button>

            {!user && (
              <p className="summary-login-note">
                You'll need an account to request a booking.{' '}
                <button onClick={() => navigate('/login', { state: { from: '/booking' } })} className="link-btn">
                  Log in or sign up
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

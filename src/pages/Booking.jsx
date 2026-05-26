import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { calculateBooking, BASE_NIGHTLY_RATE, EXTRA_DOG_RATE } from '../lib/stripe'
import { useAuth } from '../lib/AuthContext'
import './Booking.css'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']



export default function Booking() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [blockedDates, setBlockedDates] = useState([])
  const [bookedDates, setBookedDates] = useState([])
  const [selecting, setSelecting] = useState('checkin')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkIn, setCheckIn] = useState(location.state?.checkIn || null)
  const [checkOut, setCheckOut] = useState(location.state?.checkOut || null)


  // Dog selection
  const [dogs, setDogs] = useState([])
  const [selectedDogs, setSelectedDogs] = useState([])

  useEffect(() => { fetchUnavailableDates() }, [])

  useEffect(() => {
    if (user) fetchUserDogs()
  }, [user])

  useEffect(() => {
    if (checkIn && checkOut) {
      setSummary(calculateBooking(checkIn, checkOut, selectedDogs.length || 1))
    } else {
      setSummary(null)
    }
  }, [checkIn, checkOut, selectedDogs])

  const fetchUnavailableDates = async () => {
    const { data: blocked } = await supabase
      .from('blocked_dates')
      .select('date')
    setBlockedDates(blocked?.map(b => b.date) || [])

    const { data: bookings } = await supabase
      .from('bookings')
      .select('check_in, check_out')
      .in('status', ['confirmed', 'pending'])

    const dates = []
    bookings?.forEach(b => {
      const start = new Date(b.check_in)
      const end = new Date(b.check_out)
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
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
    // Auto-select the first dog
    if (data && data.length > 0) setSelectedDogs([data[0].id])
  }

  const toggleDog = (dogId) => {
    setSelectedDogs(prev => {
      if (prev.includes(dogId)) {
        // Don't allow deselecting if it's the only one selected
        if (prev.length === 1) return prev
        return prev.filter(id => id !== dogId)
      } else {
        return [...prev, dogId]
      }
    })
  }

  const isUnavailable = (date) => {
    const s = date.toISOString().split('T')[0]
    return blockedDates.includes(s) || bookedDates.includes(s)
  }

  const isPast = (date) => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return date < today
  }

  const isInRange = (date) => { if (!checkIn || !checkOut) return false; const d = date.toISOString().split('T')[0]; return d > checkIn && d < checkOut }
  const isCheckIn = (date) => checkIn === date.toISOString().split('T')[0]
  const isCheckOut = (date) => checkOut === date.toISOString().split('T')[0]

  const handleDateClick = (date) => {
    if (isPast(date) || isUnavailable(date)) return
    const dateStr = date.toISOString().split('T')[0]
    if (selecting === 'checkin') {
      setCheckIn(dateStr); setCheckOut(null); setSelecting('checkout')
    } else {
      if (dateStr <= checkIn) { setCheckIn(dateStr); setCheckOut(null) }
      else { setCheckOut(dateStr); setSelecting('checkin') }
    }
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear(), month = date.getMonth()
    return {
      firstDay: new Date(year, month, 1).getDay(),
      daysInMonth: new Date(year, month + 1, 0).getDate(),
      year, month
    }
  }

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  const handleBook = async () => {
    if (!user) { navigate('/login', { state: { from: '/booking' } }); return }
    if (!checkIn || !checkOut || !summary) return

    setLoading(true); setError('')

    try {
      if (dogs.length === 0) {
        navigate('/account', { state: { setupDog: true, checkIn, checkOut } })
        return
      }

      const bookedDogIds = selectedDogs.length > 0 ? selectedDogs : [dogs[0].id]

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          client_id: user.id,
          dog_id: bookedDogIds[0],
          dog_count: bookedDogIds.length,
          check_in: checkIn,
          check_out: checkOut,
          nights: summary.nights,
          nightly_rate: summary.nightlyRate,
          discount_applied: summary.discountApplied,
          subtotal: summary.subtotal,
          deposit_amount: summary.depositAmount,
          status: 'pending',
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      navigate('/payment', { state: { booking, summary } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const { firstDay, daysInMonth, year, month } = getDaysInMonth(currentMonth)

  return (
    <div className="booking-wrap">
      <div className="container">
        <div className="booking-header">
          <span className="section-label">Reserve Your Spot</span>
          <h1 className="section-title">Book a Stay at Camp</h1>
          <p className="booking-section-body">
            Select your check-in and check-out dates. Stays of 5+ nights get 10% off automatically.
            Bringing a second dog? Just <strong>+${EXTRA_DOG_RATE}/night</strong>!
          </p>
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
                const date = new Date(year, month, i + 1)
                const past = isPast(date)
                const unavail = isUnavailable(date)
                const inRange = isInRange(date)
                const isCI = isCheckIn(date)
                const isCO = isCheckOut(date)
                return (
                  <button
                    key={i}
                    className={`cal-date ${past ? 'past' : ''} ${unavail ? 'unavailable' : ''} ${inRange ? 'in-range' : ''} ${isCI ? 'check-in' : ''} ${isCO ? 'check-out' : ''}`}
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

            {/* Dog selector — only shown when logged in and has dogs */}
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
                          ? `$${BASE_NIGHTLY_RATE}/night`
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
                <strong>{new Date(checkIn + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
              </div>
            )}
            {checkOut && (
              <div className="summary-row">
                <span>Check-out</span>
                <strong>{new Date(checkOut + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
              </div>
            )}

            {summary && (
              <>
                <div className="summary-divider" />

                <div className="summary-row">
                  <span>${summary.nightlyRate}/night × {summary.nights} nights</span>
                  <span>${(summary.nightlyRate * summary.nights).toFixed(2)}</span>
                </div>

                {summary.dogCount > 1 && (
                  <div className="summary-row dog-extra">
                    <span>🦴 2nd dog (+${EXTRA_DOG_RATE}/night included)</span>
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
                  <span>Deposit due now</span>
                  <strong>${summary.depositAmount}</strong>
                </div>
                <div className="summary-row">
                  <span>Balance due at checkout</span>
                  <span>${summary.balanceDue.toFixed(2)}</span>
                </div>

                <div className="summary-policy">✅ Free cancellation anytime</div>
              </>
            )}

            {error && <div className="summary-error">{error}</div>}

            <button
              className="btn-book"
              onClick={handleBook}
              disabled={!checkIn || !checkOut || !summary || loading}
            >
              {loading ? 'Setting up...' : user ? 'Continue to Payment →' : 'Log In to Book →'}
            </button>

            {!user && (
              <p className="summary-login-note">
                You'll need an account to complete your booking.{' '}
                <button onClick={() => navigate('/login')} className="link-btn">Log in or sign up</button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

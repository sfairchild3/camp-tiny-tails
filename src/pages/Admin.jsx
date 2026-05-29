import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './Admin.css'
import AdminCalendar from '../components/AdminCalendar'

const ADMIN_EMAIL = 'stay@camptinytails.com' // 👈 your email

export default function Admin() {
  const { user, signOut, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [clients, setClients] = useState([])
  const [blockedDates, setBlockedDates] = useState([])
  const [tab, setTab] = useState('Bookings')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Block date range
  const [blockFrom, setBlockFrom] = useState('')
  const [blockTo, setBlockTo] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blocking, setBlocking] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }
    if (user.email !== ADMIN_EMAIL) { navigate('/'); return }
    fetchAll()
  }, [user, authLoading])

  const fetchAll = async () => {
    setLoading(true)

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select(`*, profiles(full_name, email, phone), dogs(name, breed)`)
      .order('check_in', { ascending: true })
    setBookings(bookingsData || [])

    const { data: clientsData } = await supabase
      .from('profiles')
      .select(`*, dogs(*)`)
      .order('created_at', { ascending: false })
    setClients(clientsData || [])

    const { data: blockedData } = await supabase
      .from('blocked_dates')
      .select('*')
      .order('date', { ascending: true })
    setBlockedDates(blockedData || [])

    setLoading(false)
  }

  const updateBookingStatus = async (id, status) => {
    setError('')
    setMessage('')

    // When completing a deposit-only booking → send invoice automatically
    if (status === 'completed') {
      const booking = bookings.find(b => b.id === id)
      if (booking && !booking.paid_in_full && !booking.balance_paid) {
        const { error: fnError } = await supabase.functions.invoke('create-invoice', {
          body: { bookingId: id }
        })
        if (fnError) {
          setError(`Could not send invoice: ${fnError.message}`)
          return
        }
        setMessage('Booking completed and invoice sent to client! 🦴')
      }
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)

    if (!error) {
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b))
      if (status !== 'completed') setMessage(`Booking ${status}.`)
    }
  }

  // ── BLOCK DATE RANGE ──────────────────────────────
  const addBlockedRange = async () => {
    if (!blockFrom) { setMessage('Please select a start date.'); return }
    setBlocking(true)
    setMessage('')

    const end = blockTo || blockFrom  // if no end, just block one day
    const start = new Date(blockFrom)
    const stop = new Date(end)
    const rows = []

    for (let d = new Date(start); d <= stop; d.setDate(d.getDate() + 1)) {
      rows.push({
        date: d.toISOString().split('T')[0],
        reason: blockReason || 'Unavailable',
      })
    }

    // Upsert so duplicates don't error
    const { error } = await supabase
      .from('blocked_dates')
      .upsert(rows, { onConflict: 'date' })

    if (!error) {
      const count = rows.length
      setMessage(`${count} date${count > 1 ? 's' : ''} blocked successfully.`)
      setBlockFrom('')
      setBlockTo('')
      setBlockReason('')
      fetchAll()
    } else {
      setMessage(`Error: ${error.message}`)
    }
    setBlocking(false)
  }

  const removeBlockedDate = async (id) => {
    await supabase.from('blocked_dates').delete().eq('id', id)
    setBlockedDates(blockedDates.filter(d => d.id !== id))
    setMessage('Date unblocked.')
  }

  const removeBlockedRange = async () => {
    if (!blockFrom) { setMessage('Select a date range to unblock.'); return }
    const end = blockTo || blockFrom
    const start = new Date(blockFrom)
    const stop = new Date(end)
    const dates = []
    for (let d = new Date(start); d <= stop; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0])
    }
    const { error } = await supabase
      .from('blocked_dates')
      .delete()
      .in('date', dates)
    if (!error) {
      setMessage(`${dates.length} date(s) unblocked.`)
      fetchAll()
    }
  }

  const statusColor = (status) => ({
    confirmed: 'var(--forest)', pending: 'var(--gold)',
    cancelled: '#999', completed: 'var(--sage)'
  }[status] || '#999')

  if (loading) return <div className="admin-loading">Loading... 🦴</div>

  const upcoming = bookings.filter(b =>
    b.status !== 'cancelled' && new Date(b.check_in) >= new Date()
  )
  const revenue = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + (b.deposit_paid ? b.deposit_amount : 0), 0)

  const markBalancePaid = async (id) => {
    const { error } = await supabase
      .from('bookings')
      .update({
        balance_paid: true,
        balance_paid_at: new Date().toISOString()
      })
      .eq('id', id)
    if (!error) {
      setBookings(bookings.map(b =>
        b.id === id ? { ...b, balance_paid: true } : b
      ))
      setMessage('Balance marked as paid!')
    }
  }

  return (
    <div className="admin-wrap">
      <div className="container">

        <div className="admin-header">
          <div>
            <span className="section-label">Admin</span>
            <h1 className="section-title">Camp Dashboard 🏕️</h1>
          </div>
          <button onClick={async () => { await signOut(); navigate('/') }} className="btn-signout-admin">
            Sign Out
          </button>
        </div>

        {/* Stats */}
        <div className="admin-stats">
          <div className="stat-card"><div className="stat-num">{upcoming.length}</div><div className="stat-label">Upcoming Stays</div></div>
          <div className="stat-card"><div className="stat-num">{clients.length}</div><div className="stat-label">Total Clients</div></div>
          <div className="stat-card"><div className="stat-num">${revenue.toFixed(0)}</div><div className="stat-label">Deposits Collected</div></div>
          <div className="stat-card"><div className="stat-num">{blockedDates.length}</div><div className="stat-label">Blocked Dates</div></div>
        </div>

        {message && <div className="admin-message">{message}</div>}
        {error && <div className="admin-error">{error}</div>}

        {/* Tabs */}
        <div className="admin-tabs">
          {['Bookings', 'Calendar', 'Clients', 'Block Dates'].map(t => (
            <button
              key={t}
              className={`admin-tab ${tab === t ? 'active' : ''}`}
              onClick={() => { setTab(t); setMessage('') }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── BOOKINGS ── */}
        {tab === 'Bookings' && (
          <div>
            {bookings.length === 0 && <p className="empty-msg">No bookings yet.</p>}
            {bookings.map(b => (
              <div key={b.id} className="admin-booking-card">
                <div className="admin-booking-main">
                  <div className="admin-booking-dog">
                    🦴 <strong>{b.dogs?.name}</strong> ({b.dogs?.breed})
                    {b.dog_count > 1 && <span className="two-dogs-badge"> +1 dog</span>}
                  </div>
                  <div className="admin-booking-owner">
                    {b.profiles?.full_name} · {b.profiles?.email} · {b.profiles?.phone}
                  </div>
                  <div className="admin-booking-dates">
                    {new Date(b.check_in + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' → '}
                    {new Date(b.check_out + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' · '}{b.nights} night{b.nights > 1 ? 's' : ''}
                    {b.discount_applied ? ' · 10% off 🎉' : ''}
                  </div>
                  <div className="admin-booking-financials">
                    Rate: <strong>${b.nightly_rate}/night</strong>
                    {' · '}Total: <strong>${b.subtotal?.toFixed(2)}</strong>
                    {' · '}Deposit:{' '}
                    <strong style={{ color: b.deposit_paid ? 'var(--sage)' : 'var(--rust)' }}>
                      {b.deposit_paid ? `$${b.deposit_amount} paid` : 'Not paid'}
                    </strong>
                  </div>
                </div>
                <div className="admin-booking-actions">
                  <div className="admin-status" style={{ color: statusColor(b.status) }}>
                    {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                  </div>
                  {b.status === 'pending' && (
                    <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="btn-confirm">Confirm</button>
                  )}

                  {b.status === 'confirmed' && (
                    <>
                      <button onClick={() => updateBookingStatus(b.id, 'completed')} className="btn-complete">Complete</button>
                      <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="btn-admin-cancel">Cancel</button>
                    </>
                  )}
                  {b.status === 'pending' && (
                    <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="btn-admin-cancel">Cancel</button>
                  )}

                  {b.status === 'completed' && !b.balance_paid && !b.paid_in_full && (
                    <button
                      onClick={() => markBalancePaid(b.id)}
                      className="btn-balance"
                    >
                      Mark Balance Paid
                    </button>
                  )}

                  {(b.balance_paid || b.paid_in_full) && (
                    <span className="balance-paid-badge">✅ Fully paid</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'Calendar' && <AdminCalendar />}

        {/* ── CLIENTS ── */}
        {tab === 'Clients' && (
          <div>
            {clients.length === 0 && <p className="empty-msg">No clients yet.</p>}
            {clients.map(c => (
              <div key={c.id} className="client-card">
                <div className="client-name">{c.full_name || 'No name yet'}</div>
                <div className="client-detail">{c.email}</div>
                {c.phone && <div className="client-detail">📞 {c.phone}</div>}
                {c.emergency_contact && (
                  <div className="client-detail">🆘 {c.emergency_contact} · {c.emergency_phone}</div>
                )}
                {c.dogs?.map(dog => (
                  <div key={dog.id} className="client-dog">
                    <strong>🦴 {dog.name}</strong> · {dog.breed} · {dog.weight}lbs · {dog.age}yr
                    <div className="dog-flags">
                      <span className={dog.vaccinated ? 'flag-ok' : 'flag-warn'}>
                        {dog.vaccinated ? '✅ Vaccinated' : '⚠️ Vaccination unconfirmed'}
                      </span>
                      <span className={dog.spayed_neutered ? 'flag-ok' : 'flag-warn'}>
                        {dog.spayed_neutered ? '✅ Spayed/Neutered' : '⚠️ Not spayed/neutered'}
                      </span>
                    </div>
                    {dog.special_needs && <div className="dog-needs">📋 {dog.special_needs}</div>}
                    {dog.vet_name && <div className="client-detail">🏥 {dog.vet_name} · {dog.vet_phone}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── BLOCK DATES ── */}
        {tab === 'Block Dates' && (
          <div className="block-dates-wrap">
            <div className="block-form">
              <h3>Block a Date or Range</h3>
              <p>Pick a single date or a from/to range. All dates in between will be marked unavailable on the booking calendar.</p>

              <div className="block-range-inputs">
                <div className="block-field">
                  <label>From</label>
                  <input
                    type="date"
                    value={blockFrom}
                    onChange={e => setBlockFrom(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="block-field">
                  <label>To (optional — leave blank for single day)</label>
                  <input
                    type="date"
                    value={blockTo}
                    onChange={e => setBlockTo(e.target.value)}
                    min={blockFrom || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="block-field block-field-reason">
                  <label>Reason (optional)</label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={e => setBlockReason(e.target.value)}
                    placeholder="e.g. Vacation, Personal day"
                  />
                </div>
              </div>

              <div className="block-actions">
                <button onClick={addBlockedRange} className="btn-block" disabled={blocking}>
                  {blocking ? 'Blocking...' : 'Block Dates'}
                </button>
                <button onClick={removeBlockedRange} className="btn-unblock-range" disabled={blocking}>
                  Unblock This Range
                </button>
              </div>
            </div>

            {/* Blocked dates list — grouped by month */}
            <div className="blocked-list">
              <h3>Currently Blocked ({blockedDates.length} date{blockedDates.length !== 1 ? 's' : ''})</h3>
              {blockedDates.length === 0 && <p className="empty-msg">No dates blocked.</p>}
              {blockedDates.map(d => (
                <div key={d.id} className="blocked-item">
                  <div>
                    <strong>
                      {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                    </strong>
                    {d.reason && <span className="blocked-reason"> · {d.reason}</span>}
                  </div>
                  <button onClick={() => removeBlockedDate(d.id)} className="btn-unblock">Unblock</button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

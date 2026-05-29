import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './Admin.css'

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
  const [customRates, setCustomRates] = useState({})
  const [savingRate, setSavingRate] = useState(null)

  // Decline modal
  const [declineModal, setDeclineModal] = useState(null) // bookingId or null
  const [declineReason, setDeclineReason] = useState('')
  const [actioning, setActioning] = useState(false)

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
      .select(`*, dogs(*), custom_nightly_rate`)
      .order('created_at', { ascending: false })
    setClients(clientsData || [])

    const { data: blockedData } = await supabase
      .from('blocked_dates')
      .select('*')
      .order('date', { ascending: true })
    setBlockedDates(blockedData || [])

    setLoading(false)
  }

  // ── APPROVE ──────────────────────────────────────────
  const handleApprove = async (bookingId) => {
    setActioning(true)
    setMessage('')
    try {
      const { error } = await supabase.functions.invoke('send-approval', {
        body: { bookingId }
      })
      if (error) throw error
      setMessage('Booking approved! Payment link sent to client.')
      setBookings(bookings.map(b =>
        b.id === bookingId ? { ...b, status: 'approved' } : b
      ))
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setActioning(false)
    }
  }

  // ── DECLINE ──────────────────────────────────────────
  const handleDecline = async () => {
    if (!declineModal) return
    setActioning(true)
    setMessage('')
    try {
      const { error } = await supabase.functions.invoke('send-decline', {
        body: { bookingId: declineModal, reason: declineReason }
      })
      if (error) throw error
      setMessage('Booking declined. Client has been notified.')
      setBookings(bookings.map(b =>
        b.id === declineModal ? { ...b, status: 'declined', decline_reason: declineReason } : b
      ))
      setDeclineModal(null)
      setDeclineReason('')
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setActioning(false)
    }
  }

  // ── OTHER STATUS UPDATES ─────────────────────────────
  const updateBookingStatus = async (id, status) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
    if (!error) {
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b))
      setMessage(`Booking ${status}.`)
    }
  }

  // ── SEND INVOICE ─────────────────────────────────────
  const handleSendInvoice = async (bookingId) => {
    setActioning(true)
    try {
      const { error } = await supabase.functions.invoke('create-invoice', {
        body: { bookingId }
      })
      if (error) throw error
      setMessage('Invoice sent to client!')
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setActioning(false)
    }
  }

  // ── BLOCK DATES ──────────────────────────────────────
  const addBlockedRange = async () => {
    if (!blockFrom) { setMessage('Please select a start date.'); return }
    setBlocking(true)
    setMessage('')
    const end = blockTo || blockFrom
    const start = new Date(blockFrom)
    const stop = new Date(end)
    const rows = []
    for (let d = new Date(start); d <= stop; d.setDate(d.getDate() + 1)) {
      rows.push({ date: d.toISOString().split('T')[0], reason: blockReason || 'Unavailable' })
    }
    const { error } = await supabase.from('blocked_dates').upsert(rows, { onConflict: 'date' })
    if (!error) {
      setMessage(`${rows.length} date(s) blocked.`)
      setBlockFrom(''); setBlockTo(''); setBlockReason('')
      fetchAll()
    } else { setMessage(`Error: ${error.message}`) }
    setBlocking(false)
  }

  const removeBlockedDate = async (id) => {
    await supabase.from('blocked_dates').delete().eq('id', id)
    setBlockedDates(blockedDates.filter(d => d.id !== id))
    setMessage('Date unblocked.')
  }

  const removeBlockedRange = async () => {
    if (!blockFrom) return
    const end = blockTo || blockFrom
    const dates = []
    for (let d = new Date(blockFrom); d <= new Date(end); d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0])
    }
    await supabase.from('blocked_dates').delete().in('date', dates)
    setMessage(`${dates.length} date(s) unblocked.`)
    fetchAll()
  }

  // ── Set Custom Rate ──────────────────────────────────────
  const saveCustomRate = async (clientId, rate) => {
    setSavingRate(clientId)
    const value = rate === '' ? null : parseFloat(rate)
    console.log('updating:', clientId, 'value:', value)
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ custom_nightly_rate: value })
      .eq('id', clientId)
    
    if (!error) {
      setMessage(value ? `Custom rate of $${value}/night saved!` : 'Custom rate removed.')
    } else {
      setMessage(`Error: ${error.message}`)
    }
    setSavingRate(null)
  }

  const statusColor = (status) => ({
    pending_approval: '#D4943A',
    approved: '#7BBFCF',
    confirmed: '#2D5016',
    completed: '#7A9E5A',
    cancelled: '#999',
    declined: '#999',
  }[status] || '#999')

  const statusLabel = (status) => ({
    pending_approval: 'Pending Approval',
    approved: 'Awaiting Payment',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    declined: 'Declined',
  }[status] || status)

  if (loading) return <div className="admin-loading">Loading... 🦴</div>

  const pendingApproval = bookings.filter(b => b.status === 'pending_approval')
  const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(b.check_in) >= new Date())
  const revenue = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + (b.deposit_paid ? b.deposit_amount : 0), 0)

  return (
    <div className="admin-wrap">
      {/* Decline modal */}
      {declineModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Decline Booking</h3>
            <p>Optionally add a message for the client explaining why their request was declined.</p>
            <textarea
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              placeholder="e.g. Unfortunately those dates are already booked. Please try selecting different dates!"
              rows={4}
            />
            <div className="modal-actions">
              <button onClick={handleDecline} className="btn-confirm" disabled={actioning}>
                {actioning ? 'Sending...' : 'Send Decline'}
              </button>
              <button onClick={() => { setDeclineModal(null); setDeclineReason('') }} className="btn-admin-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div className="stat-card">
            <div className="stat-num" style={{ color: pendingApproval.length > 0 ? 'var(--rust)' : 'var(--forest)' }}>
              {pendingApproval.length}
            </div>
            <div className="stat-label">Awaiting Approval</div>
          </div>
          <div className="stat-card"><div className="stat-num">{upcoming.length}</div><div className="stat-label">Upcoming Stays</div></div>
          <div className="stat-card"><div className="stat-num">{clients.length}</div><div className="stat-label">Total Clients</div></div>
          <div className="stat-card"><div className="stat-num">${revenue.toFixed(0)}</div><div className="stat-label">Deposits Collected</div></div>
        </div>

        {message && <div className="admin-message">{message}</div>}

        {/* Pending approval banner */}
        {pendingApproval.length > 0 && (
          <div className="pending-banner">
            🦴 You have <strong>{pendingApproval.length}</strong> booking request{pendingApproval.length > 1 ? 's' : ''} waiting for your approval!
          </div>
        )}

        {/* Tabs */}
        <div className="admin-tabs">
          {['Bookings', 'Clients', 'Block Dates'].map(t => (
            <button
              key={t}
              className={`admin-tab ${tab === t ? 'active' : ''}`}
              onClick={() => { setTab(t); setMessage('') }}
            >
              {t}{t === 'Bookings' && pendingApproval.length > 0 && (
                <span className="tab-badge">{pendingApproval.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── BOOKINGS ── */}
        {tab === 'Bookings' && (
          <div>
            {bookings.length === 0 && <p className="empty-msg">No bookings yet.</p>}
            {bookings.map(b => (
              <div key={b.id} className={`admin-booking-card ${b.status === 'pending_approval' ? 'pending' : ''}`}>
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
                  {b.decline_reason && (
                    <div className="decline-reason-note">Decline reason: {b.decline_reason}</div>
                  )}
                </div>
                <div className="admin-booking-actions">
                  <div className="admin-status" style={{ color: statusColor(b.status) }}>
                    {statusLabel(b.status)}
                  </div>

                  {/* Pending approval actions */}
                  {b.status === 'pending_approval' && (
                    <>
                      <button onClick={() => handleApprove(b.id)} className="btn-approve" disabled={actioning}>
                        ✅ Approve
                      </button>
                      <button onClick={() => setDeclineModal(b.id)} className="btn-admin-cancel" disabled={actioning}>
                        ❌ Decline
                      </button>
                    </>
                  )}

                  {/* Confirmed actions */}
                  {b.status === 'confirmed' && (
                    <>
                      {!b.paid_in_full && !b.balance_paid && (
                        <button onClick={() => handleSendInvoice(b.id)} className="btn-complete" disabled={actioning}>
                          Send Invoice
                        </button>
                      )}
                      <button onClick={() => updateBookingStatus(b.id, 'completed')} className="btn-complete" disabled={actioning}>
                        Complete
                      </button>
                      <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="btn-admin-cancel" disabled={actioning}>
                        Cancel
                      </button>
                    </>
                  )}

                  {/* Approved awaiting payment */}
                  {b.status === 'approved' && (
                    <button onClick={() => handleApprove(b.id)} className="btn-complete" disabled={actioning}>
                      Resend Payment Link
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

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
                <div className="custom-rate-row">
                  <label className="custom-rate-label">
                    🦴 Custom nightly rate
                    <span className="custom-rate-hint">(leave blank for standard $70/night)</span>
                  </label>
                  <div className="custom-rate-input-row">
                    <span className="rate-prefix">$</span>
                    <input
                      type="number"
                      className="custom-rate-input"
                      placeholder="70"
                      defaultValue={c.custom_nightly_rate || ''}
                      onChange={e => {
                        const val = e.target.value
                        setCustomRates(prev => ({ ...prev, [c.id]: val }))
                      }}
                    />
                    <button
                      className="btn-save-rate"
                      onClick={() => {
                        const rate = customRates[c.id] ?? c.custom_nightly_rate ?? ''
                        saveCustomRate(c.id, rate)
                      }}
                      disabled={savingRate === c.id}
                    >
                      {savingRate === c.id ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  {c.custom_nightly_rate && (
                    <div className="custom-rate-active">
                      ✅ Currently paying ${c.custom_nightly_rate}/night
                    </div>
                  )}
                </div>

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
                  <input type="date" value={blockFrom} onChange={e => setBlockFrom(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="block-field">
                  <label>To (optional)</label>
                  <input type="date" value={blockTo} onChange={e => setBlockTo(e.target.value)} min={blockFrom || new Date().toISOString().split('T')[0]} />
                </div>
                <div className="block-field block-field-reason">
                  <label>Reason (optional)</label>
                  <input type="text" value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="e.g. Vacation, Personal day" />
                </div>
              </div>
              <div className="block-actions">
                <button onClick={addBlockedRange} className="btn-block" disabled={blocking}>{blocking ? 'Blocking...' : 'Block Dates'}</button>
                <button onClick={removeBlockedRange} className="btn-unblock-range" disabled={blocking}>Unblock This Range</button>
              </div>
            </div>
            <div className="blocked-list">
              <h3>Currently Blocked ({blockedDates.length} date{blockedDates.length !== 1 ? 's' : ''})</h3>
              {blockedDates.length === 0 && <p className="empty-msg">No dates blocked.</p>}
              {blockedDates.map(d => (
                <div key={d.id} className="blocked-item">
                  <div>
                    <strong>{new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
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

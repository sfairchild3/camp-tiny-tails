import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './AdminCalendar.css'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function AdminCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [bookings, setBookings] = useState([])
  const [blockedDates, setBlockedDates] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  const fetchData = async () => {
    setLoading(true)
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).toISOString().split('T')[0]
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0]

    // Fetch bookings that overlap with this month
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select(`*, profiles(full_name, email, phone), dogs(name, breed)`)
      .neq('status', 'cancelled')
      .lte('check_in', lastDay)
      .gte('check_out', firstDay)
      .order('check_in', { ascending: true })
    setBookings(bookingsData || [])

    // Fetch blocked dates for this month
    const { data: blockedData } = await supabase
      .from('blocked_dates')
      .select('*')
      .gte('date', firstDay)
      .lte('date', lastDay)
    setBlockedDates(blockedData || [])

    setLoading(false)
  }

  const getDayInfo = (date) => {
    const dateStr = date.toISOString().split('T')[0]

    const blocked = blockedDates.find(b => b.date === dateStr)
    if (blocked) return { type: 'blocked', data: blocked }

    const booking = bookings.find(b => {
      return dateStr >= b.check_in && dateStr < b.check_out
    })
    if (booking) return { type: 'booked', data: booking }

    return { type: 'available' }
  }

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  // Get booking for selected day
  const selectedDayInfo = selectedDay ? getDayInfo(new Date(selectedDay + 'T12:00:00')) : null

  return (
    <div className="admin-calendar">
      {/* Calendar header */}
      <div className="acal-header">
        <button onClick={prevMonth} className="acal-nav">←</button>
        <h3 className="acal-title">{MONTHS[month]} {year}</h3>
        <button onClick={nextMonth} className="acal-nav">→</button>
      </div>

      {/* Legend */}
      <div className="acal-legend">
        <div className="legend-item"><span className="acal-dot available" />Available</div>
        <div className="legend-item"><span className="acal-dot booked" />Booked</div>
        <div className="legend-item"><span className="acal-dot blocked" />Blocked</div>
        <div className="legend-item"><span className="acal-dot today-dot" />Today</div>
      </div>

      {loading ? (
        <div className="acal-loading">Loading... 🦴</div>
      ) : (
        <>
          {/* Day labels */}
          <div className="acal-grid">
            {DAYS.map(d => (
              <div key={d} className="acal-day-label">{d}</div>
            ))}

            {/* Empty cells */}
            {Array(firstDay).fill(null).map((_, i) => (
              <div key={`empty-${i}`} className="acal-cell empty" />
            ))}

            {/* Day cells */}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const date = new Date(year, month, i + 1)
              const dateStr = date.toISOString().split('T')[0]
              const info = getDayInfo(date)
              const isToday = dateStr === today
              const isSelected = selectedDay === dateStr

              return (
                <div
                  key={i}
                  className={`acal-cell ${info.type} ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                >
                  <span className="acal-date-num">{i + 1}</span>
                  {info.type === 'booked' && (
                    <span className="acal-cell-name">
                      {info.data.dogs?.name || info.data.profiles?.full_name?.split(' ')[0]}
                    </span>
                  )}
                  {info.type === 'blocked' && (
                    <span className="acal-cell-reason">Blocked</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Detail panel for selected day */}
          {selectedDay && selectedDayInfo && (
            <div className={`acal-detail ${selectedDayInfo.type}`}>
              <div className="acal-detail-date">
                {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                })}
              </div>

              {selectedDayInfo.type === 'available' && (
                <div className="acal-detail-content">
                  <span className="acal-detail-status available">✅ Available</span>
                </div>
              )}

              {selectedDayInfo.type === 'blocked' && (
                <div className="acal-detail-content">
                  <span className="acal-detail-status blocked">⛔ Blocked</span>
                  {selectedDayInfo.data.reason && (
                    <span className="acal-detail-reason">{selectedDayInfo.data.reason}</span>
                  )}
                </div>
              )}

              {selectedDayInfo.type === 'booked' && (
                <div className="acal-detail-content">
                  <span className="acal-detail-status booked">🌙 Booked</span>
                  <div className="acal-detail-booking">
                    <div className="acal-detail-row">
                      <strong>Dog:</strong>
                      {selectedDayInfo.data.dogs?.name} ({selectedDayInfo.data.dogs?.breed})
                    </div>
                    <div className="acal-detail-row">
                      <strong>Owner:</strong>
                      {selectedDayInfo.data.profiles?.full_name}
                    </div>
                    <div className="acal-detail-row">
                      <strong>Email:</strong>
                      {selectedDayInfo.data.profiles?.email}
                    </div>
                    <div className="acal-detail-row">
                      <strong>Phone:</strong>
                      {selectedDayInfo.data.profiles?.phone || 'Not provided'}
                    </div>
                    <div className="acal-detail-row">
                      <strong>Stay:</strong>
                      {new Date(selectedDayInfo.data.check_in + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' → '}
                      {new Date(selectedDayInfo.data.check_out + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' · '}{selectedDayInfo.data.nights} nights
                    </div>
                    <div className="acal-detail-row">
                      <strong>Total:</strong>
                      ${selectedDayInfo.data.subtotal?.toFixed(2)}
                      {selectedDayInfo.data.discount_applied ? ' (10% discount applied)' : ''}
                    </div>
                    <div className="acal-detail-row">
                      <strong>Deposit:</strong>
                      <span style={{ color: selectedDayInfo.data.deposit_paid ? 'var(--sage)' : 'var(--rust)' }}>
                        {selectedDayInfo.data.deposit_paid ? '✅ Paid' : '⏳ Pending'}
                      </span>
                    </div>
                    <div className="acal-detail-row">
                      <strong>Status:</strong>
                      <span style={{ textTransform: 'capitalize' }}>{selectedDayInfo.data.status}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

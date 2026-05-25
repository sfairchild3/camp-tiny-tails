import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './Account.css'

const MAX_DOGS = 2

const EMPTY_DOG = {
  name: '', breed: '', weight: '', age: '',
  vet_name: '', vet_phone: '', vaccinated: false,
  spayed_neutered: false, special_needs: ''
}

const TABS = ['My Bookings', 'My Dogs', 'My Profile']

export default function Account() {
  const { user, profile, signOut, fetchProfile, authLoading } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [tab, setTab]         = useState('My Bookings')
  const [bookings, setBookings] = useState([])
  const [dogs, setDogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError]     = useState('')

  // Which dog is being edited (null = none, 'new' = add form, id = edit form)
  const [editingDog, setEditingDog] = useState(null)
  const [dogForm, setDogForm]       = useState(EMPTY_DOG)

  // Profile form
  const [profileForm, setProfileForm] = useState({
    full_name: '', phone: '', emergency_contact: '', emergency_phone: ''
  })

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }
    fetchData()
    if (location.state?.setupDog) setTab('My Dogs')
  }, [user, authLoading])

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name:         profile.full_name || '',
        phone:             profile.phone || '',
        emergency_contact: profile.emergency_contact || '',
        emergency_phone:   profile.emergency_phone || '',
      })
    }
  }, [profile])

  const fetchData = async () => {
    setLoading(true)

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .eq('client_id', user.id)
      .order('check_in', { ascending: true })
    setBookings(bookingsData || [])

    const { data: dogsData } = await supabase
      .from('dogs')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })
    setDogs(dogsData || [])

    setLoading(false)
  }

  // ── BOOKING ACTIONS ──────────────────────────────────
  const cancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .eq('client_id', user.id)
    if (!error) {
      setBookings(bookings.map(b =>
        b.id === bookingId ? { ...b, status: 'cancelled' } : b
      ))
      setMessage('Booking cancelled.')
    }
  }

  // ── DOG ACTIONS ──────────────────────────────────────
  const startAddDog = () => {
    if (dogs.length >= MAX_DOGS) {
      setError(`Camp Tiny Tails can accommodate a maximum of ${MAX_DOGS} dogs per family. Please remove a dog before adding a new one.`)
      return
    }
    setError('')
    setDogForm(EMPTY_DOG)
    setEditingDog('new')
  }

  const startEditDog = (dog) => {
    setError('')
    setDogForm({
      name:           dog.name || '',
      breed:          dog.breed || '',
      weight:         dog.weight || '',
      age:            dog.age || '',
      vet_name:       dog.vet_name || '',
      vet_phone:      dog.vet_phone || '',
      vaccinated:     dog.vaccinated || false,
      spayed_neutered: dog.spayed_neutered || false,
      special_needs:  dog.special_needs || '',
    })
    setEditingDog(dog.id)
  }

  const cancelEdit = () => {
    setEditingDog(null)
    setDogForm(EMPTY_DOG)
    setError('')
  }

  const saveDog = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    if (editingDog === 'new') {
      const { error } = await supabase
        .from('dogs')
        .insert({ ...dogForm, owner_id: user.id })
      if (error) {
        setError(error.message)
      } else {
        setMessage(`${dogForm.name} added to your profile! 🦴`)
        setEditingDog(null)
        fetchData()
        if (location.state?.checkIn) navigate('/booking')
      }
    } else {
      const { error } = await supabase
        .from('dogs')
        .update(dogForm)
        .eq('id', editingDog)
        .eq('owner_id', user.id)
      if (error) {
        setError(error.message)
      } else {
        setMessage(`${dogForm.name}'s profile updated! 🦴`)
        setEditingDog(null)
        fetchData()
      }
    }
    setSaving(false)
  }

  const deleteDog = async (dog) => {
    if (!confirm(`Are you sure you want to remove ${dog.name} from your profile?`)) return
    const { error } = await supabase
      .from('dogs')
      .delete()
      .eq('id', dog.id)
      .eq('owner_id', user.id)
    if (!error) {
      setMessage(`${dog.name} removed from your profile.`)
      setDogs(dogs.filter(d => d.id !== dog.id))
      if (editingDog === dog.id) setEditingDog(null)
    }
  }

  // ── PROFILE ACTIONS ──────────────────────────────────
  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    const { error } = await supabase
      .from('profiles')
      .update(profileForm)
      .eq('id', user.id)
    if (!error) {
      setMessage('Profile updated!')
      fetchProfile(user.id)
    }
    setSaving(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const statusColor = (status) => ({
    confirmed: '#2D5016', pending: '#D4943A',
    cancelled: '#999',    completed: '#7A9E5A'
  }[status] || '#999')

  if (loading) return <div className="account-loading">Loading your account... 🦴</div>

  return (
    <div className="account-wrap">
      <div className="container">

        {/* Header */}
        <div className="account-header">
          <div>
            <h1 className="section-title">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Camper Parent'}! 🦴
            </h1>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>{user.email}</p>
          </div>
          <div className="account-header-actions">
            <button onClick={() => navigate('/booking')} className="btn-book-another">
              + Book a Stay
            </button>
            <button onClick={handleSignOut} className="btn-signout">Sign Out</button>
          </div>
        </div>

        {message && <div className="account-message">{message}</div>}
        {error && <div className="account-error">{error}</div>}

        {/* Tabs */}
        <div className="account-tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`account-tab ${tab === t ? 'active' : ''}`}
              onClick={() => { setTab(t); setMessage(''); setError(''); setEditingDog(null) }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── MY BOOKINGS ── */}
        {tab === 'My Bookings' && (
          <div className="bookings-list">
            {bookings.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">🏕️</span>
                <p>No bookings yet!</p>
                <button onClick={() => navigate('/booking')} className="btn-primary">
                  Book a Stay
                </button>
              </div>
            )}
            {bookings.map(b => (
              <div key={b.id} className="booking-item">
                <div className="booking-dates">
                  <div className="booking-icon">🌙</div>
                  <div>
                    <div className="booking-range">
                      {new Date(b.check_in + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' → '}
                      {new Date(b.check_out + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="booking-nights">
                      {b.nights} night{b.nights > 1 ? 's' : ''}
                      {b.dog_count > 1 ? ` · ${b.dog_count} dogs` : ''}
                      {b.discount_applied ? ' · 10% discount applied 🎉' : ''}
                    </div>
                  </div>
                </div>
                <div className="booking-right">
                  <div className="booking-total">${b.subtotal?.toFixed(2)}</div>
                  <div className="booking-deposit">
                    {b.deposit_paid ? '✅ Deposit paid' : '⏳ Deposit pending'}
                  </div>
                  <div className="booking-status" style={{ color: statusColor(b.status) }}>
                    {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                  </div>
                  {b.status !== 'cancelled' && b.status !== 'completed' && (
                    <button onClick={() => cancelBooking(b.id)} className="btn-cancel">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── MY DOGS ── */}
        {tab === 'My Dogs' && (
          <div className="dogs-section">

            {/* Disclaimer */}
            <div className="dogs-disclaimer">
              🏕️ Camp Tiny Tails can accommodate a maximum of <strong>2 dogs per family</strong>.
              A second dog is just <strong>+$10/night</strong>!
            </div>

            {/* Dog cards */}
            {dogs.map(dog => (
              <div key={dog.id}>
                {editingDog === dog.id ? (
                  /* Edit form */
                  <div className="dog-form-card">
                    <div className="dog-form-header">
                      <h3 className="form-section-title">Editing {dog.name} 🦴</h3>
                      <button onClick={cancelEdit} className="btn-cancel-edit">✕ Cancel</button>
                    </div>
                    <form onSubmit={saveDog}>
                      <DogFormFields form={dogForm} setForm={setDogForm} />
                      <button type="submit" className="btn-save" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Dog card */
                  <div className="dog-card">
                    <div className="dog-card-info">
                      <div className="dog-card-name">🦴 {dog.name}</div>
                      <div className="dog-card-details">
                        {[dog.breed, dog.weight && `${dog.weight}lbs`, dog.age && `${dog.age}yr`]
                          .filter(Boolean).join(' · ')}
                      </div>
                      <div className="dog-flags">
                        <span className={dog.vaccinated ? 'flag-ok' : 'flag-warn'}>
                          {dog.vaccinated ? '✅ Vaccinated' : '⚠️ Vaccination unconfirmed'}
                        </span>
                        <span className={dog.spayed_neutered ? 'flag-ok' : 'flag-warn'}>
                          {dog.spayed_neutered ? '✅ Spayed/Neutered' : '⚠️ Not spayed/neutered'}
                        </span>
                      </div>
                      {dog.special_needs && (
                        <div className="dog-needs">📋 {dog.special_needs}</div>
                      )}
                    </div>
                    <div className="dog-card-actions">
                      <button onClick={() => startEditDog(dog)} className="btn-edit-dog">Edit</button>
                      <button onClick={() => deleteDog(dog)} className="btn-delete-dog">Remove</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add new dog */}
            {editingDog === 'new' ? (
              <div className="dog-form-card">
                <div className="dog-form-header">
                  <h3 className="form-section-title">Add a New Dog 🦴</h3>
                  <button onClick={cancelEdit} className="btn-cancel-edit">✕ Cancel</button>
                </div>
                <form onSubmit={saveDog}>
                  <DogFormFields form={dogForm} setForm={setDogForm} />
                  <button type="submit" className="btn-save" disabled={saving}>
                    {saving ? 'Saving...' : 'Add Dog'}
                  </button>
                </form>
              </div>
            ) : (
              dogs.length < MAX_DOGS && editingDog === null && (
                <button onClick={startAddDog} className="btn-add-dog">
                  + Add a Dog
                </button>
              )
            )}

            {dogs.length === 0 && editingDog === null && (
              <div className="empty-state">
                <span className="empty-icon">🦴</span>
                <p>No dogs added yet!</p>
              </div>
            )}
          </div>
        )}

        {/* ── MY PROFILE ── */}
        {tab === 'My Profile' && (
          <form onSubmit={saveProfile} className="profile-form">
            <h3 className="form-section-title">Your Profile</h3>
            <div className="form-grid">
              <div className="field">
                <label>Full Name</label>
                <input type="text" value={profileForm.full_name}
                  onChange={e => setProfileForm({...profileForm, full_name: e.target.value})}
                  placeholder="Jane Smith" />
              </div>
              <div className="field">
                <label>Phone</label>
                <input type="tel" value={profileForm.phone}
                  onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                  placeholder="(555) 000-0000" />
              </div>
              <div className="field">
                <label>Emergency Contact Name</label>
                <input type="text" value={profileForm.emergency_contact}
                  onChange={e => setProfileForm({...profileForm, emergency_contact: e.target.value})}
                  placeholder="John Smith" />
              </div>
              <div className="field">
                <label>Emergency Contact Phone</label>
                <input type="tel" value={profileForm.emergency_phone}
                  onChange={e => setProfileForm({...profileForm, emergency_phone: e.target.value})}
                  placeholder="(555) 000-0000" />
              </div>
            </div>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}

// ── SHARED DOG FORM FIELDS ───────────────────────────
function DogFormFields({ form, setForm }) {
  return (
    <>
      <div className="form-grid">
        <div className="field">
          <label>Dog's Name *</label>
          <input type="text" value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            required placeholder="Biscuit" />
        </div>
        <div className="field">
          <label>Breed</label>
          <input type="text" value={form.breed}
            onChange={e => setForm({...form, breed: e.target.value})}
            placeholder="Chihuahua mix" />
        </div>
        <div className="field">
          <label>Weight (lbs)</label>
          <input type="number" value={form.weight}
            onChange={e => setForm({...form, weight: e.target.value})}
            placeholder="12" max="25" />
        </div>
        <div className="field">
          <label>Age (years)</label>
          <input type="number" value={form.age}
            onChange={e => setForm({...form, age: e.target.value})}
            placeholder="3" />
        </div>
        <div className="field">
          <label>Vet Name</label>
          <input type="text" value={form.vet_name}
            onChange={e => setForm({...form, vet_name: e.target.value})}
            placeholder="Dr. Smith Animal Hospital" />
        </div>
        <div className="field">
          <label>Vet Phone</label>
          <input type="tel" value={form.vet_phone}
            onChange={e => setForm({...form, vet_phone: e.target.value})}
            placeholder="(555) 000-0000" />
        </div>
      </div>
      <div className="field" style={{ marginBottom: '14px' }}>
        <label>Special Needs / Notes</label>
        <textarea value={form.special_needs}
          onChange={e => setForm({...form, special_needs: e.target.value})}
          placeholder="Allergies, medications, behavioral notes, favorite toys..."
          rows={3} />
      </div>
      <div className="checkbox-group">
        <label className="checkbox-label">
          <input type="checkbox" checked={form.vaccinated}
            onChange={e => setForm({...form, vaccinated: e.target.checked})} />
          Current on all vaccinations (required)
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={form.spayed_neutered}
            onChange={e => setForm({...form, spayed_neutered: e.target.checked})} />
          Spayed / Neutered (required)
        </label>
      </div>
    </>
  )
}

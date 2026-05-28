import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useState } from 'react'
import './Navbar.css'

export default function Navbar() {
  const navigate = useNavigate()

  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const scrollToSection = (id) => {
    // If not on home page, navigate there first then scroll
    if (window.location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const [menuOpen, setMenuOpen] = useState(false)



  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        🦴 Camp Tiny Tails
      </Link>
      <button
        className="nav-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? '✕' : '☰'}
      </button>
      <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <li><button onClick={() => scrollToSection('about')}>About</button></li>
        <li><button onClick={() => scrollToSection('activities')}>Camp Life</button></li>
        <li><button onClick={() => scrollToSection('pricing')}>Rates</button></li>
        <li><Link to="/gallery" onClick={() => window.scrollTo(0, 0)}>Gallery</Link></li>
        <li>
          {user
            ? <>
              <Link to="/account">My Account</Link>
              <button onClick={handleSignOut} className="nav-links button">Log Out</button>
            </>
            : <Link to="/login">Login</Link>
          }
        </li>
        <li><Link to="/booking" className="nav-cta">Reserve a Spot</Link></li>
      </ul>
    </nav>
  )
}

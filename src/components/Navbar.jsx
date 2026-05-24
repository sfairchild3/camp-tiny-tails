import { Link, useNavigate } from 'react-router-dom'
import { SQUARE_URL_OVERNIGHT } from '../config'
import './Navbar.css'

export default function Navbar() {
  const navigate = useNavigate()

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

  const openBooking = () => {
    window.open(SQUARE_URL_OVERNIGHT, '_blank', 'noopener,noreferrer')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
      🦴 Camp Tiny Tails
      </Link>
      <ul className="nav-links">
        <li><button onClick={() => scrollToSection('about')}>About</button></li>
        <li><button onClick={() => scrollToSection('activities')}>Camp Life</button></li>
        <li><button onClick={() => scrollToSection('pricing')}>Rates</button></li>
        <li><Link to="/gallery">Gallery</Link></li>
        <li><Link to="/login">Login</Link></li>
        <li><Link to="/booking" className="nav-cta">Reserve a Spot</Link></li>
      </ul>
    </nav>
  )
}

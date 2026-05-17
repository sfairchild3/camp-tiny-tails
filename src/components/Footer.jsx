import { Link, useNavigate } from 'react-router-dom'
import { EMAIL, PHONE, CITY, INSTAGRAM, FACEBOOK } from '../config'
import './Footer.css'

export default function Footer() {
  const navigate = useNavigate()

  const scrollTo = (id) => {
    if (window.location.pathname !== '/') {
      navigate('/')
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100)
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="footer">
      <div className="footer-inner container">
        <div>
          <div className="footer-logo">🐾 Camp Tiny Tails</div>
          <p className="footer-about">Small dog boarding with big heart. Born on the trails, built for the little ones. Where every pup is a valued camper, not just a guest.</p>
        </div>
        <div>
          <h4>Camp</h4>
          <ul>
            <li><button onClick={() => scrollTo('about')}>Our Story</button></li>
            <li><button onClick={() => scrollTo('activities')}>Camp Life</button></li>
            <li><button onClick={() => scrollTo('pricing')}>Rates</button></li>
            <li><Link to="/gallery">Gallery</Link></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul>
            <li>📍 {CITY}</li>
            <li>📞 {PHONE}</li>
            <li><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
            <li>
              <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">Instagram</a>
              {' · '}
              <a href={FACEBOOK} target="_blank" rel="noopener noreferrer">Facebook</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">© {new Date().getFullYear()} Camp Tiny Tails · Small dogs only · All tails welcome</div>
      </div>
    </footer>
  )
}

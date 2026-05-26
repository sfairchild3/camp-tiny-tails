import { useEffect } from 'react'
import './Hero.css'
import campPups from '../assets/camp-pups.png'

export default function Hero() {
  useEffect(() => {
    const container = document.getElementById('stars-container')
    if (!container) return
    for (let i = 0; i < 45; i++) {
      const s = document.createElement('div')
      s.className = 'star'
      const size = Math.random() * 3 + 1
      s.style.cssText = `width:${size}px;height:${size}px;top:${Math.random()*100}%;left:${Math.random()*100}%;animation-delay:${Math.random()*4}s;animation-duration:${2+Math.random()*3}s`
      container.appendChild(s)
    }
  }, [])

  const scrollToActivities = () => {
    document.getElementById('activities')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="hero">
      <div className="stars" id="stars-container" />

      <span className="hero-badge">🏕️ Small Dogs Only · Overnights &amp; Extended Stays</span>
      <h1 className="hero-title">Camp<br /><span>Tiny Tails</span></h1>
      <p className="hero-tag">Where small dogs go to have the time of their lives.</p>
      <p className="hero-sub">Your pup isn't being boarded, they're going to camp. Tail-wagging adventures, new friends, and all the cuddles.</p>

      <div className="hero-btns">
        <a
          href='/booking'
          target="_self"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Reserve a Bunk 🐶
        </a>
        <button className="btn-outline" onClick={scrollToActivities}>
          See Camp Life
        </button>
      </div>
      <img src={campPups} alt="Pups at Camp" className="hero-pups" />
    </div>
  )
}

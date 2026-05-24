import { useEffect } from 'react'
import { SQUARE_URL_OVERNIGHT } from '../config'
import './Hero.css'

const TREES = [
  { w: 55, h: 120 }, { w: 42, h: 95 }, { w: 65, h: 140 },
  { w: 48, h: 108 }, { w: 58, h: 125 }, { w: 40, h: 90 }, { w: 62, h: 132 },
]

function TreeSVG({ w, h }) {
  const cx = w / 2
  return (
    <svg className="tree-svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polygon points={`${cx},0 0,${h*0.67} ${w},${h*0.67}`} fill="#2A4A14" />
      <polygon points={`${cx},${h*0.25} 0,${h*0.8} ${w},${h*0.8}`} fill="#3E6B22" />
      <rect x={cx - 7} y={h * 0.8} width={14} height={h * 0.2} fill="#5C3D1E" />
    </svg>
  )
}

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

      <span className="hero-badge">🏕️ Small Dogs Only · Overnights &amp; Weekly Stays</span>
      <h1 className="hero-title">Camp<br /><span>Tiny Tails</span></h1>
      <p className="hero-tag">Where small dogs go to have the time of their lives.</p>
      <p className="hero-sub">Your pup isn't being boarded, they're going to camp. Tail-wagging adventures, new friends, and all the cuddles.</p>

      <div className="hero-btns">
        <a
          href={SQUARE_URL_OVERNIGHT}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Reserve a Bunk 🐶
        </a>
        <button className="btn-outline" onClick={scrollToActivities}>
          See Camp Life
        </button>
      </div>

      <div className="trees-row">
        {TREES.map((t, i) => <TreeSVG key={i} {...t} />)}
      </div>
    </div>
  )
}

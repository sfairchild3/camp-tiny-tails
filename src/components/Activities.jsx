import './Activities.css'

const ACTIVITIES = [
  { icon: '🐾', title: 'Sniffing Trails', desc: 'Group walks designed for small snouts that are slow, exploratory, and nose-led. The best way to start the camp day.' },
  { icon: '🌿', title: 'Yard Play & Zoomies', desc: 'Safely fenced play yards sized for small dogs. No giants, no chaos. Just free-range fun with friends their own size.' },
  /*{ icon: '😴', title: 'Rest Hour', desc: 'Every camper needs a midday snooze. Cozy sleeping spots, calm music, and a counselor nearby for comfort.' },*/
  /*{ icon: '🎾', title: 'Enrichment Activities', desc: 'Puzzle feeders, scent games, and gentle training keep little minds sharp and spirits high.' },*/
  { icon: '📸', title: 'Camp Postcards', desc: "Pupdate photos sent straight to your phone. Evidence your dog is having a better weekend than you." },
]

export default function Activities() {
  return (
    <section className="activities" id="activities">
      <div className="container">
        <span className="section-label">What We Do</span>
        <h2 className="section-title">A full day of camp life.</h2>
        <p className="section-body">Every day at Camp Tiny Tails is packed with enriching, tail-wagging activities.</p>
        <div className="act-grid">
          {ACTIVITIES.map((a, i) => (
            <div className="act-card" key={i}>
              <span className="act-icon">{a.icon}</span>
              <h3>{a.title}</h3>
              <p>{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

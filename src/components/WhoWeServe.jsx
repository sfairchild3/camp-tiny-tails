import './WhoWeServe.css'

const SIZES = [
  { emoji: '🐩', label: 'Tiny Campers', range: 'Under 10 lbs' },
  { emoji: '🐶', label: 'Little Campers', range: '10–20 lbs' },
  { emoji: '🦴', label: 'Junior Campers', range: '20–25 lbs' },
]

export default function WhoWeServe() {
  return (
    <section className="who">
      <div className="container">
        <span className="section-label gold">Who We Welcome</span>
        <h2 className="section-title light">A camp built for small dogs.</h2>
        <p className="section-body light">
          We exclusively serve small and petite breeds — little dogs have big personalities
          and deserve a space made just for them. No big-dog energy, no overwhelming playgroups.
        </p>
        <div className="sizes">
          {SIZES.map((s) => (
            <div className="size-card" key={s.label}>
              <span className="size-emoji">{s.emoji}</span>
              <strong>{s.label}</strong>
              <span>{s.range}</span>
            </div>
          ))}
        </div>
        <p className="who-note">All campers must be current on vaccinations, flea/tick prevention, and spayed or neutered.</p>
      </div>
    </section>
  )
}

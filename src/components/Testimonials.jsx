import './Testimonials.css'

const TESTIMONIALS = [
  {
    quote: "Biscuit used to shake on the car ride to his old boarder. Now he drags me to the door at drop-off. Camp Tiny Tails completely changed how he feels about being away from home.",
    name: "Sarah M.",
    dog: "Mom to Biscuit, Chihuahua mix",
    emoji: "🐕"
  },
  {
    quote: "The daily photos alone are worth it. I travel for work and used to feel so guilty — now I get pictures of Poppy doing zoomies and I actually laugh out loud on work trips.",
    name: "David R.",
    dog: "Dad to Poppy, Miniature Poodle",
    emoji: "🐩"
  },
  {
    quote: "Finally a place where my 8-lb Yorkie isn't overwhelmed by giant dogs. The small-dog-only approach is a game changer. Remy comes home tired, happy, and smelling amazing.",
    name: "Priya K.",
    dog: "Mom to Remy, Yorkshire Terrier",
    emoji: "🐶"
  },
]

export default function Testimonials() {
  return (
    <section className="testimonials">
      <div className="container">
        <span className="section-label">Happy Campers</span>
        <h2 className="section-title">Tails are wagging.</h2>
        <div className="testi-grid">
          {TESTIMONIALS.map((t) => (
            <div className="testi-card" key={t.name}>
              <p>{t.quote}</p>
              <div className="testi-author">
                <div className="testi-av">{t.emoji}</div>
                <div>
                  <div className="testi-name">{t.name}</div>
                  <div className="testi-dog">{t.dog}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

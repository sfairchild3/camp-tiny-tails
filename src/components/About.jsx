import './About.css'

export default function About() {
  return (
    <section className="about" id="about">
      <div className="container about-inner">
        <div>
          <span className="section-label">Our Story</span>
          <h2 className="section-title">Born on the trails, built for the little ones.</h2>
          <p className="section-body">
            Camp Tiny Tails grew out of a deep love for small dogs and the outdoors. We started with
            Tiny Tails on Trails — guided small-dog hikes — and that same spirit of adventure,
            connection, and pure doggy joy is baked into everything we do here at camp.
            <br /><br />
            We believe your little camper deserves more than a kennel. They deserve sniff trails,
            snuggle time, friends their own size, and a counselor who knows their name, their quirks,
            and their favorite spot to be scratched.
          </p>
        </div>
        <div className="cabin-box">
          <span>🐕</span>
          <span className="cabin-tag">Est. from Tiny Tails on Trails</span>
        </div>
      </div>
    </section>
  )
}

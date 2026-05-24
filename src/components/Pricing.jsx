import { SQUARE_URL_OVERNIGHT, SQUARE_URL_WEEKLY } from '../config'
import './Pricing.css'

export default function Pricing() {
  return (
    <section className="pricing" id="pricing">
      <div className="container">
        <span className="section-label">Tuition Rates</span>
        <h2 className="section-title">Simple, honest pricing.</h2>
        <p className="section-body">Two options, zero hidden fees. Every stay includes meals, walks, playtime, and daily photo updates.</p>

        <div className="price-grid">
          {/* Overnight */}
          <div className="price-card">
            <h3>Overnight Stay</h3>
            <div className="price-amt">$70</div>
            <div className="price-per">per night</div>
            <ul className="price-features">
              <li>Full day camp included</li>
              <li>Cozy sleepover setup</li>
              <li>Evening wind-down walk</li>
              <li>Morning cuddle check-in</li>
              <li>Daily photo updates</li>
              <li>Bedtime snack included</li>
            </ul>
            <a
              href={SQUARE_URL_OVERNIGHT}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-card"
            >
              Book a Night
            </a>
          </div>

          {/* Weekly */}
          <div className="price-card featured">
            <span className="pop-tag">Best Value</span>
            <h3>Extended Stay</h3>
            <div className="price-amt">4 nights + </div>
            <div className="price-per">$441 for 7 nights</div>
            <div className="price-savings">Save 10% vs nightly rate</div>
            <ul className="price-features">
              <li>Everything in Overnight</li>
              <li>Camp portrait included</li>
              <li>Weekly activity report</li>
              <li>Priority booking</li>
            </ul>
            <a
              href={SQUARE_URL_WEEKLY}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-card"
            >
              Book a Full Week
            </a>
          </div>
        </div>

        <p className="price-note">Weekly rate: $70 × 7 nights = $490, less 10% = $441. Deposit required at booking.</p>
      </div>
    </section>
  )
}

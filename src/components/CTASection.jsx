import { SQUARE_URL_OVERNIGHT } from '../config'
import './CTASection.css'

export default function CTASection({ title, subtitle }) {
  return (
    <section className="cta-section">
      <h2>{title || 'Spots fill up fast.'}</h2>
      <p>{subtitle || 'Every camper gets real attention which means we keep it small. Reserve yours today.'}</p>
      <a
        href='/booking'
        target="_self"
        rel="noopener noreferrer"
        className="btn-white"
      >
        Reserve a Spot 🐾
      </a>
    </section>
  )
}

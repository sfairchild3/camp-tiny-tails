import { INTAKE_FORM_URL } from '../config'
import './HowItWorks.css'

const STEPS = [
  {
    num: '1',
    title: 'Book Your Dates',
    desc: 'Request to book using the calander. If approved, pay your deposit securely through Stripe.',
    action: null,
  },
  {
    num: '2',
    title: 'New Campers Only',
    desc: 'First-time visitors fill out your camper details so we can get to know your pup.',
    action: null,
  },
  {
    num: '3',
    title: 'Meet & Greet',
    desc: 'Every new camper gets a free 15-min meet & greet with their camp counselor before their first stay.',
    action: null,
  },
  {
    num: '4',
    title: 'Drop-off Day!',
    desc: "Wave goodbye (maybe cry a little). Your pup already made a new best friend.",
    action: null,
  },
]

export default function HowItWorks() {
  return (
    <section className="how" id="how">
      <div className="container">
        <span className="section-label">Getting Started</span>
        <h2 className="section-title">Enrolling your camper.</h2>
        <div className="steps">
          {STEPS.map((s) => (
            <div className="step" key={s.num}>
              <div className="step-num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {s.action && (
                <a
                  href={s.action.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="step-link"
                >
                  {s.action.label}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

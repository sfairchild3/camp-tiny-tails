import { useEffect, useState } from "react";

/**
 * CampBooking — Square Appointments embed for Camp Tiny Tails
 *
 * HOW TO SET UP:
 * 1. Go to Square Dashboard → Appointments → Booking Site
 * 2. Copy your unique booking URL (looks like: https://square.site/book/XXXXXXXX/camp-tiny-tails)
 * 3. Replace YOUR_SQUARE_BOOKING_URL below with that URL
 *
 * OPTIONAL — inline widget (instead of redirect):
 * Square also offers an embeddable widget script. If you want the calendar
 * to appear directly on the page (no redirect), follow the instructions in
 * the "Inline Embed" section of your Square Appointments dashboard and
 * replace the iframe approach below with the provided <script> tag inside
 * the useEffect loader.
 */

const SQUARE_BOOKING_URL = "https://square.site/book/XXXXXXXX/camp-tiny-tails"; // 👈 Replace this

const services = [
  {
    icon: "☀️",
    name: "Day Camp",
    price: "$45",
    period: "per day",
    desc: "7am – 6pm · Play, walks & enrichment",
    color: "#D4943A",
  },
  {
    icon: "🌙",
    name: "Overnight Stay",
    price: "$70",
    period: "per night",
    desc: "Full day + cozy sleepover included",
    color: "#2D5016",
    featured: true,
  },
  {
    icon: "🏕️",
    name: "Camp Week",
    price: "$295",
    period: "5 nights",
    desc: "Best value · Includes bath & portrait",
    color: "#C4622D",
  },
];

export default function CampBooking() {
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(null);

  // If Square provides an inline widget script, load it here
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleBook = (serviceName) => {
    // Opens Square booking page — optionally append service param if Square supports it
    const url = selected
      ? `${SQUARE_BOOKING_URL}?service=${encodeURIComponent(serviceName)}`
      : SQUARE_BOOKING_URL;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rye&family=Nunito:wght@400;600;700;800&family=Caveat:wght@600&display=swap');

        .ctb-wrap {
          background: #F5EDD6;
          font-family: 'Nunito', sans-serif;
          padding: 72px 20px;
          min-height: 100vh;
        }

        .ctb-inner {
          max-width: 900px;
          margin: 0 auto;
        }

        .ctb-label {
          font-family: 'Caveat', cursive;
          font-size: 1.2rem;
          color: #C4622D;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 8px;
        }

        .ctb-title {
          font-family: 'Rye', serif;
          font-size: clamp(2rem, 5vw, 3rem);
          color: #2D5016;
          margin-bottom: 12px;
          line-height: 1.15;
        }

        .ctb-sub {
          color: #5a5a4a;
          font-size: 1rem;
          line-height: 1.7;
          max-width: 520px;
          margin-bottom: 48px;
        }

        /* Service cards */
        .ctb-services {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }

        @media (max-width: 640px) {
          .ctb-services { grid-template-columns: 1fr; }
        }

        .ctb-card {
          background: white;
          border: 2px solid #E8D5A3;
          border-radius: 18px;
          padding: 28px 22px;
          text-align: center;
          cursor: pointer;
          transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
          position: relative;
          box-shadow: 4px 4px 0 #E8D5A3;
        }

        .ctb-card:hover {
          transform: translateY(-5px);
          box-shadow: 4px 10px 0 #E8D5A3;
        }

        .ctb-card.selected {
          border-color: #2D5016;
          box-shadow: 4px 4px 0 #2D5016;
        }

        .ctb-card.featured-card {
          background: #2D5016;
          border-color: #2D5016;
          box-shadow: 4px 4px 0 #8B5E3C;
        }

        .ctb-card.featured-card .ctb-card-name,
        .ctb-card.featured-card .ctb-card-desc {
          color: #E8D5A3;
        }

        .ctb-popular {
          position: absolute;
          top: -13px;
          left: 50%;
          transform: translateX(-50%);
          background: #C4622D;
          color: white;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 14px;
          border-radius: 20px;
          white-space: nowrap;
        }

        .ctb-card-icon { font-size: 2.4rem; margin-bottom: 10px; display: block; }

        .ctb-card-name {
          font-family: 'Rye', serif;
          font-size: 1.05rem;
          color: #2D5016;
          margin-bottom: 8px;
        }

        .ctb-card-price {
          font-size: 2rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 2px;
        }

        .ctb-card-period {
          font-size: 0.78rem;
          opacity: 0.6;
          margin-bottom: 10px;
        }

        .ctb-card.featured-card .ctb-card-price { color: #D4943A; }
        .ctb-card.featured-card .ctb-card-period { color: #E8D5A3; }

        .ctb-card:not(.featured-card) .ctb-card-price { color: #C4622D; }

        .ctb-card-desc {
          font-size: 0.82rem;
          color: #6a6a5a;
          line-height: 1.5;
        }

        .ctb-check {
          position: absolute;
          top: 12px;
          right: 14px;
          width: 22px;
          height: 22px;
          background: #2D5016;
          color: white;
          border-radius: 50%;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .ctb-card.selected .ctb-check { opacity: 1; }
        .ctb-card.featured-card .ctb-check { background: #D4943A; }

        /* Book button */
        .ctb-btn-wrap {
          text-align: center;
          margin-bottom: 36px;
        }

        .ctb-btn {
          background: #C4622D;
          color: white;
          border: none;
          padding: 16px 44px;
          border-radius: 50px;
          font-family: 'Nunito', sans-serif;
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(196,98,45,0.4);
          transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
          opacity: ${loaded ? 1 : 0};
        }

        .ctb-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(196,98,45,0.5);
        }

        .ctb-btn:active { transform: translateY(0); }

        /* Info row */
        .ctb-info {
          display: flex;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
          padding: 24px;
          background: white;
          border-radius: 16px;
          border: 2px dashed #E8D5A3;
        }

        .ctb-info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          color: #5a5a4a;
          font-weight: 600;
        }

        .ctb-info-item .ico { font-size: 1.1rem; }

        /* Fade in animation */
        @keyframes ctbFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ctb-inner { animation: ctbFadeUp 0.5s ease both; }
      `}</style>

      <div className="ctb-wrap">
        <div className="ctb-inner">
          <span className="ctb-label">🏕️ Ready to Enroll?</span>
          <h2 className="ctb-title">Reserve Your Pup's Spot at Camp</h2>
          <p className="ctb-sub">
            Pick a session below and you'll be taken to our secure booking page to choose dates, complete your camper's profile, and pay your deposit.
          </p>

          {/* Service selector */}
          <div className="ctb-services">
            {services.map((s) => (
              <div
                key={s.name}
                className={`ctb-card${s.featured ? " featured-card" : ""}${selected === s.name ? " selected" : ""}`}
                onClick={() => setSelected(selected === s.name ? null : s.name)}
              >
                {s.featured && <span className="ctb-popular">Most Popular</span>}
                <div className="ctb-check">✓</div>
                <span className="ctb-card-icon">{s.icon}</span>
                <div className="ctb-card-name">{s.name}</div>
                <div className="ctb-card-price">{s.price}</div>
                <div className="ctb-card-period">{s.period}</div>
                <div className="ctb-card-desc">{s.desc}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="ctb-btn-wrap">
            <button
              className="ctb-btn"
              onClick={() => handleBook(selected || "")}
            >
              {selected
                ? `Book ${selected} →`
                : "Book a Session 🐾"}
            </button>
          </div>

          {/* Reassurance row */}
          <div className="ctb-info">
            <div className="ctb-info-item"><span className="ico">🔒</span> Secure booking via Square</div>
            <div className="ctb-info-item"><span className="ico">💳</span> Deposit held at booking</div>
            <div className="ctb-info-item"><span className="ico">📅</span> Free cancellation 48hrs out</div>
            <div className="ctb-info-item"><span className="ico">✉️</span> Confirmation sent instantly</div>
          </div>
        </div>
      </div>
    </>
  );
}

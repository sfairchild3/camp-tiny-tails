import { EMAIL } from '../config'
import CTASection from '../components/CTASection'
import './Gallery.css'

/**
 * HOW TO ADD PHOTOS:
 * 1. Drop your image files into /public/gallery/
 * 2. Add the filename to the PHOTOS array below
 * 3. git push → auto deploys
 *
 * Example:
 *   { src: '/gallery/biscuit-zoomies.jpg', caption: 'Biscuit doing zoomies!' }
 */
const PHOTOS = [
  // Add your photos here once you have them!
  // { src: '/gallery/your-photo.jpg', caption: 'Caption here' },
]

// Placeholder cards shown until real photos are added
const PLACEHOLDERS = [
  { emoji: '🐶', label: 'Your camper here!' },
  { emoji: '🐩', label: 'Submit a photo!' },
  { emoji: '🦴', label: 'Coming soon' },
  { emoji: '🐾', label: 'Your camper here!' },
  { emoji: '🏕️', label: 'Camp memories' },
  { emoji: '😴', label: 'Naptime crew' },
  { emoji: '🌿', label: 'Zoomies hour' },
  { emoji: '🐕', label: 'Your camper here!' },
  { emoji: '📸', label: 'Send us yours!' },
]

export default function Gallery() {
  const hasPhotos = PHOTOS.length > 0

  return (
    <>
      <div className="gallery-hero">
        <span className="section-label gold">Happy Campers</span>
        <h1>The Camp Gallery</h1>
        <p>Real pups, real fun — submitted by their proud camp parents 🐾</p>
      </div>

      <section className="gallery-section">
        <div className="container">
          <div className="masonry-grid">
            {hasPhotos
              ? PHOTOS.map((photo, i) => (
                  <div className="gallery-item" key={i}>
                    <img src={photo.src} alt={photo.caption || 'Camp Tiny Tails camper'} />
                    {photo.caption && <div className="photo-caption">{photo.caption}</div>}
                  </div>
                ))
              : PLACEHOLDERS.map((p, i) => (
                  <div className="gallery-item placeholder" key={i}>
                    <span className="ph-emoji">{p.emoji}</span>
                    <span className="ph-label">{p.label}</span>
                  </div>
                ))
            }
          </div>

          <div className="gallery-submit">
            <h3>Submit Your Camper's Photo!</h3>
            <p>
              Did your pup have a blast at Camp Tiny Tails? Send us your favorite photo
              and we'll feature them in the gallery. Email photos to{' '}
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a> with your dog's name and a fun caption.
            </p>
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to make memories?"
        subtitle="Your pup could be the next camp star."
      />
    </>
  )
}

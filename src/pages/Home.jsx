import Hero from '../components/Hero'
import About from '../components/About'
import Activities from '../components/Activities'
import WhoWeServe from '../components/WhoWeServe'
import Pricing from '../components/Pricing'
import Testimonials from '../components/Testimonials'
import HowItWorks from '../components/HowItWorks'
import CTASection from '../components/CTASection'

export default function Home() {
  return (
    <>
      <Hero />
      <div className="banner">🐾 Now enrolling · Overnight &amp; Weekly stays · Small breeds under 25 lbs · Limited spots 🐾</div>
      <About />
      <Activities />
      <WhoWeServe />
      <Pricing />
      <Testimonials />
      <HowItWorks />
      <CTASection />
    </>
  )
}

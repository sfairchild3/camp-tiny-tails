import './About.css'
import dogTrailPic from '../assets/camp-counselors.png';

export default function About() {
  return (
    <section className="about" id="about">
      <div className="container about-inner">
        <div>
          <span className="section-label">Our Story</span>
          <h2 className="section-title">Meet your camp counselors!</h2>
          <p className="section-body">
            Hi, I’m Shane! I’ve been a certified small-dog person my entire life, and I am so excited to welcome your pup to Camp Tiny Tails. For over a decade, I worked as a professional dog groomer until repetitive stress injuries nudged me into a new career path. But my passion for pups never faded! Back in my undergrad days, I launched a small-dog hiking service called Tiny Tails on Trails and it was an absolute hit. While my day job has since shifted to the corporate world, I couldn’t stay away from the pure joy that pint-sized pups bring into a room. I’ve been happily pet-sitting for the past few years, alongside my trusted 11-year-old Chihuahua co-counselor, Odie. Together, we can't wait to shower your furry friends with love, adventures, and plenty of tail wags!
            <br /><br />
            We believe your little camper deserves more than a kennel. They deserve sniff trails,
            snuggle time, friends their own size, and a counselor who knows their name, their quirks,
            and their favorite spot to be scratched.
          </p>
        </div>
        <div className="cabin-box">
          <span>
          <img src={dogTrailPic} alt="Shane and Odie" className="about-image" />
          </span>
          <span className="cabin-tag">Est.2026 from Tiny Tails on Trails</span>
        </div>
      </div>
    </section>
  )
}

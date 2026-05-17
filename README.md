# 🐾 Camp Tiny Tails

Small dog boarding website — built with React + Vite + React Router.

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Run locally
```bash
npm run dev
```
Opens at http://localhost:5173

### 3. Build for production
```bash
npm run build
```

---

## ⚙️ Configuration — Do This First!

Open `src/config.js` and fill in your real values:

```js
// Square booking URLs (from Square Dashboard → Appointments → Booking Site)
export const SQUARE_URL_OVERNIGHT = "YOUR_SQUARE_OVERNIGHT_URL_HERE";
export const SQUARE_URL_WEEKLY    = "YOUR_SQUARE_WEEKLY_URL_HERE";

// Google Form link for new camper applications
export const INTAKE_FORM_URL = "YOUR_GOOGLE_FORM_URL_HERE";

// Your contact info
export const PHONE    = "(555) 000-0000";
export const EMAIL    = "hello@camptinytails.com";
export const CITY     = "Your City, State";
```

Every button and link on the site pulls from this one file. ✅

---

## 📸 Adding Gallery Photos

1. Drop image files into `/public/gallery/`
2. Open `src/pages/Gallery.jsx`
3. Add entries to the `PHOTOS` array:

```js
const PHOTOS = [
  { src: '/gallery/biscuit-zoomies.jpg', caption: 'Biscuit doing zoomies!' },
  { src: '/gallery/poppy-nap.jpg', caption: 'Rest hour with Poppy 😴' },
]
```

4. `git push` → auto deploys to Hostinger

---

## Project Structure

```
camp-tiny-tails/
├── src/
│   ├── config.js              ← ⭐ All URLs and contact info here
│   ├── App.jsx                ← Routes (Home + Gallery)
│   ├── main.jsx               ← React root
│   ├── index.css              ← Global styles & CSS variables
│   ├── components/
│   │   ├── Navbar.jsx / .css
│   │   ├── Hero.jsx / .css
│   │   ├── About.jsx / .css
│   │   ├── Activities.jsx / .css
│   │   ├── WhoWeServe.jsx / .css
│   │   ├── Pricing.jsx / .css
│   │   ├── Testimonials.jsx / .css
│   │   ├── HowItWorks.jsx / .css
│   │   ├── CTASection.jsx / .css
│   │   └── Footer.jsx / .css
│   └── pages/
│       ├── Home.jsx           ← Main landing page
│       └── Gallery.jsx / .css ← Photo gallery
└── public/
    └── gallery/               ← Drop client photos here
```

## Deploying to Hostinger

1. Push this folder to your GitHub repo
2. Hostinger → connect GitHub repo
3. Build command: `npm run build`
4. Output directory: `dist`
5. Node version: 18 or 20
6. Every `git push` auto-redeploys ✅

---

## Booking Flow

1. Client books on **Square** → pays deposit
2. Square sends confirmation email → include your Google Form link for new campers
3. New campers fill out **Google Form** → saved to Google Sheets automatically
4. Returning clients just book — Square already knows them!

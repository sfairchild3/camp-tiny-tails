# 🐾 Camp Tiny Tails

Small dog boarding website — built with React + Vite.

## Getting Started

### 1. Install Node.js
Download from https://nodejs.org (LTS version)

### 2. Install dependencies
```bash
npm install
```

### 3. Run locally
```bash
npm run dev
```
Opens at http://localhost:5173

### 4. Build for production
```bash
npm run build
```
Uploads the `dist/` folder to Hostinger.

---

## Project Structure

```
camp-tiny-tails/
├── index.html                  # App entry point
├── vite.config.js              # Vite config
├── package.json                # Dependencies
├── src/
│   ├── main.jsx                # React root
│   ├── App.jsx                 # Main app — add your pages here
│   └── components/
│       └── SquareBooking.jsx   # Booking widget
└── public/                     # Static assets (images, favicon)
```

## Booking Setup

1. Create a free Square account at square.com
2. Go to Appointments → Booking Site
3. Copy your booking URL
4. Open `src/components/SquareBooking.jsx`
5. Replace `YOUR_SQUARE_BOOKING_URL` on line 18

## Deploying to Hostinger

1. Push this folder to a GitHub repo
2. In Hostinger → connect your GitHub repo
3. Build command: `npm run build`
4. Output directory: `dist`
5. Every `git push` will auto-redeploy ✅

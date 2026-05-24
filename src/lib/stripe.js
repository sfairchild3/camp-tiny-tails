import { loadStripe } from '@stripe/stripe-js'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

if (!stripePublishableKey) {
  throw new Error('Missing Stripe publishable key. Check your .env file.')
}

let stripePromise
export const getStripe = () => {
  if (!stripePromise) stripePromise = loadStripe(stripePublishableKey)
  return stripePromise
}

// ── PRICING CONSTANTS ──────────────────────────────────
export const BASE_NIGHTLY_RATE   = 70   // first dog
export const EXTRA_DOG_RATE      = 10   // per additional dog per night
export const DEPOSIT_AMOUNT      = 50
export const DISCOUNT_THRESHOLD  = 5    // nights before discount kicks in
export const DISCOUNT_RATE       = 0.10 // 10%
export const MAX_DOGS            = 2

// ── PRICING CALCULATOR ─────────────────────────────────
export function calculateBooking(checkIn, checkOut, dogCount = 1) {
  const start = new Date(checkIn)
  const end   = new Date(checkOut)
  const nights = Math.round((end - start) / (1000 * 60 * 60 * 24))

  if (nights <= 0) return null

  const dogs           = Math.min(dogCount, MAX_DOGS)
  const nightlyRate    = BASE_NIGHTLY_RATE + (dogs - 1) * EXTRA_DOG_RATE
  const discountApplied = nights >= DISCOUNT_THRESHOLD
  const subtotal       = discountApplied
    ? nightlyRate * nights * (1 - DISCOUNT_RATE)
    : nightlyRate * nights

  return {
    nights,
    dogCount: dogs,
    nightlyRate,
    discountApplied,
    subtotal:      Math.round(subtotal * 100) / 100,
    depositAmount: DEPOSIT_AMOUNT,
    balanceDue:    Math.round((subtotal - DEPOSIT_AMOUNT) * 100) / 100,
  }
}

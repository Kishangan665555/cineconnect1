/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  razorpayService.ts
 *
 *  Handles real Razorpay payment integration.
 *
 *  HOW TO USE:
 *  1. Replace RAZORPAY_KEY_ID below with your actual Razorpay Test/Live key
 *     (starts with rzp_test_ or rzp_live_)
 *  2. For full backend verification, create an order on your server and pass
 *     the order_id to openRazorpayCheckout(). For frontend-only testing,
 *     order_id can be omitted.
 *  3. The handler callback receives razorpay_payment_id on success.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── YOUR RAZORPAY KEY ─────────────────────────────────────────────────────────
// Replace this with your actual Razorpay key ID
// Test key format:  rzp_test_XXXXXXXXXXXXXXXX
// Live key format:  rzp_live_XXXXXXXXXXXXXXXX
export const RAZORPAY_KEY_ID = 'rzp_test_YourKeyHere';

export interface RazorpayCheckoutOptions {
  amount: number;           // in ₹ (will be converted to paise internally)
  bookingId: string;
  movieTitle: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  orderId?: string;         // from backend order creation (optional)
  onSuccess: (paymentId: string) => void;
  onFailure: (error: string) => void;
  onDismiss: () => void;
}

/**
 * Opens the Razorpay checkout popup.
 * Requires the Razorpay script to be loaded (added to index.html).
 */
export function openRazorpayCheckout(opts: RazorpayCheckoutOptions): void {
  if (typeof window.Razorpay === 'undefined') {
    opts.onFailure('Razorpay SDK not loaded. Please check your internet connection.');
    return;
  }

  const options: RazorpayOptions = {
    key: RAZORPAY_KEY_ID,
    amount: Math.round(opts.amount * 100), // convert ₹ to paise
    currency: 'INR',
    name: 'CineConnect',
    description: `${opts.movieTitle} — Booking #${opts.bookingId.slice(0, 10).toUpperCase()}`,
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100&h=100&fit=crop',
    ...(opts.orderId ? { order_id: opts.orderId } : {}),
    prefill: {
      name:    opts.userName,
      email:   opts.userEmail,
      contact: opts.userPhone,
    },
    notes: {
      booking_id:  opts.bookingId,
      movie_title: opts.movieTitle,
    },
    theme: {
      color: '#e53935',
    },
    modal: {
      ondismiss: opts.onDismiss,
      backdropclose: false,
      escape: false,
      animation: true,
    },
    handler: (response: RazorpayResponse) => {
      if (response.razorpay_payment_id) {
        opts.onSuccess(response.razorpay_payment_id);
      } else {
        opts.onFailure('Payment failed — no payment ID received.');
      }
    },
  };

  try {
    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    opts.onFailure(`Failed to open payment: ${err}`);
  }
}

/**
 * Check if Razorpay key is configured (not the placeholder).
 */
export function isRazorpayConfigured(): boolean {
  const key: string = RAZORPAY_KEY_ID;
  return (
    key !== 'rzp_test_YourKeyHere' &&
    key.startsWith('rzp_') &&
    key.length > 20
  );
}

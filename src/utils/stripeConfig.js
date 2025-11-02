// Stripe configuration
// Replace with your actual Stripe publishable key from https://dashboard.stripe.com/apikeys
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_51YourKeyHere";

// Stripe configuration helper
export const stripeConfig = {
  publishableKey: STRIPE_PUBLISHABLE_KEY,
};


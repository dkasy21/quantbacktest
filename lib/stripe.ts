import Stripe from 'stripe';
const key = process.env.STRIPE_SECRET_KEY;
if (!key && process.env.NODE_ENV === 'production') console.warn('STRIPE_SECRET_KEY not set');
export const stripe = new Stripe(key ?? 'sk_test_placeholder', { apiVersion: '2024-06-20' });

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
export async function POST(req) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const priceId = process.env.STRIPE_PRICE_ID_PRO;
  if (!priceId) return NextResponse.json({ error: 'Stripe not configured.' }, { status: 500 });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }
  const origin = req.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const sessionStripe = await stripe.checkout.sessions.create({ mode: 'subscription', customer: customerId, line_items: [{ price: priceId, quantity: 1 }], success_url: `${origin}/dashboard?upgraded=1`, cancel_url: `${origin}/dashboard?upgraded=0`, metadata: { userId: user.id } });
  return NextResponse.json({ url: sessionStripe.url });
}

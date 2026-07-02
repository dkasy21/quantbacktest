import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
export async function POST(req) {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 });
  const rawBody = await req.text();
  let event; try { event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret); } catch (err) { return NextResponse.json({ error: `Invalid signature: ${err instanceof Error ? err.message : String(err)}` }, { status: 400 }); }
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (userId) await prisma.user.update({ where: { id: userId }, data: { plan: 'pro' } });
      break;
    }
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const isActive = sub.status === 'active' || sub.status === 'trialing';
      const user = await prisma.user.findFirst({ where: { stripeCustomerId: sub.customer } });
      if (user) await prisma.user.update({ where: { id: user.id }, data: { plan: isActive ? 'pro' : 'free' } });
      break;
    }
    default: break;
  }
  return NextResponse.json({ received: true });
}

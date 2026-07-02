import Link from 'next/link';
export const metadata = { title: 'Refund Policy — QuantBacktest' };
export default function RefundsPage() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-12 space-y-6 text-sm text-gray-300">
      <Link href="/" className="text-brand-500 hover:underline">&larr; Back home</Link>
      <h1 className="text-2xl font-bold text-white">Refund Policy</h1>
      <p className="text-gray-500">Last updated: [DATE].</p>
      <section className="space-y-3"><h2 className="text-lg font-semibold text-white">Subscriptions</h2><p>QuantBacktest Pro bills in advance and renews automatically. You can cancel anytime; you'll keep Pro access until the end of the current period. We don't prorate unused time.</p></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold text-white">7-day refund window</h2><p>First-time subscribers can get a full refund within 7 days of their first charge — contact [SUPPORT EMAIL]. Applies once per customer.</p></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold text-white">After 7 days</h2><p >Refunds outside this window are handled case-by-case for billing errors or extended outages.</p></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold text-white">How to request</h2><p >Email [SUPPORT EMAIL] with your account email and reason.</p></section>
    </main>
  );
}

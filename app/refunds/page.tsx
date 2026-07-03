import Link from 'next/link';

export const metadata = { title: 'Refund Policy — QuantBacktest' };

export default function RefundsPage() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-12 space-y-8 text-sm text-gray-300">
      <Link href="/" className="text-brand-500 hover:underline">
        ← Back home
      </Link>

      <h1 className="text-2xl font-bold text-white">Refund Policy</h1>
      <p className="text-gray-500">Last updated: 2024.</p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Monthly plans</h2>
        <p>
          Monthly subscriptions may be cancelled at any time. If you cancel within 48 hours of
          your initial purchase and have not run more than 5 backtests, we will issue a full
          refund. After that window, no refunds are issued for partial months.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Annual plans</h2>
        <p>
          Annual subscribers may request a prorated refund within 14 days of purchase if they
          are not satisfied. After 14 days, no refunds are issued.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">How to request a refund</h2>
        <p>
          Email support@quantbacktest.com with your account email and reason for the refund.
          We aim to respond within 2 business days. Approved refunds are processed within
          5–10 business days depending on your payment provider.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Exceptions</h2>
        <p>
          Accounts terminated for violating our Terms of Service are not eligible for refunds.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Questions</h2>
        <p>
          Contact us at support@quantbacktest.com or visit our{' '}
          <Link href="/terms" className="text-brand-500 hover:underline">Terms of Service</Link>.
        </p>
      </section>
    </main>
  );
}

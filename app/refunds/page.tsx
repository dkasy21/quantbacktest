import Link from 'next/link';

export const metadata = { title: 'Refund Policy — QuantBacktest' };

export default function RefundsPage() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-12 space-y-6 text-sm text-gray-300">
      <Link href="/" className="text-brand-500 hover:underline">&larr; Back home</Link>
      <h1 className="text-2xl font-bold text-white">Refund Policy</h1>
      <p className="text-gray-500">Last updated: [DATE].</p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Subscriptions</h2>
        <p>
          QuantBacktest Pro is billed [monthly/annually] in advance and renews automatically. You
          can cancel anytime from your account — cancelling stops future renewals, jwyou can
          keep Pro access until the end of the period you already paid for. We don't prorate or
          refund the unused portion of a current billing period when you cancel.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">First-time refund window</h2>
        <p>
          If you're a first-time subscriber and the product genuinely doesn't work for you,
          contact [SUPPORT EMAIL] within 7 days of your first charge and we'll refund that charge
          in full, no questions asked. This applies once per customer.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">After the first 7 days</h2>
        <p>
          Refunds outside the window above are handled case-by-case — for example, a billing
          error, a duplicate charge, or a confirmed extended outage on our side. Contact
          [SUPPORT EMAIL] and we'll review it.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Lifetime / one-time deals</h2>
        <p>
          If you purchased a one-time lifetime-access deal (e.g. via a launch promotion), the
          7-day window above still applies from the date of purchase. After that, the purchase is
          final, since there's no recurring charge to cancel.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Chargebacks</h2>
        <p>
          If you have a billing issue, please contact us before filing a chargeback with your
          bank — we can resolve most issues faster directly, and chargebacks can result in
          immediate account suspension.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">How to request a refund</h2>
        <p>Email [SUPPORT EMAIL] with the email address on your account and the reason for the request.</p>
      </section>
    </main>
  );
}

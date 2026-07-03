import Link from 'next/link';

export const metadata = { title: 'Terms of Service — QuantBacktest' };

export default function TermsPage() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-12 space-y-8 text-sm text-gray-300">
      <Link href="/" className="text-brand-500 hover:underline">
        ← Back home
      </Link>

      <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
      <p className="text-gray-500">
        Last updated: 2024. Draft only — have a lawyer review before relying on it.
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">1. About QuantBacktest</h2>
        <p>
          QuantBacktest is a research tool for simulating algorithmic trading strategies
          against historical market data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">2. Not investment advice</h2>
        <p>
          This Service is a research and education tool only. It is not investment advice,
          a buy/sell recommendation, or a signal service. We are not a registered investment
          adviser or broker-dealer. Simulated past performance is not indicative of future results.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">3. Accounts</h2>
        <p>
          You must provide accurate registration information and be at least 18 years old.
          You are responsible for all activity under your account.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">4. Subscriptions</h2>
        <p>
          Paid plans renew automatically until you cancel. Cancellation takes effect at the
          end of the current billing period. See our{' '}
          <Link href="/refunds" className="text-brand-500 hover:underline">Refund Policy</Link>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">5. Data accuracy</h2>
        <p>
          Market data is sourced from third-party providers and may be delayed or incomplete.
          We make no guarantee of accuracy, completeness, or timeliness.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">6. Acceptable use</h2>
        <p>
          Do not reverse-engineer the Service, scrape data beyond normal use, resell data,
          circumvent billing, or use the Service for any unlawful purpose.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">7. Disclaimer</h2>
        <p>
          The Service is provided as-is without warranties of any kind. We do not warrant
          that it will be uninterrupted, error-free, or secure.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">8. Liability limit</h2>
        <p>
          To the maximum extent permitted by law, our total liability for any claim will not
          exceed what you paid us in the twelve months prior to the claim.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">9. Termination</h2>
        <p>
          We may suspend access for violations of these terms. You may cancel at any time.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">10. Changes</h2>
        <p>
          We may update these terms. Material changes will be communicated via email or the Service.
          Continued use constitutes acceptance.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">11. Contact</h2>
        <p>Questions: support@quantbacktest.com</p>
      </section>
    </main>
  );
}

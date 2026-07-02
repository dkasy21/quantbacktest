import Link from 'next/link';

export const metadata = { title: 'Terms of Service — QuantBacktest' };

export default function TermsPage() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-12 space-y-6 text-sm text-gray-300">
      <Link href="/" className="text-brand-500 hover:underline">&larr; Back home</Link>
      <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
      <p className="text-gray-500">
        Last updated: [DATE]. These terms are a starting draft, not a substitute for review by a
        lawyer licensed in your jurisdiction — have one look this over before you rely on it.
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">1. Who we are</h2>
        <p>
          QuantBacktest ("we", "us", "the Service") is operated by [YOUR COMPANY / LEGAL NAME],
          [ADDRESS / JURISDICTION]. Questions about these terms can be sent to
          [SUPPORT EMAIL].
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">2. What the Service is — and isn't</h2>
        <p>
          QuantBacktest lets you define trading strategy rules and run them against historical
          price data to see simulated, hypothetical results. <strong>It is a research and
          education tool. It is not investment advice, a recommendation to buy or sell any
          security or instrument, or a signal service.</strong> We are not a registered
          investment adviser, broker-dealer, or financial planner, and nothing in the Service
          should be treated as personalized financial advice.
        </p>
        <p>
          Backtested and simulated performance has inherent limitations and does not represent
          actual trading. It does not account for all the economic and market factors that would
          impact real trading decisions, including liquidity constraints, slippage beyond what is
          modeled, emotional/behavioral factors, and changes in market regimes. No representation
          is being made that any account will or is likely to achieve results similar to those
          shown. Past performance — simulated or actual — is not indicative of future results.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">3. Accounts</h2>
        <p>
          You must provide accurate information when creating an account and are responsible for
          activity that occurs under it. You must be at least 18 years old (or the age of
          majority in your jurisdiction) to use the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">4. Subscriptions and billing</h2>
        <p>
          Paid plans renew automatically on the billing cycle shown at checkout until cancelled.
          You can cancel at any time from your account; cancellation takes effect at the end of
          the current billing period unless stated otherwise. See our{' '}
          <Link href="/refunds" className="text-brand-500 hover:underline">Refund Policy</Link>{' '}
          for details on refunds. Prices may change with reasonable advance notice.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">5. Data sources and accuracy</h2>
        <p>
          Historical market data is provided by third-party data providers and may be delayed,
          incomplete, or inaccurate. We do not guarantee the accuracy, completeness, or
          timeliness of any data, indicator, or signal calculation (including ICT-style
          structural signals and volume-based proxies, which are rule-based approximations, not
          a substitute for independent analysis).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">6. Acceptable use</h2>
        <p>
          You agree not to: reverse-engineer or scrape the Service beyond normal use; resell or
          redistribute the underlying market data; attempt to circumvent usage limits or billing;
          or use the Service for any unlawful purpose.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">7. Disclaimer of warranties</h2>
        <p>
          The Service is provided "as is" and "as available" without warranties of any kind,
          express or implied, including merchantability, fitness for a particular purpose, and
          non-infringement. We do not warrant that the Service will be uninterrupted, error-free,
          or secure.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">8. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, [YOUR COMPANY / LEGAL NAME] will not be liable
          for any indirect, incidental, special, consequential, or punitive damages, or any loss
          of profits, revenue, or trading losses, arising from your use of the Service or
          reliance on any backtest result. Our total liability for any claim arising out of these
          terms will not exceed the amount you paid us in the twelve (12) months before the claim
          arose.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">9. Termination</h2>
        <p>
          We may suspend or terminate your access for violation of these terms. You may stop
          using the Service and cancel your subscription at any time.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">10. Changes to these terms</h2>
        <p>
          We may update these terms from time to time. Material changes will be communicated via
          the Service or by email. Continued use after changes take effect constitutes acceptance.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">11. Governing law</h2>
        <p>These terms are governed by the laws of [YOUR JURISDICTION], without regard to conflict-of-law principles.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">12. Contact</h2>
        <p>Questions: [SUPPORT EMAIL]</p>
      </section>
    </main>
  );
}

import Link from 'next/link';

export const metadata = { title: 'Privacy Policy — QuantBacktest' };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-12 space-y-6 text-sm text-gray-300">
      <Link href="/" className="text-brand-500 hover:underline">&larr; Back home</Link>
      <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
      <p className="text-gray-500">
        Last updated: [DATE]. This is a starting draft — review against your actual data
        practices and applicable law (e.g. GDPR/CCPA) before relying on it, and update it if those
        practices change.
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">1. What we collect</h2>
        <p>When you use QuantBacktest, we collect:</p>
        <p>
          <strong>Account data:</strong> name, email address, and a hashed password (we never
          store your password in plain text).
        </p>
        <p>
          <strong>Strategy and usage data:</strong> the strategies you save, the backtests you
          run (symbol, date range, parameters, and results), and basic usage metrics (e.g. number
          of backtests run, for plan-limit enforcement).
        </p>
        <p>
          <strong>Payment data:</strong> if you subscribe to a paid plan, payments are processed
          by Stripe. We do not see or store your full card number — Stripe handles that and
          shares with us only what's needed to manage your subscription (e.g. plan status,
          a Stripe customer ID).
        </p>
        <p>
          <strong>Technical data:</strong> standard server logs (IP address, browser/user agent,
          timestamps) for security and debugging.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">2. How we use it</h2>
        <p>
          To provide and maintain the Service, authenticate you, run your backtests, enforce plan
          limits, process payments, respond to support requests, and improve the product. We do
          not sell your personal data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">3. Who we share it with</h2>
        <p>We share data with the third parties needed to run the Service:</p>
        <p>
          <strong>Stripe</strong> (payment processing), <strong>[YOUR HOSTING PROVIDER, e.g. Vercel]</strong>{' '}
          (application hosting), <strong>[YOUR DATABASE PROVIDER]</strong> (data storage), and{' '}
          <strong>[YOUR MARKET DATA PROVIDER, e.g. Twelve Data]</strong> (to fetch the price data
          your backtests run against — only the symbol/date range you request is sent, not your
          identity). We don't share your data with anyone else except where required by law.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">4. Cookies</h2>
        <p>
          We use a session cookie to keep you signed in. We don't currently use third-party
          advertising or tracking cookies. If that changes, this policy will be updated and you'll
          be asked to consent where required.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">5. Data retention</h2>
        <p>
          We retain account and strategy data for as long as your account is active. You can
          request deletion of your account and associated data at any time by contacting
          [SUPPORT EMAIL]; we'll delete it within a reasonable time, except where we're required
          to retain billing records by law.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">6. Your rights</h2>
        <p>
          Depending on where you live, you may have the right to access, correct, export, or
          delete your personal data, and to object to certain processing. Contact [SUPPORT EMAIL]
          to exercise these rights.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">7. Security</h2>
        <p>
          We use industry-standard measures (password hashing, encrypted connections) to protect
          your data, but no system is 100% secure and we can't guarantee absolute security.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">8. Children</h2>
        <p>The Service is not directed to anyone under 18, and we do not knowingly collect data from children.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">9. Changes to this policy</h2>
        <p>We may update this policy from time to time; material changes will be announced via the Service or by email.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">10. Contact</h2>
        <p>Questions about this policy: [SUPPORT EMAIL]</p>
      </section>
    </main>
  );
}

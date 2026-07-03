import Link from 'next/link';

export const metadata = { title: 'Privacy Policy — QuantBacktest' };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-12 space-y-8 text-sm text-gray-300">
      <Link href="/" className="text-brand-500 hover:underline">
        ← Back home
      </Link>

      <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
      <p className="text-gray-500">Last updated: 2024.</p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">1. What we collect</h2>
        <p>
          We collect information you provide directly: name, email address, and password
          (stored as a secure hash) when you create an account. We also collect usage data
          such as strategies you create and backtests you run.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">2. How we use it</h2>
        <p>
          We use your information to provide the Service, process payments, send transactional
          emails, and improve the product. We do not sell your personal data to third parties.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">3. Payment data</h2>
        <p>
          Payments are processed by Stripe. We do not store credit card numbers. Stripe's
          privacy policy governs how your payment data is handled.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">4. Cookies</h2>
        <p>
          We use essential cookies for authentication (session tokens). We do not use
          advertising or tracking cookies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">5. Data retention</h2>
        <p>
          We retain your data for as long as your account is active. You may request deletion
          of your account and associated data at any time by contacting support.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">6. Security</h2>
        <p>
          We use industry-standard security practices including encrypted connections (HTTPS)
          and hashed passwords. No method of transmission is 100% secure.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">7. Third-party services</h2>
        <p>
          We use Vercel for hosting, Stripe for payments, and third-party APIs for market data.
          These services have their own privacy policies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">8. Your rights</h2>
        <p>
          You may access, correct, or delete your personal data by contacting us. Depending
          on your jurisdiction, you may have additional rights under applicable law.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">9. Changes</h2>
        <p>
          We may update this policy. Material changes will be communicated via email.
          Continued use constitutes acceptance.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">10. Contact</h2>
        <p>Privacy questions: support@quantbacktest.com</p>
      </section>
    </main>
  );
}

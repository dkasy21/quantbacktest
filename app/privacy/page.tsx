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
        <p><strong>Account data:</strong> name, email address, and a hashed password.</p>
        <p><strong>Strategy and usage data:</strong> the strategies you save and backtests you run.</p>
        <p><strong>Payment data:</strong> processed by Stripe; we don't store card numbers.</p>
        <p><strong>Technical data:</strong> standard server logs for security.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">2. How we use it</h2>
        <p>To provide the Service, authenticate you, run backtests, process payments, and improve the product. We do not sell your data.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">3. Who we share it with</h2>
        <p>Stripe (payment), Vercel (hosting), and your database and market data providers. We don't share your data with anyone else except where required by law.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">4. Cookies</h2>
        <p>We use a session cookie to keep you signed in. No third-party advertising cookies.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">5. Data retention</h2>
        <p>We retain data while your account is active. Request deletion at [SUPPORT EMAIL].</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">6. Your rights</h2>
        <p>Contact [SUPPORT EMAIL] to access, correct, or delete your data.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">7. Contact</h2>
        <p>[SUPPORT EMAIL]</p>
      </section>
    </main>
  );
}

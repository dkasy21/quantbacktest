import Link from 'next/link';
export const metadata = { title: 'Terms of Service — QuantBacktest' };
export default function TermsPage() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-12 space-y-6 text-sm text-gray-300">
      <Link href="/" className="text-brand-500 hover:underline">&larr; Back home</Link>
      <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
      <p className="text-gray-500">Last updated: [DATE]. Draft only — review with a lawyer before relying on it.</p>
      <section className="space-y-3"><h2 className="text-lg font-semibold text-white">1. Who we are</h2><p>QuantBacktest is operated by [YOUR COMPANY / LEGAL NAME], [ADDRESS / JURISDICTION]. Contact: [SUPPORT EMAIL].</p></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold text-white">2. Not investment advice</h2><p <QuantBacktest is a research and education tool. <strong>It is not investment advice.</strong> Past performance is not indicative of future results.</p></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold text-white">3. Accounts</h2><p>You must be 18+ and provide accurate information.</p></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold text-white">4. Subscriptions</h2><p>Paid plans renew automatically until cancelled. See our <Link href="/refunds" className="text-brand-500">Refund Policy</Link>.</p></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold text-white">5. Data accuracy</h2><p >Historical data is from third-party providers and may be incomplete.</p></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold text-white">6. Acceptable use</h2><p >No scraping, reselling data, or circumventing limits.</p></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold text-white">7. Disclaimer</h2><p>Service provided "as is" without warranties.</p></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold text-white">8. Liability</h2><p>[YOUR COMPANY] is not liable for indirect damages or trading losses. Total liability capped at payments made in the prior 12 months.</p></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold text-white">9. Governing law</h2><p>Laws of [YOUR JURISDICTION].</p></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold text-white">10. Contact</h2><p>[SUPPORT EMAIL]</p></section>
    </main>
  );
}

import Link from 'next/link';
import Footer from '@/components/Footer';

const FEATURES = [
  {
    title: 'No-code rule builder',
    body: 'Combine indicators, ICT structure (FVGs, order blocks, BOS/MSS, liquidity sweeps), and volume signals with AND/OR logic — no coding required.',
  },
  {
    title: 'Advanced expression mode',
    body: 'Need something the dropdowns don’t cover? Drop into a free-form formula referencing any signal you’ve defined.',
  },
  {
    title: 'Instant results',
    body: 'Get an equity curve, trade log, win rate, profit factor, drawdown, and Sharpe ratio in seconds — on any symbol, any date range.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="text-xl font-bold">QuantBacktest</span>
        <nav className="flex gap-4 text-sm">
          <Link href="/login" className="hover:text-brand-500">Log in</Link>
          <Link href="/signup" className="btn-primary text-sm">Get started</Link>
        </nav>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          Turn a trading idea into a backtest<br />in minutes, not days.
        </h1>
        <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
          Describe your strategy &mdash; indicators, ICT concepts, volume signals, or your own
          custom expression &mdash; and get a full backtest with charts and stats on any instrument.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/signup" className="btn-primary">Start backtesting free</Link>
          <Link href="/login" className="px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-500">
            Log in
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-6">
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-gray-400 text-sm">{f.body}</p>
          </div>
        ))}
      </section>

      <Footer />
    </main>
  );
}

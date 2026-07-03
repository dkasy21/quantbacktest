import Link from 'next/link';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold">QuantBacktest</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-gray-300 hover:text-white">Log in</Link>
          <Link
            href="/signup"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-24 px-6 max-w-4xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
          Turn a trading idea into a backtest
          <br />in minutes, not days.
        </h1>
        <p className="text-2xl text-gray-400 mb-10">
          Describe your strategy &mdash; indicators, ICT concepts, volume signals, or your own
          custom expression &mdash; and get a full backtest with charts and stats on any instrument.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/signup"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-xl text-xl"
          >
            Start backtesting free
          </Link>
          <Link
            href="/login"
            className="border border-white text-white font-bold px-8 py-4 rounded-xl text-xl hover:bg-white/10"
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-4xl mx-auto px-6 pb-24 grid gap-6">
        <div className="bg-[#1a1a1a] rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-3">No-code rule builder</h2>
          <p className="text-gray-400 text-lg">
            Combine indicators, ICT structure (FVGs, order blocks, BOS/MSS, liquidity sweeps),
            and volume signals with AND/OR logic &mdash; no coding required.
          </p>
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-3">Advanced expression mode</h2>
          <p className="text-gray-400 text-lg">
            Need something the dropdowns don&rsquo;t cover? Drop into a free-form formula
            referencing any signal you&rsquo;ve defined.
          </p>
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-3">Instant results</h2>
          <p className="text-gray-400 text-lg">
            Get an equity curve, trade log, win rate, profit factor, drawdown, and Sharpe
            ratio in seconds &mdash; on any symbol, any date range.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

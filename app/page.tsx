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
          <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl">
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-24 px-6 max-w-4xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
          Describe a strategy.<br />Get a backtest.
        </h1>
        <p className="text-2xl text-gray-400 mb-10">
          Type your trading idea in plain English — our AI converts it into precise rules and backtests it instantly on stocks, futures, crypto and more.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-xl text-xl">
            Start for free
          </Link>
          <Link href="/login" className="border border-white text-white font-bold px-8 py-4 rounded-xl text-xl hover:bg-white/10">
            Log in
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 pb-16 grid gap-6 md:grid-cols-3">
        <div className="bg-[#1a1a1a] rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">✍️</div>
          <h3 className="font-bold text-lg mb-2">Describe it</h3>
          <p className="text-gray-400 text-sm">Type your strategy in plain English — ICT concepts, indicators, anything.</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">✦</div>
          <h3 className="font-bold text-lg mb-2">AI parses it</h3>
          <p className="text-gray-400 text-sm">Our AI converts your words into precise entry/exit rules automatically.</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="font-bold text-lg mb-2">See results</h3>
          <p className="text-gray-400 text-sm">Get equity curve, win rate, profit factor, Sharpe ratio in seconds.</p>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-extrabold text-center mb-10">Simple pricing</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 flex flex-col">
            <div className="mb-6">
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Free</p>
              <p className="text-5xl font-extrabold">$0</p>
              <p className="text-gray-400 mt-1">1 backtest per week</p>
            </div>
            <ul className="space-y-3 text-gray-300 text-sm flex-1 mb-8">
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> AI strategy parser</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Stocks &amp; ETFs (SPY, QQQ, AAPL, TSLA, NVDA…)</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Crypto (BTC, ETH, SOL…)</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Forex (EURUSD, GBPUSD…)</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Historical data from 2020</li>
              <li className="flex items-start gap-2"><span className="text-gray-600 mt-0.5">✗</span> <span className="text-gray-500">Futures (MNQ, ES, NQ, XAUUSD…)</span></li>
            </ul>
            <Link href="/signup" className="block text-center border border-white/20 hover:border-white/40 text-white font-semibold py-3 rounded-xl transition-colors">
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-indigo-900/40 border border-indigo-500/50 rounded-2xl p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">FUTURES PRO</div>
            <div className="mb-6">
              <p className="text-indigo-300 text-sm font-semibold uppercase tracking-wider mb-2">Pro</p>
              <p className="text-5xl font-extrabold">$99<span className="text-2xl text-gray-400 font-normal">/mo</span></p>
              <p className="text-gray-400 mt-1">Unlimited backtests</p>
            </div>
            <ul className="space-y-3 text-gray-200 text-sm flex-1 mb-8">
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Everything in Free</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> <strong>Futures: MNQ, NQ, MES, ES, YM, RTY</strong></li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> <strong>Commodities: XAUUSD, XAGUSD, Crude Oil</strong></li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Indices: SPX, NDX, DJI, VIX</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Unlimited backtests</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Full intraday history (5m, 15m, 1h)</li>
            </ul>
            <Link href="/signup" className="block text-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors">
              Upgrade to Pro →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

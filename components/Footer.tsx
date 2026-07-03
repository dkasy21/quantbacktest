import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="max-w-5xl mx-auto px-6 pb-12 pt-6 text-xs text-gray-500 space-y-3">
      <p>
        <strong>Not investment advice.</strong> QuantBacktest is a research and education tool.
        Backtested results are hypothetical, do not reflect actual trading, and past performance
        — simulated or real — does not guarantee future results. Nothing on this site
        is a recommendation to buy or sell any security or instrument. Trading involves risk of
        loss.
      </p>
      <p>
        Historical data is sourced from third-party providers and may be delayed, incomplete, or
        inaccurate. ICT/structural signals (FVGs, order blocks, BOS/MSS, liquidity sweeps, etc.)
        are rule-based approximations derived from price/volume data, not a substitute for manual
        chart analysis. Volume/order-flow signals are derived from OHLCV volume, not real bid/ask
        or Level 2 order flow.
      </p>
      <div className="flex gap-4 pt-1">
        <Link href="/terms" className="hover:text-gray-300 underline">Terms of Service</Link>
        <Link href="/privacy" className="hover:text-gray-300 underline">Privacy Policy</Link>
        <Link href="/refunds" className="hover:text-gray-300 underline">Refund Policy</Link>
      </div>
    </footer>
  );
}

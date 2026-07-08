'use client';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason: 'futures' | 'quota' | 'orderflow';
  resetAt?: string | null;
}

export default function UpgradeModal({ open, onClose, reason, resetAt }: UpgradeModalProps) {
  if (!open) return null;

  const daysLeft = resetAt
    ? Math.ceil((new Date(resetAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="text-5xl mb-4 text-center">
          {reason === 'quota' ? '⏳' : reason === 'orderflow' ? '⚡' : '🔒'}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-2">
          {reason === 'quota' ? 'Weekly Limit Reached' : 'Pro Plan Required'}
        </h2>

        {/* Body */}
        <p className="text-gray-400 text-center text-sm leading-relaxed mb-6">
          {reason === 'futures'
            ? 'Futures & index symbols (MNQ, ES, NQ, XAUUSD, SPX…) require a Pro subscription. Upgrade to backtest any instrument with full historical data from 2020.'
            : reason === 'orderflow'
            ? 'Orderflow signals (delta, CVD, buy ratio, delta divergence) use real buy/sell volume data from Binance.US and require a Pro subscription. Upgrade to unlock them on any crypto pair.'
            : `Free plan includes 1 backtest per week.${daysLeft && daysLeft > 0 ? ` Your quota resets in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.` : ''} Upgrade to Pro for unlimited backtests on every instrument.`}
        </p>

        {/* Plan features */}
        <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-4 mb-6">
          <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
            Pro — $99 / month
          </p>
          <ul className="space-y-2 text-sm text-gray-200">
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Unlimited backtests</li>
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Futures: MNQ, NQ, MES, ES, YM, RTY</li>
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Commodities: XAUUSD, XAGUSD, Crude Oil</li>
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Indices: SPX, NDX, DJI, VIX</li>
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Full intraday history (5m, 15m, 1h)</li>
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Crypto orderflow: delta, CVD, buy ratio, divergence</li>
          </ul>
        </div>

        {/* CTA */}
        <a
          href="/api/stripe/checkout"
          className="block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors mb-3"
        >
          Upgrade to Pro →
        </a>
        <button
          onClick={onClose}
          className="block w-full text-center text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

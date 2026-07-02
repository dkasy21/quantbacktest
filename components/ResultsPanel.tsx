'use client';

import type { BacktestResult } from '@/lib/backtest/types';

function StatCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-semibold ${positive === undefined ? '' : positive ? 'text-green-400' : 'text-red-400'}`}>
        {value}
      </p>
    </div>
  );
}

export default function ResultsPanel({ result }: { result: BacktestResult }) {
  const m = result.metrics;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total return" value={`${m.totalReturnPct.toFixed(2)}%`} positive={m.totalReturnPct >= 0} />
        <StatCard label="Final equity" value={`$${m.finalEquity.toFixed(2)}`} />
        <StatCard label="Total trades" value={String(m.totalTrades)} />
        <StatCard label="Win rate" value={`${m.winRate.toFixed(1)}%`} />
        <StatCard label="Profit factor" value={Number.isFinite(m.profitFactor) ? m.profitFactor.toFixed(2) : '∞'} />
        <StatCard label="Avg win" value={`${m.avgWinPct.toFixed(2)}%`} positive />
        <StatCard label="Avg loss" value={`${m.avgLossPct.toFixed(2)}%`} positive={false} />
        <StatCard label="Max drawdown" value={`${m.maxDrawdownPct.toFixed(2)}%`} positive={false} />
        <StatCard label="Sharpe ratio" value={m.sharpeRatio.toFixed(2)} />
      </div>

      <div className="card p-4 overflow-x-auto">
        <h3 className="font-semibold mb-3">Trade log</h3>
        {result.trades.length === 0 ? (
          <p className="text-sm text-gray-500">No trades were generated for this strategy over the selected range.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-left">
              <tr>
                <th className="py-1 pr-4">Dir</th>
                <th className="py-1 pr-4">Entry</th>
                <th className="py-1 pr-4">Exit</th>
                <th className="py-1 pr-4">Entry $</th>
                <th className="py-1 pr-4">Exit $</th>
                <th className="py-1 pr-4">Reason</th>
                <th className="py-1 pr-4">PnL</th>
                <th className="py-1 pr-4">PnL %</th>
              </tr>
            </thead>
            <tbody>
              {result.trades.map((t, i) => (
                <tr key={i} className="border-t border-gray-800">
                  <td className="py-1 pr-4">{t.direction}</td>
                  <td className="py-1 pr-4">{new Date(t.entryTime * 1000).toLocaleDateString()}</td>
                  <td className="py-1 pr-4">{new Date(t.exitTime * 1000).toLocaleDateString()}</td>
                  <td className="py-1 pr-4">{t.entryPrice.toFixed(2)}</td>
                  <td className="py-1 pr-4">{t.exitPrice.toFixed(2)}</td>
                  <td className="py-1 pr-4">{t.exitReason}</td>
                  <td className={`py-1 pr-4 ${t.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{t.pnl.toFixed(2)}</td>
                  <td className={`py-1 pr-4 ${t.pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>{t.pnlPct.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

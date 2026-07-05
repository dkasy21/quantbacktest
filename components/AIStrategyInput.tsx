'use client';

import { useState, useEffect } from 'react';
import type { BacktestResult, Bar } from '@/lib/backtest/types';
import UpgradeModal from './UpgradeModal';

interface AIStrategyInputProps {
  onResult: (result: BacktestResult, bars: Bar[], symbol: string) => void;
}

const PRO_SYMBOLS = new Set([
  'MNQ','NQ','MES','ES','YM','MYM','RTY','M2K',
  'XAUUSD','GOLD','GC','XAGUSD','SILVER','SI',
  'CL','WTI','CRUDE','OIL','NG','HG',
  'ZN','ZB','SPX','NDX','DJI','RUT','VIX','DXY',
]);

function isProSymbol(sym: string): boolean {
  const s = sym.toUpperCase();
  return PRO_SYMBOLS.has(s) || s.endsWith('=F') || s.startsWith('^') || s.startsWith('DX-');
}

const EXAMPLES = [
  { label: 'RSI + Trend', text: 'Go long when RSI drops below 30 and price is above the 200-day SMA. Exit when RSI rises above 70. Use a 2% stop loss and 6% take profit.' },
  { label: 'MACD Cross', text: 'Enter long when the MACD line crosses above the signal line. Exit when MACD crosses below. 10% position size.' },
  { label: 'ICT / ORB', text: 'Wait for the NY session open kill zone. Go long on a break of structure bullish signal in a discount zone. 0.5% stop loss, 1% take profit, max 12 bars.' },
  { label: 'Fair Value Gap', text: 'Enter long when a bullish fair value gap appears alongside a bullish order block. Exit when price hits a bearish FVG. 5% position size.' },
];

const POPULAR_SYMBOLS = [
  { label: 'MNQ', desc: 'Micro Nasdaq' }, { label: 'NQ', desc: 'Nasdaq Futures' },
  { label: 'MES', desc: 'Micro S&P 500' }, { label: 'ES', desc: 'S&P 500 Futures' },
  { label: 'YM', desc: 'Dow Futures' }, { label: 'RTY', desc: 'Russell 2000' },
  { label: 'SPX', desc: 'S&P 500' }, { label: 'NDX', desc: 'Nasdaq 100' },
  { label: 'VIX', desc: 'Volatility' }, { label: 'XAUUSD', desc: 'Gold' },
  { label: 'XAGUSD', desc: 'Silver' }, { label: 'CL', desc: 'Crude Oil' },
  { label: 'EURUSD', desc: 'EUR/USD' }, { label: 'DXY', desc: 'Dollar Index' },
  { label: 'BTC', desc: 'Bitcoin' }, { label: 'ETH', desc: 'Ethereum' },
  { label: 'SPY', desc: 'S&P 500 ETF' }, { label: 'QQQ', desc: 'Nasdaq ETF' },
  { label: 'AAPL', desc: 'Apple' }, { label: 'TSLA', desc: 'Tesla' }, { label: 'NVDA', desc: 'Nvidia' },
];

const MAX_DAYS: Record<string, number> = { '5m': 55, '15m': 55, '30m': 55, '1h': 700, '1d': 1825 };

function getDefaultStart(interval: string): string {
  const days = Math.min(MAX_DAYS[interval] ?? 55, interval === '1d' ? 365 : 30);
  const d = new Date(); d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

type QuotaData = { plan: 'free' | 'pro'; remaining: number | null; limit: number | null; resetAt: string | null };

export default function AIStrategyInput({ onResult }: AIStrategyInputProps) {
  const [prompt, setPrompt] = useState('');
  const [symbol, setSymbol] = useState('SPY');
  const [interval, setInterval] = useState<'1d' | '1h' | '15m' | '5m'>('1d');
  const [startDate, setStartDate] = useState(getDefaultStart('1d'));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [initialCapital, setInitialCapital] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'idle' | 'parsing' | 'backtesting'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; reason: 'futures' | 'quota' }>({ open: false, reason: 'futures' });

  useEffect(() => {
    fetch('/api/user/quota').then(r => r.json()).then(d => { if (!d.error) setQuota(d); }).catch(() => {});
  }, []);

  const isPro = quota?.plan === 'pro';

  function handleSymbolClick(sym: string) {
    if (!isPro && isProSymbol(sym)) { setUpgradeModal({ open: true, reason: 'futures' }); return; }
    setSymbol(sym);
  }

  function handleIntervalChange(v: '1d' | '1h' | '15m' | '5m') { setInterval(v); setStartDate(getDefaultStart(v)); }

  async function handleSubmit() {
    if (!prompt.trim()) return;
    setError(null); setInterpretation(null); setLoading(true); setStage('parsing');
    try {
      const aiRes = await fetch('/api/ai-strategy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, symbol, interval, startDate, endDate, initialCapital }) });
      const aiData = await aiRes.json();
      if (!aiRes.ok) { setError(aiData.error ?? 'AI parsing failed.'); return; }
      setInterpretation(aiData.interpretation); setStage('backtesting');
      const btRes = await fetch('/api/backtest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ strategy: aiData.strategy, startDate, endDate, interval }) });
      const btData = await btRes.json();
      if (btRes.status === 403) { setUpgradeModal({ open: true, reason: 'futures' }); return; }
      if (btRes.status === 429) { setUpgradeModal({ open: true, reason: 'quota' }); fetch('/api/user/quota').then(r => r.json()).then(d => { if (!d.error) setQuota(d); }); return; }
      if (!btRes.ok) { setError(btData.error ?? 'Backtest failed.'); return; }
      if (quota?.plan === 'free' && btData.remainingQuota !== undefined) setQuota(q => q ? { ...q, remaining: btData.remainingQuota } : q);
      onResult(btData.result, btData.bars, symbol);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally { setLoading(false); setStage('idle'); }
  }

  return (
    <>
      <UpgradeModal open={upgradeModal.open} onClose={() => setUpgradeModal(m => ({ ...m, open: false }))} reason={upgradeModal.reason} resetAt={quota?.resetAt} />
      <div className="card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1"><span className="text-brand-500 text-lg">✦</span><h2 className="text-lg font-semibold">AI Strategy Parser</h2></div>
            <p className="text-sm text-gray-400">Describe your strategy in plain English — AI converts it into precise backtest rules instantly.</p>
          </div>
          {quota && (
            <div className="shrink-0">
              {isPro ? (
                <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-full">✦ Pro</span>
              ) : (
                <button onClick={() => setUpgradeModal({ open: true, reason: 'quota' })} className={'inline-flex items-center gap-1.5 border text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ' + (quota.remaining === 0 ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/10 text-gray-400 hover:border-indigo-500/50 hover:text-indigo-300')} title="Upgrade to Pro for unlimited backtests">
                  {quota.remaining === 0 ? '⚠ 0' : quota.remaining}/{quota.limit} left this week
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Instrument {!isPro && <span className="text-xs text-gray-600 ml-1">🔒 = Pro only</span>}</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {POPULAR_SYMBOLS.map(s => {
              const locked = !isPro && isProSymbol(s.label);
              return (
                <button key={s.label} onClick={() => handleSymbolClick(s.label)} disabled={loading} title={locked ? s.desc + ' — Pro required' : s.desc}
                  className={'px-2.5 py-1 rounded text-xs font-mono font-medium border transition-all ' + (symbol === s.label ? 'bg-brand-500 border-brand-500 text-white' : locked ? 'border-white/5 text-gray-600 hover:border-indigo-500/40 hover:text-indigo-400' : 'border-white/10 text-gray-300 hover:border-brand-500/50 hover:text-white')}>
                  {s.label}{locked ? ' 🔒' : ''}
                </button>
              );
            })}
          </div>
          <input className="input w-full font-mono text-sm" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="Or type any symbol…" disabled={loading} />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Strategy description</label>
          <textarea className="input w-full font-mono text-sm leading-relaxed" rows={5} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g. Go long when RSI drops below 30 and price is above the 200-day SMA. Exit when RSI rises above 70. Use a 2% stop loss and 4% take profit." disabled={loading} />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <span className="text-xs text-gray-500">Try an example:</span>
            {EXAMPLES.map(ex => <button key={ex.label} onClick={() => setPrompt(ex.text)} className="text-xs text-brand-400 hover:text-brand-300 hover:underline transition-colors" disabled={loading}>{ex.label}</button>)}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="block text-sm"><span className="block text-gray-400 mb-1">Interval</span>
            <select className="input w-full" value={interval} onChange={e => handleIntervalChange(e.target.value as typeof interval)} disabled={loading}>
              <option value="1d">Daily</option><option value="1h">1 hour</option><option value="15m">15 min</option><option value="5m">5 min</option>
            </select>
          </label>
          <label className="block text-sm"><span className="block text-gray-400 mb-1">Start date</span><input type="date" className="input w-full" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={loading} /></label>
          <label className="block text-sm"><span className="block text-gray-400 mb-1">End date</span><input type="date" className="input w-full" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={loading} /></label>
          <label className="block text-sm"><span className="block text-gray-400 mb-1">Capital ($)</span><input type="number" className="input w-full" value={initialCapital} onChange={e => setInitialCapital(Number(e.target.value))} disabled={loading} /></label>
        </div>

        {interval !== '1d' && <p className="text-xs text-amber-400">{interval === '1h' ? 'Hourly data: up to ~2 years available.' : 'Intraday (5m/15m): capped at ~60 days — start date auto-set.'}</p>}

        {interpretation && <div className="bg-brand-500/10 border border-brand-500/30 rounded-lg p-4 text-sm"><p className="text-brand-400 font-medium mb-1">AI interpreted:</p><p className="text-gray-200 leading-relaxed">{interpretation}</p></div>}

        {quota?.plan === 'free' && quota.remaining === 0 && !error && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-400 flex items-center justify-between gap-3">
            <span>You've used your free backtest for this week.</span>
            <button onClick={() => setUpgradeModal({ open: true, reason: 'quota' })} className="shrink-0 text-indigo-400 hover:text-indigo-300 font-semibold underline">Upgrade →</button>
          </div>
        )}

        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

        <button onClick={handleSubmit} disabled={loading || !prompt.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? (<><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />{stage === 'parsing' ? 'Parsing strategy with AI…' : 'Running backtest…'}</>) : '✦ Analyse & Backtest with AI'}
        </button>
      </div>
    </>
  );
}

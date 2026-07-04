'use client';

import { useState } from 'react';
import type { BacktestResult, Bar } from '@/lib/backtest/types';

interface AIStrategyInputProps {
  onResult: (result: BacktestResult, bars: Bar[], symbol: string) => void;
}

const EXAMPLES = [
  { label: 'RSI + Trend', text: 'Go long when RSI drops below 30 and price is above the 200-day SMA. Exit when RSI rises above 70. Use a 2% stop loss and 6% take profit.' },
  { label: 'MACD Cross', text: 'Enter long when the MACD line crosses above the signal line. Exit when MACD line crosses below the signal line. 10% position size.' },
  { label: 'ICT / ORB', text: 'Wait for the NY session open kill zone. Go long on a break of structure bullish signal in a discount zone. Go short on break of structure bearish in a premium zone. 0.5% stop loss, 1% take profit, max 12 bars.' },
  { label: 'Fair Value Gap', text: 'Enter long when a bullish fair value gap appears alongside a bullish order block. Exit when price hits a bearish fair value gap. 5% position size.' },
];

export default function AIStrategyInput({ onResult }: AIStrategyInputProps) {
  const [prompt, setPrompt] = useState('');
  const [symbol, setSymbol] = useState('SPY');
  const [interval, setInterval] = useState<'1d' | '1h' | '15m' | '5m'>('1d');
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [initialCapital, setInitialCapital] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'idle' | 'parsing' | 'backtesting'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [interpretation, setInterpretation] = useState<string | null>(null);

  async function handleSubmit() {
    if (!prompt.trim()) return;
    setError(null);
    setInterpretation(null);
    setLoading(true);
    setStage('parsing');

    try {
      const aiRes = await fetch('/api/ai-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, symbol, interval, startDate, endDate, initialCapital }),
      });
      const aiData = await aiRes.json();
      if (!aiRes.ok) { setError(aiData.error ?? 'AI parsing failed.'); return; }

      setInterpretation(aiData.interpretation);
      setStage('backtesting');

      const btRes = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: aiData.strategy, startDate, endDate, interval }),
      });
      const btData = await btRes.json();
      if (!btRes.ok) { setError(btData.error ?? 'Backtest failed.'); return; }

      onResult(btData.result, btData.bars, symbol);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setLoading(false);
      setStage('idle');
    }
  }

  return (
    <div className="card p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-brand-500 text-lg">✦</span>
          <h2 className="text-lg font-semibold">AI Strategy Parser</h2>
        </div>
        <p className="text-sm text-gray-400">
          Describe your trading strategy in plain English — Claude converts it into precise backtest rules and runs it instantly.
        </p>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Strategy description</label>
        <textarea
          className="input w-full font-mono text-sm leading-relaxed"
          rows={5}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Wait for the NY session open. Go long on a break of structure bullish signal when price is in a discount zone — this is the break and retest. Short on break of structure bearish in premium zone. Use 0.5% stop loss and 1% take profit."
          disabled={loading}
        />
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-xs text-gray-500">Try an example:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex.label} onClick={() => setPrompt(ex.text)} className="text-xs text-brand-400 hover:text-brand-300 hover:underline transition-colors" disabled={loading}>
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <label className="block text-sm">
          <span className="block text-gray-400 mb-1">Symbol</span>
          <input className="input w-full" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} disabled={loading} />
        </label>
        <label className="block text-sm">
          <span className="block text-gray-400 mb-1">Interval</span>
          <select className="input w-full" value={interval} onChange={(e) => setInterval(e.target.value as typeof interval)} disabled={loading}>
            <option value="1d">Daily</option>
            <option value="1h">1 hour</option>
            <option value="15m">15 min</option>
            <option value="5m">5 min</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="block text-gray-400 mb-1">Start date</span>
          <input type="date" className="input w-full" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={loading} />
        </label>
        <label className="block text-sm">
          <span className="block text-gray-400 mb-1">End date</span>
          <input type="date" className="input w-full" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={loading} />
        </label>
        <label className="block text-sm">
          <span className="block text-gray-400 mb-1">Capital ($)</span>
          <input type="number" className="input w-full" value={initialCapital} onChange={(e) => setInitialCapital(Number(e.target.value))} disabled={loading} />
        </label>
      </div>

      {interval !== '1d' && (
        <p className="text-xs text-amber-400">Intraday data is only available for roughly the last 60 days on Yahoo Finance.</p>
      )}

      {interpretation && (
        <div className="bg-brand-500/10 border border-brand-500/30 rounded-lg p-4 text-sm">
          <p className="text-brand-400 font-medium mb-1">Claude interpreted:</p>
          <p className="text-gray-200 leading-relaxed">{interpretation}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>
      )}

      <button onClick={handleSubmit} disabled={loading || !prompt.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
        {loading ? (
          <>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            {stage === 'parsing' ? 'Parsing strategy with Claude…' : 'Running backtest…'}
          </>
        ) : '✦ Analyse & Backtest with AI'}
      </button>
    </div>
  );
}

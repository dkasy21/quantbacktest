'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import StrategyBuilder from '@/components/StrategyBuilder';
import PriceChart from '@/components/PriceChart';
import EquityChart from '@/components/EquityChart';
import ResultsPanel from '@/components/ResultsPanel';
import Footer from '@/components/Footer';
import type { BacktestResult, Bar } from '@/lib/backtest/types';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [bars, setBars] = useState<Bar[]>([]);
  const [symbol, setSymbol] = useState('');

  if (status === 'loading') {
    return <main className="min-h-screen flex items-center justify-center">Loading…</main>;
  }
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  async function upgrade() {
    const res = await fetch('/api/checkout', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert(data.error ?? 'Could not start checkout.');
  }

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-6 py-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">QuantBacktest</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">{session?.user?.email}</span>
          <button onClick={upgrade} className="text-brand-500 hover:underline">Upgrade to Pro</button>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="text-gray-400 hover:underline">
            Log out
          </button>
        </div>
      </header>

      <StrategyBuilder
        onResult={(r, b, s) => {
          setResult(r);
          setBars(b);
          setSymbol(s);
        }}
      />

      {result && (
        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="font-semibold mb-3">{symbol} — price &amp; trade markers</h2>
            <PriceChart bars={bars} trades={result.trades} />
          </div>
          <div className="card p-4">
            <h2 className="font-semibold mb-3">Equity curve</h2>
            <EquityChart equityCurve={result.equityCurve} />
          </div>
          <ResultsPanel result={result} />
        </div>
      )}
      <Footer />
    </main>
  );
}

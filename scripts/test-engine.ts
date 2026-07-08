// Basic smoke tests for the indicator + backtest engine.
// Fixed during the 2026-07-06 audit: this file previously had several typos
// (chd() instead of chk(), 1-9 instead of 1e-9, and invalid object-literal
// syntax like `{time:t++,86400,open:...}`) that meant it had never actually
// run successfully. Run with: npm run test:engine
import { sma, ema, rsi } from '../lib/backtest/indicators';
import { runBacktest } from '../lib/backtest/engine';
import { delta, cumulativeDelta, cvdTrend, buyRatio } from '../lib/backtest/orderflow';
import type { Bar } from '../lib/backtest/types';

let failures = 0;
function chk(act: number, exp: number, tol: number, lbl: string) {
  if (Math.abs(act - exp) > tol) {
    console.error(`FAIL: ${lbl} expected ${exp} got ${act}`);
    failures++;
  } else {
    console.log(`PASS: ${lbl}`);
  }
}

{
  const r = sma([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3);
  chk(r[2] as number, 2, 1e-9, 'SMA[2]');
}

{
  const r = ema([1, 2, 3, 4, 5], 3);
  chk(r[2] as number, 2, 1e-9, 'EMA seed');
  chk(r[4] as number, 4, 1e-9, 'EMA end');
}

{
  const r = rsi(Array.from({ length: 20 }, (_, i) => 100 + i), 14);
  chk(r[14] as number, 100, 1e-9, 'RSI=100 for a strictly rising series');
}

{
  const bars: { time: number; open: number; high: number; low: number; close: number; volume: number }[] = [];
  let t = 1700000000;
  const dayInSeconds = 86400;

  for (let i = 0; i < 10; i++) {
    bars.push({ time: t, open: 100, high: 100.5, low: 99.5, close: 100, volume: 1000 });
    t += dayInSeconds;
  }
  for (let i = 0; i < 20; i++) {
    const close = 100 + i * 3;
    bars.push({ time: t, open: close, high: close + 0.5, low: close - 0.5, close, volume: 1000 });
    t += dayInSeconds;
  }
  for (let i = 0; i < 20; i++) {
    const close = 160 - i * 3;
    bars.push({ time: t, open: close, high: close + 0.5, low: close - 0.5, close, volume: 1000 });
    t += dayInSeconds;
  }

  const r = runBacktest(bars, {
    name: 't',
    symbol: 'T',
    direction: 'long',
    signals: [
      { id: 'f', kind: 'sma', params: { period: 3 } },
      { id: 'n', kind: 'sma', params: { period: 8 } },
    ],
    entry: {
      type: 'group',
      logic: 'AND',
      children: [{ type: 'condition', left: { signalId: 'f' }, operator: 'crosses_above', right: { signalId: 'n' } }],
    },
    exit: {
      type: 'group',
      logic: 'AND',
      children: [{ type: 'condition', left: { signalId: 'f' }, operator: 'crosses_below', right: { signalId: 'n' } }],
    },
    risk: { positionSizePct: 100 },
    initialCapital: 10000,
  });

  if (r.trades.length === 0) {
    console.error('FAIL: expected at least one trade from the fast/slow SMA crossover fixture');
    failures++;
  } else {
    console.log(`PASS: ${r.trades.length} trades generated`);
  }
}

{
  // 2026-07-07: orderflow signals added for crypto (Binance taker buy/sell
  // split). Verify delta/CVD/buy-ratio math on a synthetic bar with a known
  // buyVolume, and that bars without buyVolume (every non-Binance source)
  // resolve to null instead of throwing or silently defaulting to 0.
  const withOrderflow: Bar[] = [
    { time: 1, open: 100, high: 101, low: 99, close: 100, volume: 100, buyVolume: 70 },
    { time: 2, open: 100, high: 101, low: 99, close: 100, volume: 100, buyVolume: 30 },
  ];
  const d = delta(withOrderflow);
  chk(d[0] as number, 40, 1e-9, 'orderflow delta (70 buy - 30 sell)');
  chk(d[1] as number, -40, 1e-9, 'orderflow delta (30 buy - 70 sell)');

  const cvd = cumulativeDelta(withOrderflow);
  chk(cvd[0] as number, 40, 1e-9, 'CVD after bar 1');
  chk(cvd[1] as number, 0, 1e-9, 'CVD after bar 2 (running total back to 0)');

  const ratio = buyRatio(withOrderflow);
  chk(ratio[0] as number, 0.7, 1e-9, 'buy ratio (70/100)');

  const withoutOrderflow: Bar[] = [{ time: 1, open: 100, high: 101, low: 99, close: 100, volume: 100 }];
  if (delta(withoutOrderflow)[0] !== null) {
    console.error('FAIL: delta() should be null for bars with no buyVolume (non-Binance sources)');
    failures++;
  } else {
    console.log('PASS: orderflow signals resolve to null on non-crypto bars');
  }
{
  // 2026-07-08: of_cvd_rising / of_cvd_falling added so the AI parser has a
  // real signal for "CVD is rising/falling" trend language instead of
  // hallucinating a lookback the expression evaluator doesn't support.
  // Build 6 bars of steadily rising CVD (delta = +20/bar) and 6 of steadily
  // falling CVD (delta = -20/bar), and confirm rising/falling flip correctly.
  const mkBars = (buyVolume: number, n: number): Bar[] =>
    Array.from({ length: n }, (_, i) => ({ time: i + 1, open: 100, high: 101, low: 99, close: 100, volume: 100, buyVolume }));

  const risingBars = mkBars(60, 6); // delta = 60-40 = +20/bar
  const risingTrend = cvdTrend(risingBars, 3);
  if (risingTrend.rising[3] !== true || risingTrend.falling[3] !== false) {
    console.error('FAIL: of_cvd_rising should be true (and falling false) on a steadily rising CVD series');
    failures++;
  } else {
    console.log('PASS: cvdTrend detects a rising CVD series');
  }

  const fallingBars = mkBars(40, 6); // delta = 40-60 = -20/bar
  const fallingTrend = cvdTrend(fallingBars, 3);
  if (fallingTrend.falling[3] !== true || fallingTrend.rising[3] !== false) {
    console.error('FAIL: of_cvd_falling should be true (and rising false) on a steadily falling CVD series');
    failures++;
  } else {
    console.log('PASS: cvdTrend detects a falling CVD series');
  }

  if (risingTrend.rising[1] !== null) {
    console.error('FAIL: cvdTrend should be null before `lookback` bars have elapsed');
    failures++;
  } else {
    console.log('PASS: cvdTrend resolves to null before enough history exists');
  }
}

}

console.log(failures === 0 ? 'All checks passed.' : `${failures} FAILED.`);
process.exit(failures === 0 ? 0 : 1);

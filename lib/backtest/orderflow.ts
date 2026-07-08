// Crypto orderflow signals derived from Binance's per-candle taker buy/sell
// volume split (see lib/data/binanceData.ts). This is a real, exchange-
// reported buy/sell volume split per candle — NOT full tick-level order-book
// / footprint / bid-ask-depth data. It's enough for delta, cumulative volume
// delta (CVD), and delta-divergence signals, but not absorption, queue
// position, or price-ladder analysis. Bars without a `buyVolume` field
// (every non-Binance source: Yahoo, TwelveData, Polygon, Databento) resolve
// every signal here to null, so mixing symbols is safe — it just won't fire.

import type { Bar } from './types';
import { findSwingPoints } from './patterns';

type NumSeries = (number | null)[];
type BoolSeries = (boolean | null)[];

function hasOrderflow(bar: Bar): boolean {
  return typeof bar.buyVolume === 'number' && Number.isFinite(bar.buyVolume);
}

/** Per-bar delta: taker buy volume minus taker sell volume. */
export function delta(bars: Bar[]): NumSeries {
  return bars.map((b) =>
    hasOrderflow(b) ? (b.buyVolume as number) - (b.volume - (b.buyVolume as number)) : null
  );
}

/** Running cumulative sum of delta across the whole loaded range (CVD). */
export function cumulativeDelta(bars: Bar[]): NumSeries {
  const d = delta(bars);
  const out: NumSeries = new Array(bars.length).fill(null);
  let running = 0;
  let started = false;
  for (let i = 0; i < d.length; i++) {
    if (d[i] === null) {
      out[i] = started ? running : null;
      continue;
    }
    running += d[i] as number;
    started = true;
    out[i] = running;
  }
  return out;
}

/** Fraction of volume that was taker-buy (0-1). 0.5 = balanced. */
export function buyRatio(bars: Bar[]): NumSeries {
  return bars.map((b) => (hasOrderflow(b) && b.volume > 0 ? (b.buyVolume as number) / b.volume : null));
}

/**
 * Delta divergence: compares swing points in price against cumulative
 * delta (CVD) at the same bars.
 * - Bullish: price makes a LOWER swing low while CVD makes a HIGHER swing
 *   low — sellers are running out of steam even as price dips, a classic
 *   setup ahead of a reversal up.
 * - Bearish: price makes a HIGHER swing high while CVD makes a LOWER swing
 *   high — buyers are running out of steam even as price pushes up.
 */
export function deltaDivergence(
  bars: Bar[],
  swingLookback = 2
): { bullish: BoolSeries; bearish: BoolSeries } {
  const bullish: BoolSeries = new Array(bars.length).fill(null);
  const bearish: BoolSeries = new Array(bars.length).fill(null);
  if (!bars.some(hasOrderflow)) return { bullish, bearish };

  const cvd = cumulativeDelta(bars);
  const { swingHighIdx, swingLowIdx } = findSwingPoints(bars, swingLookback);

  for (let n = 1; n < swingLowIdx.length; n++) {
    const prevIdx = swingLowIdx[n - 1];
    const currIdx = swingLowIdx[n];
    const prevCvd = cvd[prevIdx];
    const currCvd = cvd[currIdx];
    if (prevCvd === null || currCvd === null) continue;
    if (bars[currIdx].low < bars[prevIdx].low && currCvd > prevCvd) {
      bullish[currIdx] = true;
    }
  }
  for (let n = 1; n < swingHighIdx.length; n++) {
    const prevIdx = swingHighIdx[n - 1];
    const currIdx = swingHighIdx[n];
    const prevCvd = cvd[prevIdx];
    const currCvd = cvd[currIdx];
    if (prevCvd === null || currCvd === null) continue;
    if (bars[currIdx].high > bars[prevIdx].high && currCvd < prevCvd) {
      bearish[currIdx] = true;
    }
  }
  return { bullish, bearish };
/**
 * CVD trend: true when cumulative volume delta has net risen (rising) or
 * net fallen (falling) over the last `lookback` bars -- i.e. CVD now vs.
 * CVD `lookback` bars ago. This exists because the expression evaluator
 * has no lookback/history access (see expr.ts), so "CVD is rising" can't
 * be written as an inline expression -- it needs to be a precomputed
 * boolean signal like the other trend/pattern booleans (fvg_bullish,
 * bos_bullish, etc.).
 */
export function cvdTrend(bars: Bar[], lookback = 5): { rising: BoolSeries; falling: BoolSeries } {
  const cvd = cumulativeDelta(bars);
  const rising: BoolSeries = new Array(bars.length).fill(null);
  const falling: BoolSeries = new Array(bars.length).fill(null);
  for (let i = lookback; i < bars.length; i++) {
    const now = cvd[i];
    const prev = cvd[i - lookback];
    if (now === null || prev === null) continue;
    rising[i] = now > prev;
    falling[i] = now < prev;
  }
  return { rising, falling };
}

}

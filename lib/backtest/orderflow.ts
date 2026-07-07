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
}

// ICT-style structural / price-action signal detectors.
//
// These are deterministic, rule-based approximations of common
// "Smart Money Concepts" / ICT terminology, computed from OHLCV bars
// only (no proprietary order data). Each detector returns a boolean
// series aligned 1:1 with the input bars (null where undefined, e.g.
// during warm-up).

import type { Bar } from './types';

type BoolSeries = (boolean | null)[];

function emptyBool(len: number): BoolSeries {
  return new Array(len).fill(null);
}

// A bar `i` is a swing high if its high is the max within `lookback` bars
// on both sides (simple fractal pivot). Same for swing low.
export interface SwingPoints {
  swingHighIdx: number[];
  swingLowIdx: number[];
}

export function findSwingPoints(bars: Bar[], lookback = 2): SwingPoints {
  const swingHighIdx: number[] = [];
  const swingLowIdx: number[] = [];
  for (let i = lookback; i < bars.length - lookback; i++) {
    let isHigh = true;
    let isLow = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue;
      if (bars[j].high >= bars[i].high) isHigh = false;
      if (bars[j].low <= bars[i].low) isLow = false;
    }
    if (isHigh) swingHighIdx.push(i);
    if (isLow) swingLowIdx.push(i);
  }
  return { swingHighIdx, swingLowIdx };
}

// ---- Fair Value Gap -----------------------------------------------------
// 3-candle imbalance: bullish FVG when candle[i-2].high < candle[i].low
// (the middle candle's range left a gap that hasn't been filled).
export function fairValueGap(bars: Bar[]): {
  bullish: BoolSeries;
  bearish: BoolSeries;
} {
  const bullish = emptyBool(bars.length);
  const bearish = emptyBool(bars.length);
  for (let i = 2; i < bars.length; i++) {
    const a = bars[i - 2];
    const c = bars[i];
    bullish[i] = a.high < c.low;
    bearish[i] = a.low > c.high;
  }
  return { bullish, bearish };
}

// ---- Order Block ---------------------------------------------------------
// Simplified definition: the last opposite-colored candle immediately
// before an impulsive move that breaks the recent swing high/low.
// `impulseLookahead` bars after the candle are checked for the breakout;
// `impulseMultiple` requires the breakout candle's range to be at least
// that multiple of the recent average range (filters out noise).
export function orderBlocks(
  bars: Bar[],
  impulseLookahead = 3,
  impulseMultiple = 1.5,
  avgRangePeriod = 14
): { bullish: BoolSeries; bearish: BoolSeries } {
  const bullish = emptyBool(bars.length);
  const bearish = emptyBool(bars.length);

  const ranges = bars.map((b) => b.high - b.low);

  for (let i = avgRangePeriod; i < bars.length - impulseLookahead; i++) {
    let avgRange = 0;
    for (let k = i - avgRangePeriod; k < i; k++) avgRange += ranges[k];
    avgRange /= avgRangePeriod;

    const candle = bars[i];
    const isBearishCandle = candle.close < candle.open;
    const isBullishCandle = candle.close > candle.open;

    // Bullish order block: down candle followed by an impulsive rally
    // that closes above this candle's high.
    if (isBearishCandle) {
      for (let j = i + 1; j <= i + impulseLookahead; j++) {
        const breakout = bars[j];
        if (
          breakout.close > candle.high &&
          breakout.high - breakout.low >= avgRange * impulseMultiple
        ) {
          bullish[i] = true;
          break;
        }
      }
    }

    // Bearish order block: up candle followed by an impulsive drop that
    // closes below this candle's low.
    if (isBullishCandle) {
      for (let j = i + 1; j <= i + impulseLookahead; j++) {
        const breakout = bars[j];
        if (
          breakout.close < candle.low &&
          breakout.high - breakout.low >= avgRange * impulseMultiple
        ) {
          bearish[i] = true;
          break;
        }
      }
    }
  }

  return { bullish, bearish };
}

// ---- Break of Structure / Market Structure Shift -------------------------
// Tracks the most recent confirmed swing high/low and flags the bar where
// price closes beyond it — a structural break in the prevailing trend.
export function breakOfStructure(
  bars: Bar[],
  swingLookback = 2
): { bullish: BoolSeries; bearish: BoolSeries } {
  const bullish = emptyBool(bars.length);
  const bearish = emptyBool(bars.length);
  const { swingHighIdx, swingLowIdx } = findSwingPoints(bars, swingLookback);

  let lastSwingHigh: number | null = null;
  let lastSwingLow: number | null = null;
  let shPtr = 0;
  let slPtr = 0;

  for (let i = 0; i < bars.length; i++) {
    while (shPtr < swingHighIdx.length && swingHighIdx[shPtr] < i) {
      lastSwingHigh = bars[swingHighIdx[shPtr]].high;
      shPtr++;
    }
    while (slPtr < swingLowIdx.length && swingLowIdx[slPtr] < i) {
      lastSwingLow = bars[swingLowIdx[slPtr]].low;
      slPtr++;
    }
    bullish[i] = lastSwingHigh !== null ? bars[i].close > lastSwingHigh : false;
    bearish[i] = lastSwingLow !== null ? bars[i].close < lastSwingLow : false;
  }

  return { bullish, bearish };
}

// ---- Liquidity Sweep -------------------------------------------------------
// Price wicks beyond a recent swing high/low (taking out resting stops /
// liquidity) then closes back on the other side — a classic stop-hunt.
export function liquiditySweep(
  bars: Bar[],
  swingLookback = 2
): { sweepHigh: BoolSeries; sweepLow: BoolSeries } {
  const sweepHigh = emptyBool(bars.length);
  const sweepLow = emptyBool(bars.length);
  const { swingHighIdx, swingLowIdx } = findSwingPoints(bars, swingLookback);

  let lastSwingHigh: number | null = null;
  let lastSwingLow: number | null = null;
  let shPtr = 0;
  let slPtr = 0;

  for (let i = 0; i < bars.length; i++) {
    while (shPtr < swingHighIdx.length && swingHighIdx[shPtr] < i) {
      lastSwingHigh = bars[swingHighIdx[shPtr]].high;
      shPtr++;
    }
    while (slPtr < swingLowIdx.length && swingLowIdx[slPtr] < i) {
      lastSwingLow = bars[swingLowIdx[slPtr]].low;
      slPtr++;
    }
    sweepHigh[i] =
      lastSwingHigh !== null
        ? bars[i].high > lastSwingHigh && bars[i].close < lastSwingHigh
        : false;
    sweepLow[i] =
      lastSwingLow !== null
        ? bars[i].low < lastSwingLow && bars[i].close > lastSwingLow
        : false;
  }

  return { sweepHigh, sweepLow };
}

// ---- Equal Highs / Equal Lows ---------------------------------------------
// Flags a swing high/low that sits within `tolerancePct` of the previous
// swing high/low — a liquidity pool ICT traders watch for sweeps.
export function equalHighsLows(
  bars: Bar[],
  swingLookback = 2,
  tolerancePct = 0.1
): { equalHighs: BoolSeries; equalLows: BoolSeries } {
  const equalHighs = emptyBool(bars.length);
  const equalLows = emptyBool(bars.length);
  const { swingHighIdx, swingLowIdx } = findSwingPoints(bars, swingLookback);

  for (let n = 1; n < swingHighIdx.length; n++) {
    const prev = bars[swingHighIdx[n - 1]].high;
    const curr = bars[swingHighIdx[n]].high;
    if (Math.abs(curr - prev) / prev * 100 <= tolerancePct) {
      equalHighs[swingHighIdx[n]] = true;
    }
  }
  for (let n = 1; n < swingLowIdx.length; n++) {
    const prev = bars[swingLowIdx[n - 1]].low;
    const curr = bars[swingLowIdx[n]].low;
    if (Math.abs(curr - prev) / prev * 100 <= tolerancePct) {
      equalLows[swingLowIdx[n]] = true;
    }
  }
  return { equalHighs, equalLows };
}

// ---- Premium / Discount Zone -----------------------------------------------
// Within the most recent `rangePeriod`-bar dealing range, is price trading
// in the upper half (premium, favors shorts in ICT logic) or lower half
// (discount, favors longs)?
export function premiumDiscountZone(
  bars: Bar[],
  rangePeriod = 20
): { premium: BoolSeries; discount: BoolSeries } {
  const premium = emptyBool(bars.length);
  const discount = emptyBool(bars.length);

  for (let i = rangePeriod - 1; i < bars.length; i++) {
    let hi = -Infinity;
    let lo = Infinity;
    for (let j = i - rangePeriod + 1; j <= i; j++) {
      hi = Math.max(hi, bars[j].high);
      lo = Math.min(lo, bars[j].low);
    }
    const mid = (hi + lo) / 2;
    premium[i] = bars[i].close > mid;
    discount[i] = bars[i].close < mid;
  }
  return { premium, discount };
}

// ---- Kill Zone (session time window) ---------------------------------------
// Flags bars whose UTC hour falls within a configured session window, e.g.
// the ICT "London" (07:00-10:00 UTC) or "New York" (12:00-15:00 UTC) kill
// zones. Only meaningful on intraday timeframes.
export function killZone(
  bars: Bar[],
  startHourUtc = 12,
  endHourUtc = 15
): BoolSeries {
  return bars.map((b) => {
    const hour = new Date(b.time * 1000).getUTCHours();
    if (startHourUtc <= endHourUtc) {
      return hour >= startHourUtc && hour < endHourUtc;
    }
    // window wraps past midnight UTC
    return hour >= startHourUtc || hour < endHourUtc;
  });
}

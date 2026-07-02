// Technical indicators used by the backtesting engine.
// All functions take a numeric series (typically closes) and return an
// array of the SAME LENGTH as the input, with `null` for the warm-up
// period where the indicator is not yet defined. This keeps every
// indicator series index-aligned with the original OHLCV bars, which the
// engine relies on.

export type Series = (number | null)[];

export function sma(values: number[], period: number): Series {
  if (period <= 0) throw new Error('sma: period must be > 0');
  const out: Series = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): Series {
  if (period <= 0) throw new Error('ema: period must be > 0');
  const out: Series = new Array(values.length).fill(null);
  const k = 2 / (period + 1);
  // Seed the EMA with the SMA of the first `period` values, which is the
  // standard convention and avoids a biased seed of just values[0].
  let seed = 0;
  for (let i = 0; i < values.length; i++) {
    if (i < period) {
      seed += values[i];
      if (i === period - 1) {
        out[i] = seed / period;
      }
      continue;
    }
    const prev = out[i - 1] as number;
    out[i] = values[i] * k + prev * (1 - k);
  }
  return out;
}

export function rsi(values: number[], period = 14): Series {
  if (period <= 0) throw new Error('rsi: period must be > 0');
  const out: Series = new Array(values.length).fill(null);
  if (values.length < period + 1) return out;

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change > 0) gainSum += change;
    else lossSum -= change;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    // Wilder's smoothing
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

export interface MacdResult {
  macd: Series;
  signal: Series;
  histogram: Series;
}

export function macd(
  values: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9
): MacdResult {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine: Series = values.map((_, i) => {
    const f = emaFast[i];
    const s = emaSlow[i];
    return f !== null && s !== null ? f - s : null;
  });

  const firstDefined = macdLine.findIndex((v) => v !== null);
  const signal: Series = new Array(values.length).fill(null);
  if (firstDefined !== -1) {
    const definedMacd = macdLine.slice(firstDefined) as number[];
    const signalEma = ema(definedMacd, signalPeriod);
    for (let i = 0; i < signalEma.length; i++) {
      signal[firstDefined + i] = signalEma[i];
    }
  }

  const histogram: Series = values.map((_, i) => {
    const m = macdLine[i];
    const s = signal[i];
    return m !== null && s !== null ? m - s : null;
  });

  return { macd: macdLine, signal, histogram };
}

export interface BollingerResult {
  upper: Series;
  middle: Series;
  lower: Series;
}

export function bollingerBands(
  values: number[],
  period = 20,
  stdDevMultiplier = 2
): BollingerResult {
  const middle = sma(values, period);
  const upper: Series = new Array(values.length).fill(null);
  const lower: Series = new Array(values.length).fill(null);

  for (let i = period - 1; i < values.length; i++) {
    const mean = middle[i] as number;
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSq += (values[j] - mean) ** 2;
    }
    const stdDev = Math.sqrt(sumSq / period);
    upper[i] = mean + stdDevMultiplier * stdDev;
    lower[i] = mean - stdDevMultiplier * stdDev;
  }

  return { upper, middle, lower };
}

export function atr(
  high: number[],
  low: number[],
  close: number[],
  period = 14
): Series {
  const len = close.length;
  const trueRange: number[] = new Array(len).fill(0);
  for (let i = 0; i < len; i++) {
    if (i === 0) {
      trueRange[i] = high[i] - low[i];
    } else {
      trueRange[i] = Math.max(
        high[i] - low[i],
        Math.abs(high[i] - close[i - 1]),
        Math.abs(low[i] - close[i - 1])
      );
    }
  }

  const out: Series = new Array(len).fill(null);
  if (len < period) return out;

  let sum = 0;
  for (let i = 0; i < period; i++) sum += trueRange[i];
  let prevAtr = sum / period;
  out[period - 1] = prevAtr;

  for (let i = period; i < len; i++) {
    prevAtr = (prevAtr * (period - 1) + trueRange[i]) / period;
    out[i] = prevAtr;
  }
  return out;
}

export function highestHigh(high: number[], period: number): Series {
  const out: Series = new Array(high.length).fill(null);
  for (let i = period - 1; i < high.length; i++) {
    let max = -Infinity;
    for (let j = i - period + 1; j <= i; j++) max = Math.max(max, high[j]);
    out[i] = max;
  }
  return out;
}

export function lowestLow(low: number[], period: number): Series {
  const out: Series = new Array(low.length).fill(null);
  for (let i = period - 1; i < low.length; i++) {
    let min = Infinity;
    for (let j = i - period + 1; j <= i; j++) min = Math.min(min, low[j]);
    out[i] = min;
  }
  return out;
}

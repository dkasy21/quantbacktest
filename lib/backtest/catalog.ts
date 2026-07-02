// UI metadata for every signal kind: human-readable label, category
// (for grouping in the picker), and the tunable params with sensible
// defaults. This is the single source of truth the rule-builder UI reads
// from, so adding a new signal kind to the engine + this catalogue is
// all that's needed to expose it in the dropdown builder.

import type { SignalKind } from './types';

export interface ParamDef {
  key: string;
  label: string;
  default: number;
  step?: number;
}

export interface SignalCatalogEntry {
  kind: SignalKind;
  label: string;
  category: 'Price/Volume' | 'Indicator' | 'Volume / Order-Flow Proxy' | 'ICT / Structure';
  isBoolean: boolean;
  params: ParamDef[];
}

export const SIGNAL_CATALOG: SignalCatalogEntry[] = [
  { kind: 'open', label: 'Open price', category: 'Price/Volume', isBoolean: false, params: [] },
  { kind: 'high', label: 'High price', category: 'Price/Volume', isBoolean: false, params: [] },
  { kind: 'low', label: 'Low price', category: 'Price/Volume', isBoolean: false, params: [] },
  { kind: 'close', label: 'Close price', category: 'Price/Volume', isBoolean: false, params: [] },
  { kind: 'volume', label: 'Volume', category: 'Price/Volume', isBoolean: false, params: [] },
  { kind: 'sma', label: 'SMA (Simple Moving Average)', category: 'Indicator', isBoolean: false, params: [{ key: 'period', label: 'Period', default: 20 }] },
  { kind: 'ema', label: 'EMA (Exponential Moving Average)', category: 'Indicator', isBoolean: false, params: [{ key: 'period', label: 'Period', default: 20 }] },
  { kind: 'rsi', label: 'RSI', category: 'Indicator', isBoolean: false, params: [{ key: 'period', label: 'Period', default: 14 }] },
  { kind: 'atr', label: 'ATR', category: 'Indicator', isBoolean: false, params: [{ key: 'period', label: 'Period', default: 14 }] },
  { kind: 'macd_line', label: 'MACD line', category: 'Indicator', isBoolean: false, params: [{ key: 'fast', label: 'Fast period', default: 12 },{ key: 'slow', label: 'Slow period', default: 26 },{ key: 'signal', label: 'Signal period', default: 9 }] },
  { kind: 'macd_signal', label: 'MACD signal line', category: 'Indicator', isBoolean: false, params: [{ key: 'fast', label: 'Fast period', default: 12 },{ key: 'slow', label: 'Slow period', default: 26 },{ key: 'signal', label: 'Signal period', default: 9 }] },
  { kind: 'macd_hist', label: 'MACD histogram', category: 'Indicator', isBoolean: false, params: [{ key: 'fast', label: 'Fast period', default: 12 },{ key: 'slow', label: 'Slow period', default: 26 },{ key: 'signal', label: 'Signal period', default: 9 }] },
  { kind: 'bb_upper', label: 'Bollinger Band - upper', category: 'Indicator', isBoolean: false, params: [{ key: 'period', label: 'Period', default: 20 },{ key: 'stdDev', label: 'Std-dev multiplier', default: 2, step: 0.1 }] },
  { kind: 'bb_middle', label: 'Bollinger Band - middle', category: 'Indicator', isBoolean: false, params: [{ key: 'period', label: 'Period', default: 20 },{ key: 'stdDev', label: 'Std-dev multiplier', default: 2, step: 0.1 }] },
  { kind: 'bb_lower', label: 'Bollinger Band - lower', category: 'Indicator', isBoolean: false, params: [{ key: 'period', label: 'Period', default: 20 },{ key: 'stdDev', label: 'Std-dev multiplier', default: 2, step: 0.1 }] },
  { kind: 'vwap', label: 'VWAP (session)', category: 'Volume / Order-Flow Proxy', isBoolean: false, params: [] },
  { kind: 'rel_volume', label: 'Relative volume', category: 'Volume / Order-Flow Proxy', isBoolean: false, params: [{ key: 'period', label: 'Avg period', default: 20 }] },
  { kind: 'volume_spike', label: 'Volume spike (boolean)', category: 'Volume / Order-Flow Proxy', isBoolean: true, params: [{ key: 'period', label: 'Avg period', default: 20 },{ key: 'multiplier', label: 'Spike multiplier', default: 2, step: 0.1 }] },
  { kind: 'fvg_bullish', label: 'Fair Value Gap - bullish', category: 'ICT / Structure', isBoolean: true, params: [] },
  { kind: 'fvg_bearish', label: 'Fair Value Gap - bearish', category: 'ICT / Structure', isBoolean: true, params: [] },
  { kind: 'order_block_bullish', label: 'Order Block - bullish', category: 'ICT / Structure', isBoolean: true, params: [{ key: 'lookahead', label: 'Breakout lookahead (bars)', default: 3 },{ key: 'impulseMultiple', label: 'Impulse range multiple', default: 1.5, step: 0.1 },{ key: 'avgRangePeriod', label: 'Avg range period', default: 14 }] },
  { kind: 'order_block_bearish', label: 'Order Block - bearish', category: 'ICT / Structure', isBoolean: true, params: [{ key: 'lookahead', label: 'Breakout lookahead (bars)', default: 3 },{ key: 'impulseMultiple', label: 'Impulse range multiple', default: 1.5, step: 0.1 },{ key: 'avgRangePeriod', label: 'Avg range period', default: 14 }] },
  { kind: 'bos_bullish', label: 'Break of Structure - bullish', category: 'ICT / Structure', isBoolean: true, params: [{ key: 'swingLookback', label: 'Swing lookback', default: 2 }] },
  { kind: 'bos_bearish', label: 'Break of Structure - bearish', category: 'ICT / Structure', isBoolean: true, params: [{ key: 'swingLookback', label: 'Swing lookback', default: 2 }] },
  { kind: 'liquidity_sweep_high', label: 'Liquidity Sweep - high', category: 'ICT / Structure', isBoolean: true, params: [{ key: 'swingLookback', label: 'Swing lookback', default: 2 }] },
  { kind: 'liquidity_sweep_low', label: 'Liquidity Sweep - low', category: 'ICT / Structure', isBoolean: true, params: [{ key: 'swingLookback', label: 'Swing lookback', default: 2 }] },
  { kind: 'equal_highs', label: 'Equal Highs', category: 'ICT / Structure', isBoolean: true, params: [{ key: 'swingLookback', label: 'Swing lookback', default: 2 },{ key: 'tolerancePct', label: 'Tolerance %', default: 0.1, step: 0.05 }] },
  { kind: 'equal_lows', label: 'Equal Lows', category: 'ICT / Structure', isBoolean: true, params: [{ key: 'swingLookback', label: 'Swing lookback', default: 2 },{ key: 'tolerancePct', label: 'Tolerance %', default: 0.1, step: 0.05 }] },
  { kind: 'premium_zone', label: 'Premium Zone (boolean)', category: 'ICT / Structure', isBoolean: true, params: [{ key: 'rangePeriod', label: 'Range period', default: 20 }] },
  { kind: 'discount_zone', label: 'Discount Zone (boolean)', category: 'ICT / Structure', isBoolean: true, params: [{ key: 'rangePeriod', label: 'Range period', default: 20 }] },
  { kind: 'kill_zone', label: 'Kill Zone / session window (boolean)', category: 'ICT / Structure', isBoolean: true, params: [{ key: 'startHourUtc', label: 'Start hour (UTC)', default: 12 },{ key: 'endHourUtc', label: 'End hour (UTC)', default: 15 }] },
];

export function catalogEntry(kind: SignalKind): SignalCatalogEntry {
  const entry = SIGNAL_CATALOG.find((e) => e.kind === kind);
  if (!entry) throw new Error(`No catalog entry for signal kind "${kind}"`);
  return entry;
}

export const OPERATOR_LABELS: Record<string, string> = {
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  eq: '==',
  neq: '!=',
  crosses_above: 'crosses above',
  crosses_below: 'crosses below',
  is_true: 'is true',
  is_false: 'is false',
};

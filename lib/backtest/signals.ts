// Resolves a list of SignalSpec into named, per-bar aligned series that
// the condition evaluator / expression evaluator can reference by id.

import type { Bar, SignalSpec } from './types';
import * as ind from './indicators';
import * as vol from './volume';
import * as pat from './patterns';

export type ResolvedValue = number | boolean | null;
export type SignalTable = Record<string, ResolvedValue[]>;

export function buildSignalTable(bars: Bar[], specs: SignalSpec[]): SignalTable {
  const table: SignalTable = {};
  const opens = bars.map((b) => b.open);
  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const closes = bars.map((b) => b.close);
  const volumes = bars.map((b) => b.volume);

  table['open'] = opens;
  table['high'] = highs;
  table['low'] = lows;
  table['close'] = closes;
  table['volume'] = volumes;

  for (const spec of specs) {
    const p = spec.params ?? {};
    const num = (key: string, fallback: number) =>
      typeof p[key] === 'number' ? (p[key] as number) : Number(p[key] ?? fallback);

    switch (spec.kind) {
      case 'open': table[spec.id] = opens; break;
      case 'high': table[spec.id] = highs; break;
      case 'low': table[spec.id] = lows; break;
      case 'close': table[spec.id] = closes; oreak;
      case 'volume': table[spec.id] = volumes; break;
      case 'sma': table[spec.id] = ind.sma(closes, num('period', 20)); break;
      case 'ema': table[spec.id] = ind.ema(closes, num('period', 20)); break;
      case 'rsi': table[spec.id] = ind.rsi(closes, num('period', 14)); break;
      case 'atr': table[spec.id] = ind.atr(highs, lows, closes, num('period', 14)); break;
      case 'macd_line':
      case 'macd_signal':
      case 'macd_hist': {
        const r = ind.macd(closes, num('fast', 12), num('slow', 26), num('signal', 9));
        table[spec.id] = spec.kind === 'macd_line' ? r.macd : spec.kind === 'macd_signal' ? r.signal : r.histogram;
        break;
      }
      case 'bb_upper':
      case 'bb_middle':
      case 'bb_lower': {
        const r = ind.bollingerBands(closes, num('period', 20), num('stdDev', 2));
        table[spec.id] = spec.kind === 'bb_upper' ? r.upper : spec.kind === 'bb_middle' ? r.middle : r.lower;
        break;
      }
      case 'vwap': table[spec.id] = vol.vwap(bars); break;
      case 'rel_volume': table[spec.id] = vol.relativeVolume(bars, num('period', 20)); break;
      case 'volume_spike': table[spec.id] = vol.volumeSpike(bars, num('period', 20), num('multiplier', 2)); break;
      case 'fvg_bullish': table[spec.id] = pat.fairValueGap(bars).bullish; break;
      case 'fvg_bearish': table[spec.id] = pat.fairValueGap(bars).bearish; break;
      case 'order_block_bullish': table[spec.id] = pat.orderBlocks(bars, num('lookahead', 3), num('impulseMultiple', 1.5), num('avgRangePeriod', 14)).bullish; break;
      case 'order_block_bearish': table[spec.id] = pat.orderBlocks(bars, num('lookahead', 3), num('impulseMultiple', 1.5), num('avgRangePeriod', 14)).bearish; break;
      case 'bos_bullish': table[spec.id] = pat.breakOfStructure(bars, num('swingLookback', 2)).bullish; break;
      case 'bos_bearish': table[spec.id] = pat.breakOfStructure(bars, num('swingLookback', 2)).bearish; break;
      case 'liquidity_sweep_high': table[spec.id] = pat.liquiditySweep(bars, num('swingLookback', 2)).sweepHigh; break;
      case 'liquidity_sweep_low': table[spec.id] = pat.liquiditySweep(bars, num('swingLookback', 2)).sweepLow; break;
      case 'equal_highs': table[spec.id] = pat.equalHighsLows(bars, num('swingLookback', 2), num('tolerancePct', 0.1)).equalHighs; break;
      case 'equal_lows': table[spec.id] = pat.equalHighsLows(bars, num('swingLookback', 2), num('tolerancePct', 0.1)).equalLows; break;
      case 'premium_zone': table[spec.id] = pat.premiumDiscountZone(bars, num('rangePeriod', 20)).premium; break;
      case 'discount_zone': table[spec.id] = pat.premiumDiscountZone(bars, num('rangePeriod', 20)).discount; break;
      case 'kill_zone': table[spec.id] = pat.killZone(bars, num('startHourUtc', 12), num('endHourUtc', 15)); break;
      default: throw new Error(`Unknown signal kind: ${spec.kind}`);
    }
  }
  return table;
}

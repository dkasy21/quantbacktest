// Core backtest simulation loop. Walks bar-by-bar, evaluates entry/exit
// signals (either the dropdown condition tree or an advanced free-form
// expression), manages a single open position at a time with optional
// stop-loss / take-profit / max-holding-time exits, and produces a trade
// log + equity curve + summary metrics.
//
// Note on direction: 'both' is intentionally treated the same as 'long'.
// A single entry/exit rule set is ambiguous for true two-sided systems —
// rather than guess at logic that could silently misrepresent results,
// users who want a short-bias system should build it as its own
// strategy with direction: 'short'.

import type { Bar, BacktestResult, StrategyDefinition, Trade } from './types';
import type { SignalTable } from './signals';
import { buildSignalTable } from './signals';
import { evalGroup } from './conditions';
import { evaluateExpression, validateExpression } from './expr';

function entrySignal(def: StrategyDefinition, table: SignalTable, i: number): boolean {
  if (def.advancedExpression?.entry) {
    return evaluateExpression(def.advancedExpression.entry, rowContext(table, i));
  }
  return evalGroup(def.entry, table, i);
}

function exitSignal(def: StrategyDefinition, table: SignalTable, i: number): boolean {
  if (def.advancedExpression?.exit) {
    return evaluateExpression(def.advancedExpression.exit, rowContext(table, i));
  }
  return evalGroup(def.exit, table, i);
}

function rowContext(table: SignalTable, i: number): Record<string, number | boolean | null> {
  const ctx: Record<string, number | boolean | null> = {};
  for (const key of Object.keys(table)) ctx[key] = table[key][i] ?? null;
  return ctx;
}

export function validateStrategy(def: StrategyDefinition): void {
  if (!def.symbol) throw new Error('Strategy must specify a symbol.');
  if (def.risk.positionSizePct <= 0 || def.risk.positionSizePct > 100) {
    throw new Error('positionSizePct must be between 0 and 100.');
  }
  if (def.initialCapital <= 0) throw new Error('initialCapital must be > 0.');
  if (def.advancedExpression?.entry || def.advancedExpression?.exit) {
    const knownIds = ['open', 'high', 'low', 'close', 'volume', ...def.signals.map((s) => s.id)];
    if (def.advancedExpression.entry) validateExpression(def.advancedExpression.entry, knownIds);
    if (def.advancedExpression.exit) validateExpression(def.advancedExpression.exit, knownIds);
  }
}

export function runBacktest(bars: Bar[], def: StrategyDefinition): BacktestResult {
  validateStrategy(def);
  if (bars.length < 5) throw new Error('Not enough bars to run a backtest (need at least 5).');
  const direction: 'long' | 'short' = def.direction === 'short' ? 'short' : 'long';
  const table = buildSignalTable(bars, def.signals);
  let cashEquity = def.initialCapital;
  const trades: Trade[] = [];
  const equityCurve: { time: number; equity: number }[] = [];
  type OpenPosition = { direction: 'long'|'short'; entryIndex: number; entryTime: number; entryPrice: number; size: number; stopPrice: number|null; takeProfitPrice: number|null; };
  let position: OpenPosition | null = null;
  const closeTrade = (i: number, exitPrice: number, exitReason: Trade['exitReason']) => {
    if (!position) return;
    const sign = position.direction === 'long' ? 1 : -1;
    const pnl = sign * (exitPrice - position.entryPrice) * position.size;
    const pnlPct = (sign * (exitPrice - position.entryPrice) / position.entryPrice) * 100;
    cashEquity += pnl;
    trades.push({ direction: position.direction, entryIndex: position.entryIndex, entryTime: position.entryTime, entryPrice: position.entryPrice, exitIndex: i, exitTime: bars[i].time, exitPrice, exitReason, size: position.size, pnl, pnlPct });
    position = null;
  };
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    if (position) {
      const { direction: posDir, stopPrice, takeProfitPrice } = position;
      let exited = false;
      if (posDir === 'long') {
        if (stopPrice !== null && bar.low <= stopPrice) { closeTrade(i, stopPrice, 'stop_loss'); exited=true; }
        else if (takeProfitPrice !== null && bar.high >= takeProfitPrice) { closeTrade(i, takeProfitPrice, 'take_profit'); exited=true; }
      } else {
        if (stopPrice !== null && bar.high >= stopPrice) { closeTrade(i, stopPrice, 'stop_loss'); exited=true; }
        else if (takeProfitPrice !== null && bar.low <= takeProfitPrice) { closeTrade(i, takeProfitPrice, 'take_profit'); exited=true; }
      }
      if (!exited && position) {
        const maxBars = def.risk.maxBarsInTrade;
        if (maxBars && i - position.entryIndex >= maxBars) { closeTrade(i, bar.close, 'max_bars'); exited=true; }
        else if (exitSignal(def, table, i)) { closeTrade(i, bar.close, 'signal'); exited=true; }
      }
    }
    if (!position && entrySignal(def, table, i)) {
      const entryPrice = bar.close;
      const allocation = (cashEquity * def.risk.positionSizePct) / 100;
      const size = allocation / entryPrice;
      const sign = direction === 'long' ? 1 : -1;
      const stopPrice = def.risk.stopLossPct ? entryPrice * (1 - sign * (def.risk.stopLossPct / 100)) : null;
      const takeProfitPrice = def.risk.takeProfitPct ? entryPrice * (1 + sign * (def.risk.takeProfitPct / 100)) : null;
      position = { direction, entryIndex: i, entryTime: bar.time, entryPrice, size, stopPrice, takeProfitPrice };
    }
    const mtm = position ? cashEquity + (position.direction === 'long' ? 1 : -1) * (bar.close - position.entryPrice) * position.size : cashEquity;
    equityCurve.push({ time: bar.time, equity: mtm });
  }
  if (position) {
    closeTrade(bars.length-1, bars[bars.length-1].close, 'end_of_data');
    if (equityCurve.length>0) equityCurve[equityCurve.length-1].equity = cashEquity;
  }
  return { trades, equityCurve, metrics: computeMetrics(trades, equityCurve, def.initialCapital) };
}

function computeMetrics(trades: Trade[], equityCurve: { time: number; equity: number }[], initialCapital: number): BacktestResult['metrics'] {
  const finalEquity = equityCurve.length ? equityCurve[equityCurve.length-1].equity : initialCapital;
  const totalReturnPct = ((finalEquity - initialCapital) / initialCapital) * 100;
  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl <= 0);
  const winRate = trades.length ? (wins.length / trades.length) * 100 : 0;
  const grossProfit = wins.reduce((s,t) => s+t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s,t) => s+t.pnl, 0));
  const profitFactor = grossLoss>0 ? grossProfit/grossLoss : grossProfit>0 ? Infinity : 0;
  const avgWinPct = wins.length ? wins.reduce((s,t) => s+t.pnlPct, 0)/wins.length : 0;
  const avgLossPct = losses.length ? losses.reduce((s,t) => s+t.pnlPct,0)/losses.length : 0;
  let peak = -Infinity, maxDrawdownPct = 0;
  for (const p of equityCurve) {
    peak = Math.max(peak, p.equity);
    if (peak>0) maxDrawdownPct = Math.max(maxDrawdownPct, ((peak-p.equity)/peak)*100);
  }
  const returns: number[] = [];
  for (let i=1;i<equityCurve.length;i++) { const prev=equityCurve[i-1].equity; if (prev>0) returns.push((equityCurve[i].equity-prev)/prev); }
  let sharpeRatio = 0;
  if (returns.length>1) { const mean=returns.reduce((s,r)=>s+r,0)/returns.length; const var=returns.reduce((s,r)=>s+(r-mean)**2,0)/(returns.length-1); const std=Math.sqrt(var); sharpeRatio=std>0?(mean/std)*Math.sqrt(252):0; }
  return { totalReturnPct, finalEquity, totalTrades: trades.length, winRate, profitFactor, avgWinPct, avgLossPct, maxDrawdownPct, sharpeRatio };
}

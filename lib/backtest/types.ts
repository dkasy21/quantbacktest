export interface Bar { time: number; open: number; high: number; low: number; close: number; volume: number; }
export type SignalKind = 'open'|'high'|'low'|'close'|'volume'|'sma'|'ema'|'rsi'|'atr'|'macd_line'|'macd_signal'|'macd_hist'|'bb_upper'|'bb_middle'|'bb_lower'|'vwap'|'rel_volume'|'volume_spike'|'fvg_bullish'|'fvg_bearish'|'order_block_bullish'|'order_block_bearish'|'bos_bullish'|'bos_bearish'|'liquidity_sweep_high'|'liquidity_sweep_low'|'equal_highs'|'equal_lows'|'premium_zone'|'discount_zone'|'kill_zone';
export interface SignalSpec { id: string; kind: SignalKind; params?: Record<string, number|string>; }
export type Operator = 'gt'|'gte'|'lt'|'lte'|'eq'|'neq'|'crosses_above'|'crosses_below'|'is_true'|'is_false';
export interface SignalRef { signalId: string; }
export interface Condition { type: 'condition'; left: SignalRef; operator: Operator; right?: SignalRef|number; }
export interface ConditionGroup { type: 'group'; logic: 'AND'|'OR'; children: (Condition|ConditionGroup)[]; }
export function isGroup(c) { return c.type === 'group'; }
export interface RiskSettings { positionSizePct: number; stopLossPct?: number; takeProfitPct?: number; maxBarsInTrade?: number; }
export interface StrategyDefinition { name: string; symbol: string; direction: 'long'|'short'|'both'; signals: SignalSpec[]; entry: ConditionGroup; exit: ConditionGroup; advancedExpression?: { entry?: string; exit?: string; }; risk: RiskSettings; initialCapital: number; }
export interface Trade { direction: 'long'|'short'; entryIndex: number; entryTime: number; entryPrice: number; exitIndex: number; exitTime: number; exitPrice: number; exitReason: 'signal'|'stop_loss'|'take_profit'|'max_bars'|'end_of_data'; size: number; pnl: number; pnlPct: number; }
export interface BacktestResult { trades: Trade[]; equityCurve: { time: number; equity: number; }[]; metrics: { totalReturnPct: number; finalEquity: number; totalTrades: number; winRate: number; profitFactor: number; avgWinPct: number; avgLossPct: number; maxDrawdownPct: number; sharpeRatio: number; }; }
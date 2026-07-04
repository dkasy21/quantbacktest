import yahooFinance from 'yahoo-finance2';
export type Interval = '1d'|'1h'|'30m'|'15m'|'5m';
export interface FetchBarsParams { symbol: string; interval: Interval; startDate: string; endDate: string; }
const cache = new Map();
const CACHE_TTL_MS = 5*60*1000;
export class DataFetchError extends Error {}

// Map user-friendly symbols to Yahoo Finance tickers
const SYMBOL_MAP: Record<string, string> = {
  // Equity index futures
  'ES': 'ES=F', 'MES': 'MES=F',
  'NQ': 'NQ=F', 'MNQ': 'MNQ=F',
  'RTY': 'RTY=F', 'M2K': 'M2K=F',
  'YM': 'YM=F', 'MYM': 'MYM=F',
  // Cash indices
  'SPX': '^GSPC', 'NDX': '^NDX', 'DJI': '^DJI',
  'RUT': '^RUT', 'VIX': '^VIX',
  // Commodities
  'XAUUSD': 'GC=F', 'GOLD': 'GC=F', 'GC': 'GC=F',
  'XAGUSD': 'SI=F', 'SILVER': 'SI=F', 'SI': 'SI=F',
  'CL': 'CL=F', 'WTI': 'CL=F', 'CRUDE': 'CL=F', 'OIL': 'CL=F',
  'NG': 'NG=F', 'HG': 'HG=F',
  // FX
  'DXY': 'DX-Y.NYB', 'EURUSD': 'EURUSD=X', 'GBPUSD': 'GBPUSD=X',
  'USDJPY': 'JPY=X', 'AUDUSD': 'AUDUSD=X',
  // Crypto
  'BTC': 'BTC-USD', 'BTCUSD': 'BTC-USD', 'BITCOIN': 'BTC-USD',
  'ETH': 'ETH-USD', 'ETHUSD': 'ETH-USD',
  'SOL': 'SOL-USD', 'XRP': 'XRP-USD',
  // Bonds
  'ZN': 'ZN=F', 'ZB': 'ZB=F',
};

function resolveSymbol(sym: string): string {
  const upper = sym.toUpperCase();
  return SYMBOL_MAP[upper] ?? sym;
}

export async function fetchBars(params: FetchBarsParams) {
const { symbol: rawSymbol, interval, startDate, endDate } = params;
const symbol = resolveSymbol(rawSymbol);
if (!rawSymbol || !/^[A-Za-z0-9.\-=^]{1,20}$/.test(rawSymbol)) throw new DataFetchError(`Invalid symbol: "${rawSymbol}"`);
const start = new Date(startDate), end = new Date(endDate);
if (isNaN(start.getTime())||isNaN(end.getTime())) throw new DataFetchError('Invalid dates.');
if (start>=end) throw new DataFetchError('startDate must be before endDate.');
const key = `${symbol}|${interval}|${startDate}|${endDate}`;
const c = cache.get(key);
if (c && Date.now()-c.fetchedAt<CACHE_TTL_MS) return c.data;
let result;
try {
  result = await yahooFinance.chart(symbol, { period1: start, period2: end, interval });
} catch (err) {
  throw new DataFetchError(`Failed to fetch "${rawSymbol}": ${err instanceof Error?err.message:String(err)}`);
}
const quotes = result?.quotes??[];
if (quotes.length===0) throw new DataFetchError(`No data for "${rawSymbol}" in this range.`);
const bars = quotes.filter((q: { open: number|null; high: number|null; low: number|null; close: number|null }) => q.open!=null&&q.high!=null&&q.low!=null&&q.close!=null).map((q: { date: string|Date; open: number; high: number; low: number; close: number; volume?: number }) => ({ time:Math.floor(new Date(q.date).getTime()/1000), open:q.open, high:q.high, low:q.low, close:q.close, volume:q.volume??0 }));
if (bars.length===0) throw new DataFetchError(`No valid bars for "${rawSymbol}".`);
cache.set(key, { data: bars, fetchedAt: Date.now() });
return bars;
}

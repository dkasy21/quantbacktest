import yahooFinance from 'yahoo-finance2';
export type Interval = '1d'|'1h'|'30m'|'15m'|'5m';
export interface FetchBarsParams { symbol: string; interval: Interval; startDate: string; endDate: string; }
const cache = new Map();
const CACHE_TTL_MS = 5*60*1000;
export class DataFetchError extends Error {}

// Yahoo Finance max lookback per interval
const MAX_DAYS: Record<string, number> = {
  '5m': 59, '15m': 59, '30m': 59, '1h': 729, '1d': 9999,
};

// Map user-friendly symbols to Yahoo Finance tickers
const SYMBOL_MAP: Record<string, string> = {
  'ES': 'ES=F', 'MES': 'MES=F',
  'NQ': 'NQ=F', 'MNQ': 'MNQ=F',
  'RTY': 'RTY=F', 'M2K': 'M2K=F',
  'YM': 'YM=F', 'MYM': 'MYM=F',
  'SPX': '^GSPC', 'NDX': '^NDX', 'DJI': '^DJI',
  'RUT': '^RUT', 'VIX': '^VIX',
  'XAUUSD': 'GC=F', 'GOLD': 'GC=F', 'GC': 'GC=F',
  'XAGUSD': 'SI=F', 'SILVER': 'SI=F', 'SI': 'SI=F',
  'CL': 'CL=F', 'WTI': 'CL=F', 'CRUDE': 'CL=F', 'OIL': 'CL=F',
  'NG': 'NG=F', 'HG': 'HG=F',
  'DXY': 'DX-Y.NYB', 'EURUSD': 'EURUSD=X', 'GBPUSD': 'GBPUSD=X',
  'USDJPY': 'JPY=X', 'AUDUSD': 'AUDUSD=X',
  'BTC': 'BTC-USD', 'BTCUSD': 'BTC-USD', 'BITCOIN': 'BTC-USD',
  'ETH': 'ETH-USD', 'ETHUSD': 'ETH-USD',
  'SOL': 'SOL-USD', 'XRP': 'XRP-USD',
  'ZN': 'ZN=F', 'ZB': 'ZB=F',
};

function resolveSymbol(sym: string): string {
  const upper = sym.toUpperCase();
  return SYMBOL_MAP[upper] ?? sym;
}

async function fetchWithRetry(symbol: string, opts: object, retries = 3): Promise<unknown> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await yahooFinance.chart(symbol, opts);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if ((msg.includes('Too Many Requests') || msg.includes('429')) && i < retries) {
        await new Promise(r => setTimeout(r, 1500 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

export async function fetchBars(params: FetchBarsParams) {
  const { symbol: rawSymbol, interval, startDate, endDate } = params;
  const symbol = resolveSymbol(rawSymbol);
  if (!rawSymbol || !/^[A-Za-z0-9.\-=^]{1,20}$/.test(rawSymbol)) throw new DataFetchError(`Invalid symbol: "${rawSymbol}"`);
  const end = new Date(endDate);
  let start = new Date(startDate);
  if (isNaN(start.getTime())||isNaN(end.getTime())) throw new DataFetchError('Invalid dates.');
  if (start>=end) throw new DataFetchError('startDate must be before endDate.');

  // Clamp start to Yahoo Finance's max lookback for this interval
  const maxDays = MAX_DAYS[interval] ?? 59;
  const minStart = new Date(end.getTime() - maxDays * 24 * 60 * 60 * 1000);
  if (start < minStart) start = minStart;

  const key = `${symbol}|${interval}|${start.toISOString()}|${endDate}`;
  const c = cache.get(key);
  if (c && Date.now()-c.fetchedAt<CACHE_TTL_MS) return c.data;

  let result;
  try {
    result = await fetchWithRetry(symbol, { period1: start, period2: end, interval });
  } catch (err) {
    throw new DataFetchError(`Failed to fetch "${rawSymbol}": ${err instanceof Error?err.message:String(err)}`);
  }
  const quotes = (result as { quotes?: unknown[] })?.quotes ?? [];
  if (quotes.length===0) throw new DataFetchError(`No data for "${rawSymbol}" in this range. Check the symbol and date range.`);
  const bars = (quotes as Array<{ open: number|null; high: number|null; low: number|null; close: number|null; date: string|Date; volume?: number }>)
    .filter(q => q.open!=null&&q.high!=null&&q.low!=null&&q.close!=null)
    .map(q => ({ time:Math.floor(new Date(q.date).getTime()/1000), open:q.open as number, high:q.high as number, low:q.low as number, close:q.close as number, volume:q.volume??0 }));
  if (bars.length===0) throw new DataFetchError(`No valid bars for "${rawSymbol}".`);
  cache.set(key, { data: bars, fetchedAt: Date.now() });
  return bars;
}

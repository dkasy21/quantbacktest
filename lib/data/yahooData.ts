import yahooFinance from 'yahoo-finance2';
export type Interval = '1d'|'1h'|'30m'|'15m'|'5m';
export interface FetchBarsParams { symbol: string; interval: Interval; startDate: string; endDate: string; }
const cache = new Map();
const CACHE_TTL_MS = 5*60*1000;
export class DataFetchError extends Error {}
export async function fetchBars(params) {
  const { symbol, interval, startDate, endDate } = params;
  if (!symbol || !/^[A-Za-z0-9.\-=^]{1,15}$/.test(symbol)) throw new DataFetchError(`Invalid symbol: "${symbol}"`);
  const start = new Date(startDate), end = new Date(endDate);
  if (isNaN(start.getTime())||isNaN(end.getTime())) throw new DataFetchError('Invalid dates.');
  if (start>=end) throw new DataFetchError('startDate must be before endDate.');
  const key = `${symbol}|${interval}|${startDate}|${endDate}`;
  const c = cache.get(key);
  if (c && Date.now()-c.fetchedAt<CACHE_TTL_MS) return c.data;
  let result; try { result = await yahooFinance.chart(symbol, { period1: start, period2: end, interval }); } catch (err) { throw new DataFetchError(`Failed to fetch "${symbol}": ${err instanceof Error?err.message:String(err)}`); }
  const quotes = result?.quotes??[];
  if (quotes.length===0) throw new DataFetchError(`No data for "${symbol}" in this range.`);
  const bars = quotes.filter(q => q.open!=null&&q.high !=null&&q.low!=null&&q.close!=null).map(q => ({ time:Math.floor(new Date(q.date).getTime()/1000), open:q.open, high:q.high, low:q.low, close:q.close, volume:q.volume??0 }));
  if (bars.length===0) throw new DataFetchError(`No valid bars for "${symbol}".`);
  cache.set(key, { data: bars, fetchedAt: Date.now() });
  return bars;
}

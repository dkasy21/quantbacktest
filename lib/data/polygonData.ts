import type { FetchBarsParams } from './yahooData';
import { DataFetchError } from './yahooData';

const POLYGON_BASE = 'https://api.polygon.io';
const cache = new Map<string, { data: unknown; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function toPolygonInterval(interval: string): { multiplier: number; timespan: string } {
  switch (interval) {
    case '5m':  return { multiplier: 5,  timespan: 'minute' };
    case '15m': return { multiplier: 15, timespan: 'minute' };
    case '30m': return { multiplier: 30, timespan: 'minute' };
    case '1h':  return { multiplier: 1,  timespan: 'hour' };
    case '1d':
    default:    return { multiplier: 1,  timespan: 'day' };
  }
}

// Convert user/yahoo symbol to Polygon ticker format
function toPolygonTicker(symbol: string): string {
  const s = symbol.toUpperCase();
  if (s.endsWith('-USD')) return `X:${s.replace('-USD', 'USD')}`;  // BTC-USD → X:BTCUSD
  if (s.endsWith('=X'))  return `C:${s.replace('=X', '')}`;         // EURUSD=X → C:EURUSD
  return s;
}

export async function fetchBars(params: FetchBarsParams) {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) throw new DataFetchError('POLYGON_API_KEY not set.');

  const { symbol, interval, startDate, endDate } = params;
  const ticker = toPolygonTicker(symbol);
  const { multiplier, timespan } = toPolygonInterval(interval);

  const key = `polygon|${ticker}|${interval}|${startDate}|${endDate}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.data;

  const url = `${POLYGON_BASE}/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${startDate}/${endDate}?adjusted=true&sort=asc&limit=50000&apiKey=${apiKey}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new DataFetchError(`Network error fetching "${symbol}": ${err instanceof Error ? err.message : String(err)}`);
  }

  if (res.status === 429) throw new DataFetchError('Polygon rate limit reached. Wait a moment and try again.');
  if (res.status === 403) throw new DataFetchError('Polygon API key invalid or subscription required for this symbol.');
  if (!res.ok) throw new DataFetchError(`Polygon error ${res.status} for "${symbol}".`);

  const json = await res.json() as {
    results?: Array<{ t: number; o: number; h: number; l: number; c: number; v: number }>;
    status?: string;
    error?: string;
  };

  if (!json.results || json.results.length === 0) {
    throw new DataFetchError(
      `No Polygon data for "${symbol}". Note: Polygon free tier covers US stocks, ETFs, crypto & forex — not futures (MNQ, ES, NQ, etc.). For futures, switch to Daily timeframe.`
    );
  }

  const bars = json.results.map(r => ({
    time: Math.floor(r.t / 1000),
    open: r.o,
    high: r.h,
    low: r.l,
    close: r.c,
    volume: r.v,
  }));

  cache.set(key, { data: bars, fetchedAt: Date.now() });
  return bars;
}

import type { Bar } from '../backtest/types';
import type { Interval } from './yahooData';
export type { Interval } from './yahooData';
export { DataFetchError } from './yahooData';
import { DataFetchError } from './yahooData';

export interface FetchBarsParams {
  symbol: string;
  interval: Interval;
  startDate: string;
  endDate: string;
}

const INTERVAL_MAP: Record<Interval, string> = {
  '1d': '1day',
  '1h': '1h',
  '30m': '30min',
  '15m': '15min',
  '5m': '5min',
};

const cache = new Map<string, { data: Bar[]; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

interface TwelveDataValue {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
}
interface TwelveDataResponse {
  values?: TwelveDataValue[];
  status?: string;
  message?: string;
  code?: number;
}

export async function fetchBars(params: FetchBarsParams): Promise<Bar[]> {
  const { symbol, interval, startDate, endDate } = params;
  if (!symbol || !/^[A-Za-z0-9./\-=^]{1,20}$/.test(symbol)) {
    throw new DataFetchError(`Invalid symbol: "${symbol}"`);
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new DataFetchError('Invalid start/end date.');
  }
  if (start >= end) {
    throw new DataFetchError('startDate must be before endDate.');
  }
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) throw new DataFetchError('TWELVE_DATA_API_KEY is not set.');

  const cacheKey = `td|${symbol}|${interval}|${startDate}|${endDate}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.data;

  const url = new URL('https://api.twelvedata.com/time_series');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('interval', INTERVAL_MAP[interval]);
  url.searchParams.set('start_date', startDate);
  url.searchParams.set('end_date', endDate);
  url.searchParams.set('apikey', apiKey);
  url.searchParams.set('format', 'JSON');
  url.searchParams.set('order', 'ASC');
  url.searchParams.set('outputsize', '5000');

  let json: TwelveDataResponse;
  try {
    const res = await fetch(url.toString());
    json = await res.json() as TwelveDataResponse;
  } catch (err) {
    throw new DataFetchError(
      `Network error fetching "${symbol}": ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (json.status === 'error') {
    throw new DataFetchError(
      `Twelve Data error for "${symbol}": ${json.message ?? 'unknown error'}`
    );
  }

  const values = json.values ?? [];
  if (values.length === 0) {
    throw new DataFetchError(`No data returned for "${symbol}" in the requested date range.`);
  }

  const bars: Bar[] = values
    .map(v => ({
      time: Math.floor(new Date(v.datetime).getTime() / 1000),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: v.volume ? parseFloat(v.volume) : 0,
    }))
    .filter(b =>
      Number.isFinite(b.open) &&
      Number.isFinite(b.high) &&
      Number.isFinite(b.low) &&
      Number.isFinite(b.close)
    )
    .sort((a, b) => a.time - b.time);

  if (bars.length === 0) {
    throw new DataFetchError(`Data for "${symbol}" contained no valid bars.`);
  }

  cache.set(cacheKey, { data: bars, fetchedAt: Date.now() });
  return bars;
}

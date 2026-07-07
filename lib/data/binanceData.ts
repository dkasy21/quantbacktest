// Binance public spot market data — used for (a) crypto pairs generally,
// and (b) as the source of real per-candle orderflow (buy/sell volume
// split) used by the `of_*` signals in lib/backtest/orderflow.ts.
//
// Why Binance specifically: it's a free, public, no-auth REST endpoint
// (no API key, no card, no signup) that returns actual exchange trade data,
// not a licensed/redistributed feed — so there's no commercial-use question
// like there is with Yahoo. Each kline row already includes "taker buy base
// asset volume," i.e. how much of that candle's volume was buyer-initiated
// vs seller-initiated. That's a real, exchange-reported buy/sell split —
// not synthetic — which is enough to compute delta / cumulative volume
// delta (CVD) without needing full tick-by-tick trade replay or a paid
// order-book feed. It is NOT full L2/L3 order-book depth (no bid/ask ladder,
// no queue position) — see the comment atop orderflow.ts for that
// distinction.
//
// Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#klinecandlestick-data
// Rate limits are generous for this use case (klines has a low request
// weight; see docs) and require no authentication for market data.

import type { Bar } from '../backtest/types';
import type { Interval } from './yahooData';
import { DataFetchError } from './yahooData';

export interface FetchBarsParams {
  symbol: string;
  interval: Interval;
  startDate: string;
  endDate: string;
}

const API_BASE = 'https://api.binance.com/api/v3/klines';

// Binance supports these intervals natively — unlike Databento, no
// resampling is needed for any interval this app uses.
const INTERVAL_MAP: Record<Interval, string> = {
  '1d': '1d',
  '1h': '1h',
  '30m': '30m',
  '15m': '15m',
  '5m': '5m',
};

// Friendly aliases -> Binance's USDT spot pair naming. Anything already
// shaped like a Binance pair (e.g. "BTCUSDT", "SOLUSDT") is passed through
// as-is by supportsSymbol()/toBinanceSymbol() below.
const ALIAS_MAP: Record<string, string> = {
  BTC: 'BTCUSDT', BTCUSD: 'BTCUSDT', BITCOIN: 'BTCUSDT',
  ETH: 'ETHUSDT', ETHUSD: 'ETHUSDT',
  SOL: 'SOLUSDT', SOLUSD: 'SOLUSDT',
  XRP: 'XRPUSDT', XRPUSD: 'XRPUSDT',
  DOGE: 'DOGEUSDT', DOGEUSD: 'DOGEUSDT',
  ADA: 'ADAUSDT', ADAUSD: 'ADAUSDT',
  BNB: 'BNBUSDT', BNBUSD: 'BNBUSDT',
  AVAX: 'AVAXUSDT', LINK: 'LINKUSDT', LTC: 'LTCUSDT',
  MATIC: 'MATICUSDT', DOT: 'DOTUSDT', TRX: 'TRXUSDT',
};

const DIRECT_PAIR_RE = /^[A-Z0-9]{2,15}(USDT|USDC|BUSD)$/;

export function supportsSymbol(raw: string): boolean {
  const s = raw.toUpperCase();
  return s in ALIAS_MAP || DIRECT_PAIR_RE.test(s);
}

function toBinanceSymbol(raw: string): string {
  const s = raw.toUpperCase();
  return ALIAS_MAP[s] ?? s;
}

const cache = new Map<string, { data: Bar[]; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

// Safety cap so a very wide date range on a small interval (e.g. 5m over
// several years) can't page forever or blow up a serverless function.
const MAX_BARS = 8000;
const MAX_PAGES = 30;

type BinanceKlineRow = [
  number, string, string, string, string, string,
  number, string, number, string, string, string
];

export async function fetchBars(params: FetchBarsParams): Promise<Bar[]> {
  const { symbol: rawSymbol, interval, startDate, endDate } = params;
  if (!supportsSymbol(rawSymbol)) {
    throw new DataFetchError(`"${rawSymbol}" is not a symbol this Binance integration recognizes.`);
  }
  const binanceSymbol = toBinanceSymbol(rawSymbol);
  const binanceInterval = INTERVAL_MAP[interval];

  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  if (isNaN(startMs) || isNaN(endMs)) throw new DataFetchError('Invalid start/end date.');
  if (startMs >= endMs) throw new DataFetchError('startDate must be before endDate.');

  const cacheKey = `binance|${binanceSymbol}|${interval}|${startDate}|${endDate}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.data;

  const bars: Bar[] = [];
  let cursor = startMs;
  let page = 0;

  while (cursor < endMs && bars.length < MAX_BARS && page < MAX_PAGES) {
    page++;
    const url = new URL(API_BASE);
    url.searchParams.set('symbol', binanceSymbol);
    url.searchParams.set('interval', binanceInterval);
    url.searchParams.set('startTime', String(cursor));
    url.searchParams.set('endTime', String(endMs));
    url.searchParams.set('limit', '1000');

    let res: Response;
    try {
      res = await fetch(url.toString());
    } catch (err) {
      throw new DataFetchError(
        `Network error fetching "${rawSymbol}" from Binance: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      if (res.status === 400 && body.includes('Invalid symbol')) {
        throw new DataFetchError(`Binance doesn't list a pair for "${rawSymbol}" (tried "${binanceSymbol}").`);
      }
      throw new DataFetchError(`Binance error ${res.status} for "${rawSymbol}": ${body.slice(0, 300)}`);
    }

    const rows = (await res.json()) as BinanceKlineRow[];
    if (!Array.isArray(rows) || rows.length === 0) break;

    for (const row of rows) {
      const [openTime, open, high, low, close, volume, , , , takerBuyBaseVolume] = row;
      const parsedVolume = parseFloat(volume);
      const parsedBuyVolume = parseFloat(takerBuyBaseVolume);
      bars.push({
        time: Math.floor(openTime / 1000),
        open: parseFloat(open),
        high: parseFloat(high),
        low: parseFloat(low),
        close: parseFloat(close),
        volume: Number.isFinite(parsedVolume) ? parsedVolume : 0,
        buyVolume: Number.isFinite(parsedBuyVolume) ? parsedBuyVolume : undefined,
      });
    }

    if (rows.length < 1000) break; // last page
    cursor = rows[rows.length - 1][0] + 1;
  }

  const validBars = bars.filter(
    (b) => [b.open, b.high, b.low, b.close].every(Number.isFinite)
  );

  if (validBars.length === 0) {
    throw new DataFetchError(`No Binance data for "${rawSymbol}" in this range.`);
  }

  cache.set(cacheKey, { data: validBars, fetchedAt: Date.now() });
  return validBars;
}

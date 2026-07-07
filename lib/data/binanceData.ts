// Binance.US public spot market data — used for (a) crypto pairs generally,
// and (b) as the source of real per-candle orderflow (buy/sell volume
// split) used by the `of_*` signals in lib/backtest/orderflow.ts.
//
// IMPORTANT — why .us and not .com: this originally targeted api.binance.com,
// which is free and public but actively geo-blocks requests from the United
// States (HTTP 451, "restricted location" per Binance's terms). Vercel's
// serverless functions for this project run in a US region (iad1), so every
// request from production/preview came back 451 and silently fell through
// to the old Yahoo/TwelveData chain — meaning the orderflow feature looked
// wired up but returned zero real orderflow data. Confirmed via Vercel
// runtime logs on 2026-07-07. Fix: use api.binance.us instead — same
// company's US-compliant exchange, not geo-blocked for US server IPs, same
// kline response shape (including the taker-buy-volume field), just
// different pair naming: USD pairs (BTCUSD, ETHUSD) instead of USDT pairs
// (BTCUSDT, ETHUSDT). Binance.US doesn't list every pair Binance.com does
// (e.g. no BUSD pairs), but covers all the majors this integration maps —
// verified live against its /exchangeInfo endpoint.
//
// Docs: https://docs.binance.us/
// Rate limits are generous for this use case (klines has a low request
// weight) and require no authentication for market data.

import type { Bar } from '../backtest/types';
import type { Interval } from './yahooData';
import { DataFetchError } from './yahooData';

export interface FetchBarsParams {
  symbol: string;
  interval: Interval;
  startDate: string;
  endDate: string;
}

const API_BASE = 'https://api.binance.us/api/v3/klines';

// Binance supports these intervals natively — unlike Databento, no
// resampling is needed for any interval this app uses.
const INTERVAL_MAP: Record<Interval, string> = {
  '1d': '1d',
  '1h': '1h',
  '30m': '30m',
  '15m': '15m',
  '5m': '5m',
};

// Friendly aliases -> Binance.US's USD spot pair naming. Anything already
// shaped like a Binance.US pair (e.g. "BTCUSD", "SOLUSD") is passed through
// as-is by supportsSymbol()/toBinanceSymbol() below. Note this is USD, not
// USDT — Binance.US's majors trade against USD, not Tether.
const ALIAS_MAP: Record<string, string> = {
  BTC: 'BTCUSD', BITCOIN: 'BTCUSD',
  ETH: 'ETHUSD',
  SOL: 'SOLUSD',
  XRP: 'XRPUSD',
  DOGE: 'DOGEUSD',
  ADA: 'ADAUSD',
  BNB: 'BNBUSD',
  AVAX: 'AVAXUSD', LINK: 'LINKUSD', LTC: 'LTCUSD',
  MATIC: 'MATICUSD', DOT: 'DOTUSD', TRX: 'TRXUSD',
};

const DIRECT_PAIR_RE = /^[A-Z0-9]{2,15}(USD|USDT|USDC|BUSD)$/;

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

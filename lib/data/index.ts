import * as yahoo from './yahooData';
import { fetchBars as polygonFetchBars } from './polygonData';
import { fetchBars as twelveDataFetchBars } from './twelveDataData';
import { fetchBars as databentoFetchBars, supportsSymbol as isDatabentoFutures } from './databentoData';
import { fetchBars as binanceFetchBars, supportsSymbol as isBinanceCrypto } from './binanceData';
export type { Interval, FetchBarsParams } from './yahooData';
export { DataFetchError } from './yahooData';
import type { FetchBarsParams } from './yahooData';

function isYahooOnly(s: string): boolean {
  const u = s.toUpperCase();
  return u.endsWith('=F') || u.startsWith('DX-');
}

function toTwelveDataSymbol(raw: string): string {
  const s = raw.toUpperCase();
  const MAP: Record<string, string> = {
    'ES': 'SPX', 'MES': 'SPX', 'NQ': 'NDX', 'MNQ': 'NDX',
    'YM': 'DJI', 'MYM': 'DJI', 'RTY': 'RUT', 'M2K': 'RUT',
    'XAUUSD': 'XAU/USD', 'GC': 'XAU/USD', 'GOLD': 'XAU/USD',
    'XAGUSD': 'XAG/USD', 'SI': 'XAG/USD', 'SILVER': 'XAG/USD',
    'BTC': 'BTC/USD', 'ETH': 'ETH/USD',
    'EURUSD': 'EUR/USD', 'GBPUSD': 'GBP/USD', 'USDJPY': 'USD/JPY', 'DXY': 'DXY',
    'CL': 'WTI', 'OIL': 'WTI', 'WTI': 'WTI',
    'SPX': 'SPX', 'NDX': 'NDX', 'VIX': 'VIX', 'DJI': 'DJI',
  };
  return MAP[s] ?? raw;
}

export async function fetchBars(params: FetchBarsParams) {
  const hasDatabento = !!process.env.DATABENTO_API_KEY;
  const hasTwelveData = !!process.env.TWELVE_DATA_API_KEY;
  const hasPolygon = !!process.env.POLYGON_API_KEY;
  if (isYahooOnly(params.symbol)) return yahoo.fetchBars(params);

  // Added 2026-07-06: real exchange-traded futures (ES, MNQ, GC, CL, etc.)
  // now go to Databento first, since it's a licensed CME distributor and
  // returns the actual futures contract — not a substitute. Previously
  // these fell through to TwelveData with a symbol swap (e.g. ES -> SPX
  // cash index below), which is a different instrument with different
  // session hours and no overnight Globex activity, or to Yahoo, which
  // isn't licensed for commercial use. Falls back to the old behavior if
  // Databento isn't configured or the request fails.
  if (hasDatabento && isDatabentoFutures(params.symbol)) {
    try {
      return await databentoFetchBars(params);
    } catch (err) { console.warn('[data] Databento failed:', err); }
  }

  // Added 2026-07-07: crypto pairs go to Binance's free public API first.
  // Reasons this comes before TwelveData/Polygon: (1) it's free and
  // requires no key/card at all, so it works out of the box; (2) Binance's
  // klines response includes a real taker-buy/sell volume split per candle,
  // which powers the of_delta/of_cvd/of_buy_ratio/of_delta_divergence_*
  // orderflow signals (lib/backtest/orderflow.ts) — TwelveData/Polygon/
  // Yahoo only return aggregate volume, so those signals would resolve to
  // null on data from those providers. Falls back to the old chain if
  // Binance is unreachable or the pair isn't recognized.
  if (isBinanceCrypto(params.symbol)) {
    try {
      return await binanceFetchBars(params);
    } catch (err) { console.warn('[data] Binance failed:', err); }
  }

  if (hasTwelveData) {
    try {
      return await twelveDataFetchBars({ ...params, symbol: toTwelveDataSymbol(params.symbol) });
    } catch (err) { console.warn('[data] Twelve Data failed:', err); }
  }
  if (hasPolygon) {
    try { return await polygonFetchBars(params); }
    catch (err) { console.warn('[data] Polygon failed:', err); }
  }
  return yahoo.fetchBars(params);
}

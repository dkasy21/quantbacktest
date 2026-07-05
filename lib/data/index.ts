import * as yahoo from './yahooData';
import { fetchBars as polygonFetchBars } from './polygonData';
import { fetchBars as twelveDataFetchBars } from './twelveDataData';
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
  const hasTwelveData = !!process.env.TWELVE_DATA_API_KEY;
  const hasPolygon = !!process.env.POLYGON_API_KEY;
  if (isYahooOnly(params.symbol)) return yahoo.fetchBars(params);
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

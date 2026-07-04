import * as yahoo from './yahooData';
import { fetchBars as polygonFetchBars } from './polygonData';
export type { Interval, FetchBarsParams } from './yahooData';
export { DataFetchError } from './yahooData';
import type { FetchBarsParams } from './yahooData';

// Resolved Yahoo tickers that are futures or indices — Polygon free tier doesn't cover these
function isFuturesOrIndex(rawSymbol: string): boolean {
  const s = rawSymbol.toUpperCase();
  // Futures (ES=F, MNQ=F, GC=F, etc.) or indices (^GSPC) or dollar index
  if (s.endsWith('=F') || s.startsWith('^') || s.startsWith('DX-')) return true;
  // Common futures aliases before resolution
  const FUTURES_ALIASES = new Set([
    'MNQ','NQ','MES','ES','YM','MYM','RTY','M2K',
    'XAUUSD','GOLD','GC','XAGUSD','SILVER','SI',
    'CL','WTI','CRUDE','OIL','NG','HG',
    'ZN','ZB','SPX','NDX','DJI','RUT','VIX','DXY',
  ]);
  return FUTURES_ALIASES.has(s);
}

export async function fetchBars(params: FetchBarsParams) {
  const hasPolygon = !!process.env.POLYGON_API_KEY;

  // Route futures & indices to Yahoo always
  if (isFuturesOrIndex(params.symbol)) {
    return yahoo.fetchBars(params);
  }

  // For stocks/ETFs/crypto/forex: use Polygon if key is available, else Yahoo
  if (hasPolygon) {
    try {
      return await polygonFetchBars(params);
    } catch (err) {
      // Fall back to Yahoo on Polygon failure
      console.warn('Polygon fetch failed, falling back to Yahoo:', err);
      return yahoo.fetchBars(params);
    }
  }

  return yahoo.fetchBars(params);
}

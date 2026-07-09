// Databento historical data integration for CME futures (Globex).
//
// Added 2026-07-06: the app previously routed every futures/index symbol
// (MNQ, ES, GC, CL, etc. — exactly the instruments gated behind the Pro
// plan) through Yahoo Finance's unofficial endpoint, which is explicitly
// NOT licensed for commercial use (see .env.example). Databento is an
// officially licensed distributor for CME/CBOT/NYMEX/COMEX and permits
// redistributing most historical datasets to end users (typically after a
// 24-hour embargo — see https://databento.com/pricing), which is a much
// better legal fit for a paid product than the Yahoo fallback.
//
// IMPORTANT: this integration is written against Databento's documented
// HTTP API (https://databento.com/docs/api-reference-historical) but has
// NOT been tested against a live account/API key — I don't have a way to
// sign up for one or run this end-to-end myself. Before relying on this in
// production: set DATABENTO_API_KEY, run a real backtest on a futures
// symbol, and check the Vercel function logs for the raw Databento
// response if anything looks wrong. The CSV column parsing below reads the
// header row rather than assuming column order, which should make it
// resilient to minor response shape differences, but the schema names,
// symbol format, and auth scheme should be double-checked against current
// Databento docs since APIs do change.
//
// Coverage note: this only covers instruments that are actually
// exchange-traded futures on CME Globex. SPX, NDX, DJI, RUT, VIX, and DXY
// in this app's symbol list are CASH INDICES (not futures contracts) and
// are intentionally left on the Yahoo path for now — they'd need a
// separate licensed index-data source (e.g. from S&P Dow Jones Indices or
// Nasdaq directly), which is a follow-up, not something Databento solves.

import type { Bar } from '../backtest/types';
import type { Interval } from './yahooData';
import { DataFetchError } from './yahooData';

export interface FetchBarsParams {
  symbol: string;
  interval: Interval;
  startDate: string;
  endDate: string;
}

const HIST_BASE = 'https://hist.databento.com/v0';
const CME_DATASET = 'GLBX.MDP3';

// Front-month continuous contract symbols on CME Globex. Only true
// exchange-traded futures roots go here — see coverage note above.
const CME_CONTINUOUS_SYMBOL: Record<string, string> = {
  ES: 'ES.c.0', MES: 'MES.c.0',
  NQ: 'NQ.c.0', MNQ: 'MNQ.c.0',
  YM: 'YM.c.0', MYM: 'MYM.c.0',
  RTY: 'RTY.c.0', M2K: 'M2K.c.0',
  GC: 'GC.c.0', GOLD: 'GC.c.0', XAUUSD: 'GC.c.0',
  SI: 'SI.c.0', SILVER: 'SI.c.0', XAGUSD: 'SI.c.0',
  CL: 'CL.c.0', WTI: 'CL.c.0', CRUDE: 'CL.c.0', OIL: 'CL.c.0',
  NG: 'NG.c.0',
  HG: 'HG.c.0',
  ZN: 'ZN.c.0',
  ZB: 'ZB.c.0',
};

export function supportsSymbol(symbol: string): boolean {
  return symbol.toUpperCase() in CME_CONTINUOUS_SYMBOL;
}

// Databento's OHLCV schemas only come in 1s/1m/1h/1d — there's no native
// 5m/15m/30m schema, so those are built by resampling 1-minute bars.
function schemaForInterval(interval: Interval): { schema: string; resampleMinutes: number | null } {
  switch (interval) {
    case '1d': return { schema: 'ohlcv-1d', resampleMinutes: null };
    case '1h': return { schema: 'ohlcv-1h', resampleMinutes: null };
    case '30m': return { schema: 'ohlcv-1m', resampleMinutes: 30 };
    case '15m': return { schema: 'ohlcv-1m', resampleMinutes: 15 };
    case '5m': return { schema: 'ohlcv-1m', resampleMinutes: 5 };
    default: return { schema: 'ohlcv-1d', resampleMinutes: null };
  }
}

function resample(bars: Bar[], bucketMinutes: number): Bar[] {
  if (bars.length === 0) return bars;
  const bucketSeconds = bucketMinutes * 60;
  const out: Bar[] = [];
  let current: Bar | null = null;
  let bucketStart = -1;

  for (const bar of bars) {
    const start = Math.floor(bar.time / bucketSeconds) * bucketSeconds;
    if (start !== bucketStart) {
      if (current) out.push(current);
      bucketStart = start;
      current = { ...bar, time: start };
    } else if (current) {
      current.high = Math.max(current.high, bar.high);
      current.low = Math.min(current.low, bar.low);
      current.close = bar.close;
      current.volume += bar.volume;
    }
  }
  if (current) out.push(current);
  return out;
}

function parseCsv(text: string): Bar[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const tsIdx = idx('ts_event');
  const openIdx = idx('open');
  const highIdx = idx('high');
  const lowIdx = idx('low');
  const closeIdx = idx('close');
  const volIdx = idx('volume');

  if (tsIdx === -1 || openIdx === -1 || closeIdx === -1) {
    throw new DataFetchError(`Unexpected Databento CSV columns: ${header.join(', ')}`);
  }

  const bars: Bar[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = line.split(',');
    const time = Math.floor(new Date(cols[tsIdx]).getTime() / 1000);
    const open = parseFloat(cols[openIdx]);
    const high = parseFloat(cols[highIdx]);
    const low = parseFloat(cols[lowIdx]);
    const close = parseFloat(cols[closeIdx]);
    const volume = volIdx !== -1 ? parseFloat(cols[volIdx]) : 0;
    if (![open, high, low, close].every(Number.isFinite)) continue;
    bars.push({ time, open, high, low, close, volume: Number.isFinite(volume) ? volume : 0 });
  }
  return bars;
}

export async function fetchBars(params: FetchBarsParams): Promise<Bar[]> {
  const apiKey = process.env.DATABENTO_API_KEY;
  if (!apiKey) throw new DataFetchError('DATABENTO_API_KEY not set.');

  const symbolKey = params.symbol.toUpperCase();
  const databentoSymbol = CME_CONTINUOUS_SYMBOL[symbolKey];
  if (!databentoSymbol) {
    throw new DataFetchError(`"${params.symbol}" is not a CME futures root this integration recognizes.`);
  }

  const { schema, resampleMinutes } = schemaForInterval(params.interval);

  const url = new URL(`${HIST_BASE}/timeseries.get_range`);
  url.searchParams.set('dataset', CME_DATASET);
  url.searchParams.set('symbols', databentoSymbol);
  url.searchParams.set('stype_in', 'continuous');
  url.searchParams.set('schema', schema);
  url.searchParams.set('start', params.startDate);
  url.searchParams.set('end', params.endDate);
  url.searchParams.set('encoding', 'csv');
  url.searchParams.set('pretty_px', 'true');
  url.searchParams.set('pretty_ts', 'true');

  // Databento uses HTTP Basic auth with the API key as the username and an
  // empty password.
  const auth = Buffer.from(`${apiKey}:`).toString('base64');

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: { Authorization: `Basic ${auth}` },
    });
  } catch (err) {
    throw new DataFetchError(
      `Network error fetching "${params.symbol}" from Databento: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (res.status === 401 || res.status === 403) {
    throw new DataFetchError('Databento API key invalid, or this dataset/schema is not licensed for this account.');
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new DataFetchError(`Databento error ${res.status} for "${params.symbol}": ${body.slice(0, 300)}`);
  }

  const text = await res.text();
  let bars = parseCsv(text);

  if (bars.length === 0) {
    throw new DataFetchError(`No Databento data for "${params.symbol}" in this range.`);
  }

  if (resampleMinutes) {
    bars = resample(bars, resampleMinutes);
  }

  // Coverage check: Databento silently returns whatever data your account's
  // entitlement/dataset subscription actually includes, with no error if
  // that's less than what was requested (e.g. a lower-tier plan might only
  // include the last few months of GLBX.MDP3 history even if you ask for
  // years). Nothing above would catch that — res.ok is true and bars.length
  // is nonzero either way. Compare the earliest returned bar against the
  // requested start date and warn loudly if there's a real gap, so this
  // shows up in logs instead of silently looking like "3 years of data"
  // when it's actually much less. Tolerance is 5 days to allow for
  // weekends/holidays/exchange closures near the requested start.
  const requestedStart = new Date(params.startDate).getTime() / 1000;
  const earliestBar = bars[0].time;
  const gapDays = (earliestBar - requestedStart) / 86400;
  if (gapDays > 5) {
    console.warn(
      `[data] Databento coverage gap for "${params.symbol}": requested data from ` +
      `${params.startDate}, but the earliest bar returned is ${new Date(earliestBar * 1000).toISOString().slice(0, 10)} ` +
      `(~${Math.round(gapDays)} days short). This likely means the account's Databento ` +
      `plan/entitlement doesn't include history that far back for ${databentoSymbol}, not a bug ` +
      `in this integration. Check the dataset subscription at https://databento.com/platform/licensing.`
    );
  }

  return bars;
}

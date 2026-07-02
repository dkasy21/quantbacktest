import * as yahoo from './yahooData';
import * as twelvedata from './twelveDataData';
export type { Interval, FetchBarsParams } from './yahooData';
export { DataFetchError } from './yahooData';
const PROVIDER = process.env.DATA_PROVIDER === 'twelvedata' ? twelvedata : yahoo;
export const fetchBars = PROVIDER.fetchBars;

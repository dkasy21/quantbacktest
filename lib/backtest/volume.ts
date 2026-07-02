import { sma } from './indicators';
export function vwap(bars) {
  const out = new Array(bars.length).fill(null);
  let cumPV=0, cumV=0, lastDay=-1;
  for (let i=0; i<bars.length; i++) {
    const day = Math.floor(bars[i].time/86400);
    if (day !== lastDay) { cumPV=0; cumV=0; lastDay=day; }
    const tp = (bars[i].high+bars[i].low+bars[i].close)/3;
    cumPV += tp*bars[i].volume; cumV += bars[i].volume;
    out[i] = cumV>0 ? cumPV/cumV : null;
  }
  return out;
}
export function relativeVolume(bars, period=20) {
  const vols = bars.map(b => b.volume);
  const avg = sma(vols, period);
  return vols.map((v,i) => { const a=avg[i]; return a!==null && a>0 ? v/a : null; });
}
export function volumeSpike(bars, period=20, multiplier=2) {
  return relativeVolume(bars, period).map(v => v===null ? null : v>=multiplier);
}

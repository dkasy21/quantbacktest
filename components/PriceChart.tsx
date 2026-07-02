'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

export default function PriceChart({ bars, trades }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: '#11151f' }, textColor: '#9aa3b2' },
      grid: { vertLines: { color: '#1f2430' }, horzLines: { color: '#1f2430' } },
      width: ref.current.clientWidth, height: 400, timeScale: { timeVisible: true },
    });
    const candles = chart.addCandlestickSeries({ upColor: '#22c55e', downColor: '#ef4444', borderVisible: false, wickUpColor: '#22c55e', wickDownColor: '#ef4444' });
    candles.setData(bars.map(b => ({ time: b.time, open: b.open, high: b.high, low: b.low, close: b.close })));
    const markers = trades.flatMap(t => [
      { time: t.entryTime, position: t.direction==='long'?'belowBar':'aboveBar', color: t.direction==='long'?'#22c55e':'#ef4444', shape: t.direction==='long'?'arrowUp':'arrowDown', text: t.direction==='long'?'Buy':'Sell' },
      { time: t.exitTime, position: t.direction==='long'?'aboveBar':'belowBar', color: '#9aa3b2', shape: t.direction==='long'?'arrowDown':'arrowUp', text: `Exit (${t.exitReason})` }
    ]);
    candles.setMarkers(markers.sort((a,b) => a.time-b.time));
    chart.timeScale().fitContent();
    const onResize = () => { if (ref.current) chart.applyOptions({ width: ref.current.clientWidth }); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); chart.remove(); };
  }, [bars, trades]);
  return <div ref={ref} className="w-full" />;
}

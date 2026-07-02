'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

export default function EquityChart({ equityCurve }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: '#11151f' }, textColor: '#9aa3b2' },
      grid: { vertLines: { color: '#1f2430' }, horzLines: { color: '#1f2430' } },
      width: ref.current.clientWidth, height: 220, timeScale: { timeVisible: true },
    });
    const line = chart.addAreaSeries({ lineColor: '#6366f1', topColor: 'rgba(99,102,241,0.3)', bottomColor: 'rgba(99,102,241,0)' });
    line.setData(equityCurve.map(p => ({ time: p.time, value: p.equity })));
    chart.timeScale().fitContent();
    const onResize = () => { if (ref.current) chart.applyOptions({ width: ref.current.clientWidth }); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); chart.remove(); };
  }, [equityCurve]);
  return <div ref={ref} className="w-full" />;
}

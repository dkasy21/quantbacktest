'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, type IChartApi, type ISeriesApi, type Time } from 'lightweight-charts';
import type { Bar, Trade } from '@/lib/backtest/types';

export default function PriceChart({ bars, trades }: { bars: Bar[]; trades: Trade[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#11151f' }, textColor: '#9aa3b2' },
      grid: { vertLines: { color: '#1f2430' }, horzLines: { color: '#1f2430' } },
      width: containerRef.current.clientWidth,
      height: 400,
      timeScale: { timeVisible: true },
    });
    chartRef.current = chart;

    const candleSeries: ISeriesApi<'Candlestick'> = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    candleSeries.setData(
      bars.map((b) => ({
        time: b.time as Time,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }))
    );

    const markers = trades.flatMap((t) => [
      {
        time: t.entryTime as Time,
        position: (t.direction === 'long' ? 'belowBar' : 'aboveBar') as 'belowBar' | 'aboveBar',
        color: t.direction === 'long' ? '#22c55e' : '#ef4444',
        shape: (t.direction === 'long' ? 'arrowUp' : 'arrowDown') as 'arrowUp' | 'arrowDown',
        text: t.direction === 'long' ? 'Buy' : 'Sell',
      },
      {
        time: t.exitTime as Time,
        position: (t.direction === 'long' ? 'aboveBar' : 'belowBar') as 'aboveBar' | 'belowBar',
        color: '#9aa3b2',
        shape: (t.direction === 'long' ? 'arrowDown' : 'arrowUp') as 'arrowDown' | 'arrowUp',
        text: `Exit (${t.exitReason})`,
      },
    ]);
    candleSeries.setMarkers(markers.sort((a, b) => (a.time as number) - (b.time as number)));

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [bars, trades]);

  return <div ref={containerRef} className="w-full" />;
}

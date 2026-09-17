"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, SeriesMarker, UTCTimestamp, LineData } from 'lightweight-charts';
import { useTradingStore } from '@/store/useTradingStore';
import { BinanceWS } from '@/lib/binance-ws';
import { BinanceKline } from '@/app/api/market-data/route';
import { RiskResult } from '@/lib/risk-calculator';
import { SignalResult } from '@/lib/ta-engine';

export interface TradingChartHandle {
  applyAnalysis: (signal: SignalResult, risk: RiskResult) => void;
  getHistoricalData: () => BinanceKline[];
}

const TradingChart = forwardRef<TradingChartHandle, {}>((props, ref) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const slLineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const tpLineRef = useRef<ISeriesApi<"Line"> | null>(null);

  const { symbol, timeframe, setCurrentPrice } = useTradingStore();
  
  const [loading, setLoading] = useState(true);
  const [historicalData, setHistoricalData] = useState<BinanceKline[]>([]);

  useImperativeHandle(ref, () => ({
    applyAnalysis: (signal, risk) => {
      if (!seriesRef.current || !chartRef.current) return;
      
      const latestData = historicalData[historicalData.length - 1];
      if (!latestData) return;

      const time = latestData.time as UTCTimestamp;
      
      const marker: SeriesMarker<Time> = {
        time,
        position: signal.signal === 'BUY' ? 'belowBar' : 'aboveBar',
        color: signal.signal === 'BUY' ? '#26a69a' : '#ef5350',
        shape: signal.signal === 'BUY' ? 'arrowUp' : 'arrowDown',
        text: signal.signal,
      };

      seriesRef.current.setMarkers([marker]);

      // Remove existing lines if any
      if (slLineRef.current) chartRef.current.removeSeries(slLineRef.current);
      if (tpLineRef.current) chartRef.current.removeSeries(tpLineRef.current);

      // Add horizontal lines for SL and TP
      const slSeries = chartRef.current.addLineSeries({
        color: '#ef5350',
        lineWidth: 2,
        lineStyle: 2, // Dashed
        title: 'SL',
      });

      const tpSeries = chartRef.current.addLineSeries({
        color: '#26a69a',
        lineWidth: 2,
        lineStyle: 2,
        title: 'TP',
      });

      // To make them horizontal lines across the chart, we just add two points mapping to the visible range
      // Or we can use `createPriceLine` on the main series instead. `createPriceLine` is better for horizontal lines.
      
      // Let's use `createPriceLine` instead of new series.
      // Wait, we need to clear previous price lines.
      // We can store references to price lines.
    },
    getHistoricalData: () => historicalData
  }));

  // Better implementation for applying markers and price lines
  const priceLinesRef = useRef<any[]>([]);

  useImperativeHandle(ref, () => ({
    applyAnalysis: (signal, risk) => {
      if (!seriesRef.current) return;

      const latestData = historicalData[historicalData.length - 1];
      if (!latestData) return;

      const time = latestData.time as UTCTimestamp;

      const marker: SeriesMarker<Time> = {
        time,
        position: signal.signal === 'BUY' ? 'belowBar' : 'aboveBar',
        color: signal.signal === 'BUY' ? '#26a69a' : '#ef5350',
        shape: signal.signal === 'BUY' ? 'arrowUp' : 'arrowDown',
        text: signal.signal,
      };

      seriesRef.current.setMarkers([marker]);

      // Clear previous price lines
      priceLinesRef.current.forEach(line => seriesRef.current?.removePriceLine(line));
      priceLinesRef.current = [];

      // Add Stop Loss line
      const slLine = seriesRef.current.createPriceLine({
        price: risk.stopLoss,
        color: '#ef5350',
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: 'SL',
      });
      priceLinesRef.current.push(slLine);

      // Add Take Profit line
      const tpLine = seriesRef.current.createPriceLine({
        price: risk.takeProfit,
        color: '#26a69a',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'TP',
      });
      priceLinesRef.current.push(tpLine);
    },
    getHistoricalData: () => historicalData
  }));

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: {
        mode: 0,
      },
      timeScale: {
        borderColor: '#485c7b',
      },
      autoSize: true,
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    seriesRef.current = candlestickSeries;

    let ws: BinanceWS | null = null;
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/market-data?symbol=${symbol}&interval=${timeframe}`);
        if (!res.ok) throw new Error('Failed to fetch data');
        
        const data: BinanceKline[] = await res.json();
        
        if (!isMounted) return;

        setHistoricalData(data);
        candlestickSeries.setData(data as CandlestickData<Time>[]);
        setCurrentPrice(data[data.length - 1]?.close || null);

        // Initialize WebSocket
        ws = new BinanceWS(symbol, timeframe);
        ws.connect(
          (kline) => {
            candlestickSeries.update(kline as CandlestickData<Time>);
            setHistoricalData(prev => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (updated[lastIdx] && updated[lastIdx].time === kline.time) {
                updated[lastIdx] = kline;
              } else {
                updated.push(kline);
              }
              return updated;
            });
          },
          (price) => setCurrentPrice(price)
        );

      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (ws) {
        ws.disconnect();
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [symbol, timeframe, setCurrentPrice]);

  return (
    <div className="w-full h-[500px] relative rounded-md overflow-hidden border border-slate-800 bg-[#131722]">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#131722]/80">
          <span className="text-white text-sm font-medium">Loading Market Data...</span>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
});

TradingChart.displayName = 'TradingChart';
export default TradingChart;

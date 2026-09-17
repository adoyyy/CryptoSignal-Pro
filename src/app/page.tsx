"use client";

import React, { useRef, useState } from 'react';
import TradingChart, { TradingChartHandle } from '@/components/TradingChart';
import RiskPanel from '@/components/RiskPanel';
import { useTradingStore } from '@/store/useTradingStore';
import { analyzeMarketData, SignalResult, TAIndicatorResult } from '@/lib/ta-engine';
import { calculateRisk, RiskResult } from '@/lib/risk-calculator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Dashboard() {
  const chartRef = useRef<TradingChartHandle>(null);
  
  const { symbol, timeframe, setSymbol, setTimeframe, currentPrice } = useTradingStore();
  
  const [signalResult, setSignalResult] = useState<SignalResult | null>(null);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = (capital: number, riskPercentage: number) => {
    if (!chartRef.current) return;
    setIsAnalyzing(true);
    
    try {
      const historicalData = chartRef.current.getHistoricalData();
      
      if (historicalData.length < 200) {
        alert("Not enough historical data to analyze (Need at least 200 candles for EMA200).");
        return;
      }

      // 1. Calculate Signal
      const { results, latestSignal } = analyzeMarketData(historicalData);
      setSignalResult(latestSignal);

      const latestIndicators = results[results.length - 1];

      // 2. Calculate Risk
      if (latestSignal.signal !== 'NEUTRAL' && currentPrice && latestIndicators.atr14) {
        const risk = calculateRisk({
          entryPrice: currentPrice,
          atr: latestIndicators.atr14,
          signal: latestSignal.signal,
          capital,
          riskPercentage,
        });
        
        setRiskResult(risk);

        // 3. Apply to Chart
        chartRef.current.applyAnalysis(latestSignal, risk);
      } else {
        alert(`Analysis finished. Current signal is ${latestSignal.signal}.`);
        setRiskResult(null);
      }
    } catch (error) {
      console.error(error);
      alert("Error performing analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-teal-400">CryptoSignal Pro</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          <div className="lg:col-span-3 space-y-4">
            
            {/* Toolbar */}
            <div className="flex flex-wrap gap-4 items-center bg-slate-900 p-4 rounded-lg border border-slate-800">
              <div className="w-32">
                <Select value={symbol} onValueChange={setSymbol}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Symbol" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                    <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                    <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-32">
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Timeframe" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectItem value="15m">15m</SelectItem>
                    <SelectItem value="1h">1h</SelectItem>
                    <SelectItem value="4h">4h</SelectItem>
                    <SelectItem value="1d">1d</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="ml-auto flex gap-2">
                <Button 
                  onClick={() => handleAnalyze(10000, 1)} 
                  disabled={isAnalyzing}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
            </div>

            {/* Trading Chart */}
            <TradingChart ref={chartRef} />
            
          </div>
          
          {/* Risk Panel */}
          <div className="lg:col-span-1">
            <RiskPanel 
              onAnalyze={handleAnalyze} 
              signalResult={signalResult} 
              riskResult={riskResult} 
            />
          </div>

        </div>
      </div>
    </div>
  );
}

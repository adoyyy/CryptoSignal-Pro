"use client";

import React, { useRef, useState } from 'react';
import TradingChart, { TradingChartHandle } from '@/components/TradingChart';
import RiskPanel from '@/components/RiskPanel';
import { useTradingStore } from '@/store/useTradingStore';
import { analyzeMarketData, SignalResult, TAIndicatorResult } from '@/lib/ta-engine';
import { calculateRisk, RiskResult } from '@/lib/risk-calculator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Dashboard() {
  const chartRef = useRef<TradingChartHandle>(null);
  const { data: session } = useSession();
  
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
        
        <header className="flex justify-between items-center bg-slate-900 p-4 rounded-lg border border-slate-800">
          <h1 className="text-2xl font-bold text-teal-400">CryptoSignal Pro</h1>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <span className="text-slate-300 text-sm">{session.user?.email}</span>
                <Button variant="outline" onClick={() => signOut()} className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700">Logout</Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-slate-300 hover:text-white">Login</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white">Register</Button>
                </Link>
              </>
            )}
          </div>
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
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/watchlist', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ symbol })
                      });
                      if (res.ok) alert('Added to watchlist!');
                      else alert('Failed to add. Are you logged in?');
                    } catch (err) {
                      alert('Error adding to watchlist');
                    }
                  }}
                  variant="outline"
                  className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                >
                  ⭐ Watchlist
                </Button>
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
          
          {/* Right Column: Risk Panel & Watchlist */}
          <div className="lg:col-span-1 space-y-6">
            <RiskPanel 
              onAnalyze={handleAnalyze} 
              signalResult={signalResult} 
              riskResult={riskResult} 
            />

            {/* Watchlist Quick View */}
            {session && (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-slate-100 mb-4">My Watchlist</h3>
                <WatchlistComponent onSelect={setSymbol} />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function WatchlistComponent({ onSelect }: { onSelect: (symbol: string) => void }) {
  const [items, setItems] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/watchlist')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setItems(data);
      })
      .catch(console.error);
  }, []);

  return (
    <ul className="space-y-2">
      {items.length === 0 && <li className="text-sm text-slate-500">No symbols saved</li>}
      {items.map(item => (
        <li key={item.id}>
          <button 
            onClick={() => onSelect(item.symbol)}
            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-md transition-colors"
          >
            {item.symbol}
          </button>
        </li>
      ))}
    </ul>
  );
}

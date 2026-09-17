"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RiskResult } from '@/lib/risk-calculator';
import { SignalResult } from '@/lib/ta-engine';
import { useTradingStore } from '@/store/useTradingStore';

import { Button } from '@/components/ui/button';

interface RiskPanelProps {
  signalResult: SignalResult | null;
  riskResult: RiskResult | null;
}

const RiskPanel: React.FC<RiskPanelProps> = ({ signalResult, riskResult }) => {
  const [capital, setCapital] = useState<number>(10000);
  const [riskPercentage, setRiskPercentage] = useState<number>(1);
  const { currentPrice, symbol } = useTradingStore();

  return (
    <Card className="w-full bg-slate-900 border-slate-800 text-slate-100">
      <CardHeader>
        <CardTitle className="text-lg">Risk Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Account Balance (USD)</label>
            <Input 
              type="number" 
              value={capital}
              onChange={(e) => setCapital(parseFloat(e.target.value))}
              className="bg-slate-800 border-slate-700 focus-visible:ring-slate-600"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Risk Percentage (%)</label>
            <Input 
              type="number" 
              step="0.1"
              value={riskPercentage}
              onChange={(e) => setRiskPercentage(parseFloat(e.target.value))}
              className="bg-slate-800 border-slate-700 focus-visible:ring-slate-600"
            />
          </div>
        </div>

        {currentPrice && (
          <div className="pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Current Price:</span>
              <span className="font-medium">${currentPrice.toFixed(2)}</span>
            </div>
            
            {signalResult && signalResult.signal !== 'NEUTRAL' && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">Signal:</span>
                <span className={`font-bold ${signalResult.signal === 'BUY' ? 'text-teal-400' : 'text-red-400'}`}>
                  {signalResult.signal}
                </span>
              </div>
            )}
          </div>
        )}

        {riskResult && (
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Stop Loss:</span>
              <span className="font-medium text-red-400">${riskResult.stopLoss.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Take Profit:</span>
              <span className="font-medium text-teal-400">${riskResult.takeProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Position (Coins):</span>
              <span className="font-medium">{riskResult.positionSizeCoins.toFixed(4)} {symbol.replace('USDT', '')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Position (USD):</span>
              <span className="font-medium">${riskResult.positionSizeUSD.toFixed(2)}</span>
            </div>
            
            {signalResult && signalResult.signal !== 'NEUTRAL' && (
              <Button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/history', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        symbol,
                        signal: signalResult.signal,
                        entryPrice: currentPrice,
                        stopLoss: riskResult.stopLoss,
                        takeProfit: riskResult.takeProfit,
                      }),
                    });
                    if (res.ok) alert('Saved to journal!');
                    else alert('Failed to save. Are you logged in?');
                  } catch (error) {
                    console.error(error);
                    alert('Error saving to journal');
                  }
                }}
                className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-white"
                variant="outline"
              >
                💾 Save to Journal
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RiskPanel;

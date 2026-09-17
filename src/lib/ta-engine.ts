import { EMA, RSI, MACD, ATR } from 'technicalindicators';
import { BinanceKline } from '@/app/api/market-data/route';

export interface TAIndicatorResult {
  ema50: number | null;
  ema200: number | null;
  rsi14: number | null;
  macd: { MACD?: number; signal?: number; histogram?: number } | null;
  atr14: number | null;
}

export interface SignalResult {
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  indicators: TAIndicatorResult;
}

export function calculateTA(data: BinanceKline[]): TAIndicatorResult[] {
  const closes = data.map((d) => d.close);
  const highs = data.map((d) => d.high);
  const lows = data.map((d) => d.low);

  const ema50 = EMA.calculate({ period: 50, values: closes });
  const ema200 = EMA.calculate({ period: 200, values: closes });
  const rsi14 = RSI.calculate({ period: 14, values: closes });
  const macd = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  
  const atr14 = ATR.calculate({
    period: 14,
    high: highs,
    low: lows,
    close: closes,
  });

  // Since indicators have different periods, their result arrays are shorter than the input array.
  // technicalindicators returns arrays that align with the END of the input array.
  // So to map them back to the input, we pad the beginning with nulls.
  
  const padStart = <T,>(arr: T[], length: number, fillValue: T | null): (T | null)[] => {
    const padding = Array(length - arr.length).fill(fillValue);
    return [...padding, ...arr];
  };

  const paddedEma50 = padStart(ema50, data.length, null);
  const paddedEma200 = padStart(ema200, data.length, null);
  const paddedRsi14 = padStart(rsi14, data.length, null);
  const paddedMacd = padStart(macd, data.length, null);
  const paddedAtr14 = padStart(atr14, data.length, null);

  const results: TAIndicatorResult[] = data.map((_, i) => ({
    ema50: paddedEma50[i],
    ema200: paddedEma200[i],
    rsi14: paddedRsi14[i],
    macd: paddedMacd[i] || null,
    atr14: paddedAtr14[i],
  }));

  return results;
}

export function generateSignal(
  current: TAIndicatorResult,
  previous: TAIndicatorResult
): SignalResult {
  let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';

  if (
    current.ema50 !== null && current.ema200 !== null &&
    previous.ema50 !== null && previous.ema200 !== null &&
    current.rsi14 !== null &&
    current.macd !== null && current.macd.MACD !== undefined && current.macd.signal !== undefined
  ) {
    const ema50CrossesAbove200 = previous.ema50 <= previous.ema200 && current.ema50 > current.ema200;
    const ema50CrossesBelow200 = previous.ema50 >= previous.ema200 && current.ema50 < current.ema200;

    const isBuyRSI = current.rsi14 >= 40 && current.rsi14 <= 65;
    const isSellRSI = current.rsi14 >= 35 && current.rsi14 <= 60;

    const isBuyMACD = current.macd.MACD > current.macd.signal;
    const isSellMACD = current.macd.MACD < current.macd.signal;

    if (ema50CrossesAbove200 && isBuyRSI && isBuyMACD) {
      signal = 'BUY';
    } else if (ema50CrossesBelow200 && isSellRSI && isSellMACD) {
      signal = 'SELL';
    }
  }

  return { signal, indicators: current };
}

export function analyzeMarketData(data: BinanceKline[]): { results: TAIndicatorResult[], latestSignal: SignalResult } {
  if (data.length < 200) {
    throw new Error('Not enough data to calculate EMA(200)');
  }

  const results = calculateTA(data);
  const latest = results[results.length - 1];
  const previous = results[results.length - 2];

  const latestSignal = generateSignal(latest, previous);

  return { results, latestSignal };
}

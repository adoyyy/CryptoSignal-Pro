import { create } from 'zustand';

interface TradingState {
  symbol: string;
  timeframe: string;
  currentPrice: number | null;
  setSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: string) => void;
  setCurrentPrice: (price: number | null) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  symbol: 'BTCUSDT',
  timeframe: '1h',
  currentPrice: null,
  setSymbol: (symbol) => set({ symbol }),
  setTimeframe: (timeframe) => set({ timeframe }),
  setCurrentPrice: (price) => set({ currentPrice: price }),
}));

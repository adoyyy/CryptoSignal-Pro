export interface BinanceKlineWS {
  t: number; // Kline start time
  T: number; // Kline close time
  s: string; // Symbol
  i: string; // Interval
  f: number; // First trade ID
  L: number; // Last trade ID
  o: string; // Open price
  c: string; // Close price
  h: string; // High price
  l: string; // Low price
  v: string; // Base asset volume
  n: number; // Number of trades
  x: boolean; // Is this kline closed?
  q: string; // Quote asset volume
  V: string; // Taker buy base asset volume
  Q: string; // Taker buy quote asset volume
  B: string; // Ignore
}

export interface BinanceWSPayload {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  k: BinanceKlineWS;
}

export type KlineCallback = (kline: {
  time: number; // UTCTimestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}) => void;

export class BinanceWS {
  private ws: WebSocket | null = null;
  private symbol: string;
  private interval: string;
  private onKline: KlineCallback | null = null;
  private onPrice: ((price: number) => void) | null = null;

  constructor(symbol: string, interval: string) {
    this.symbol = symbol.toLowerCase();
    this.interval = interval;
  }

  public connect(onKline: KlineCallback, onPrice: (price: number) => void) {
    this.onKline = onKline;
    this.onPrice = onPrice;
    const url = `wss://stream.binance.com:9443/ws/${this.symbol}@kline_${this.interval}`;
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        const data: BinanceWSPayload = JSON.parse(event.data);
        if (data.e === 'kline' && data.k) {
          const k = data.k;
          
          const formatted = {
            time: Math.floor(k.t / 1000), // convert ms to seconds
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
          };

          if (this.onKline) {
            this.onKline(formatted);
          }
          if (this.onPrice) {
            this.onPrice(formatted.close);
          }
        }
      } catch (err) {
        console.error('Error parsing Binance WS message', err);
      }
    };

    this.ws.onerror = (error) => {
      console.error('Binance WebSocket Error:', error);
    };

    this.ws.onclose = () => {
      console.log('Binance WebSocket Closed');
    };
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.onKline = null;
    this.onPrice = null;
  }
}

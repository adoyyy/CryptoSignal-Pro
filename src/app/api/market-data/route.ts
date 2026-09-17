import { NextRequest, NextResponse } from 'next/server';

export interface BinanceKline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval') || '1d';
    const limit = searchParams.get('limit') || '500';

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;

    const response = await fetch(binanceUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Binance API Error:', errorText);
      return NextResponse.json(
        { error: `Binance API responded with status: ${response.status}` },
        { status: response.status }
      );
    }

    const data: any[][] = await response.json();

    // Map Binance response to Lightweight Charts format
    // Binance response format:
    // [
    //   [
    //     1499040000000,      // Kline open time
    //     "0.01634790",       // Open price
    //     "0.80000000",       // High price
    //     "0.01575800",       // Low price
    //     "0.01577100",       // Close price
    //     "148976.11427815",  // Volume
    //     ...
    //   ]
    // ]
    
    const formattedData: BinanceKline[] = data.map((kline) => ({
      // Lightweight charts expects time in seconds for daily/larger intervals, 
      // but for intraday it can take milliseconds or Unix timestamps.
      // A common approach is using Math.floor(time / 1000) for timestamps.
      // But according to lightweight-charts docs, for timestamps it expects time in seconds (Unix timestamp) or business day strings.
      time: Math.floor(kline[0] / 1000) as import('lightweight-charts').UTCTimestamp,
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }));

    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

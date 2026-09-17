export interface RiskParams {
  entryPrice: number;
  atr: number;
  signal: 'BUY' | 'SELL';
  capital: number;
  riskPercentage: number;
  riskRewardRatio?: number; // default to 1.5
}

export interface RiskResult {
  stopLoss: number;
  takeProfit: number;
  positionSizeUSD: number;
  positionSizeCoins: number;
}

export function calculateRisk(params: RiskParams): RiskResult {
  const { entryPrice, atr, signal, capital, riskPercentage, riskRewardRatio = 1.5 } = params;

  if (capital <= 0 || riskPercentage <= 0 || atr <= 0 || entryPrice <= 0) {
    throw new Error('Invalid input parameters for risk calculation.');
  }

  // Calculate Stop Loss distance
  const slDistance = atr * 1.5;
  const tpDistance = slDistance * riskRewardRatio;

  let stopLoss = 0;
  let takeProfit = 0;

  if (signal === 'BUY') {
    stopLoss = entryPrice - slDistance;
    takeProfit = entryPrice + tpDistance;
  } else if (signal === 'SELL') {
    stopLoss = entryPrice + slDistance;
    takeProfit = entryPrice - tpDistance;
  } else {
    throw new Error('Risk calculation requires a valid BUY or SELL signal.');
  }

  // Cap stop loss to not go below 0 for BUY (highly unlikely but structurally good)
  if (stopLoss < 0 && signal === 'BUY') stopLoss = 0;

  // Calculate Position Size
  // Amount willing to lose per trade
  const dollarRisk = capital * (riskPercentage / 100);

  // Position Size in Coins = Dollar Risk / Difference between Entry and SL
  const positionSizeCoins = dollarRisk / slDistance;
  
  // Position Size in USD = Position Size in Coins * Entry Price
  const positionSizeUSD = positionSizeCoins * entryPrice;

  return {
    stopLoss,
    takeProfit,
    positionSizeUSD,
    positionSizeCoins,
  };
}

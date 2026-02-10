
export interface Asset {
  symbol: string;
  name: string;
  balance: number;
  entryPrice: number;
  currentPrice: number;
  roi: number;
  netAlpha: number; // سود خالص پس از کسر کارمزد
  type: 'CRYPTO' | 'FIAT';
  isLegacy?: boolean; // آیا از قبل در کیف پول بوده؟
  shadowTP?: number; // حد سود مخفی
  deadZoneSL?: number; // حد ضرر در ناحیه مرده
}

export interface Trade {
  id: string;
  timestamp: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  amount: number;
  price: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  pnl?: number;
  strategy?: string;
}

export interface MarketAnalysis {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  reasoning: string;
  recommendedAction: string;
  netRoiEstimate: number;
  shadowTarget: number; // تارگت مخفی زیر دیوار فروش
  deadZoneSL: number; // استاپ‌لاس در ناحیه مرده
  isTrap: boolean;
  trapType?: string;
  institutionalFlow: 'ACCUMULATION' | 'DISTRIBUTION' | 'NEUTRAL';
}

export enum BotStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  EXECUTING = 'EXECUTING',
  ROTATING_CAPITAL = 'ROTATING_CAPITAL',
  EMERGENCY_STOP = 'EMERGENCY_STOP'
}

export interface BotConfig {
  apiKey: string;
  privateKey: string;
  riskPercentage: number;
  tradingMode: 'AGGRESSIVE' | 'CONSERVATIVE';
  baseCurrency: 'EUR';
}

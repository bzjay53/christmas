// Christmas Trading - 암호화폐 관련 타입 정의
// Frontend 구조에서 가져온 최신 타입 시스템 (이모지 제거됨)

// 암호화폐 데이터 타입
export interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  high24h?: number;
  low24h?: number;
  icon?: string;
}

// 바이낸스 API 응답 타입
export interface BinanceTickerResponse {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

// 차트 데이터 타입
export interface ChartDataPoint {
  time: string;
  price: number;
  volume: number;
  timestamp: number;
}

// 포트폴리오 타입
export interface Portfolio {
  totalValue: number;
  totalChange: number;
  totalChangePercent: number;
  holdings: Holding[];
}

export interface Holding {
  symbol: string;
  amount: number;
  value: number;
  change: number;
  changePercent: number;
}

// 거래 타입
export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  amount: number;
  price: number;
  total: number;
  timestamp: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

// AI 거래 설정 타입
export interface AITradingConfig {
  isEnabled: boolean;
  strategy: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
  maxRiskPerTrade: number;
  stopLoss: number;
  takeProfit: number;
  symbols: string[];
}

// 컴포넌트 Props 타입들
export interface CryptoCardProps {
  crypto: CryptoData;
  onClick?: () => void;
  className?: string;
}

export interface TradingButtonsProps {
  symbol: string;
  onBuy: () => void;
  onSell: () => void;
  disabled?: boolean;
}

// API 응답 래퍼 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// 차트 설정 타입
export interface ChartConfig {
  interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  type: 'candlestick' | 'line' | 'area';
  indicators: string[];
  theme: 'dark' | 'light';
}

export interface ChartProps {
  data: ChartDataPoint[];
  config: ChartConfig;
  height?: number;
  className?: string;
}

// 크리스마스 테마 관련 타입
export interface ChristmasTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  animations: {
    snow: boolean;
    glow: boolean;
    float: boolean;
  };
  sounds: {
    enabled: boolean;
    volume: number;
  };
}
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

// 알림 타입
export interface Notification {
  id: string;
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
}

// 사용자 설정 타입
export interface UserSettings {
  theme: 'DARK' | 'LIGHT' | 'CHRISTMAS';
  currency: 'USD' | 'KRW' | 'EUR';
  language: 'en' | 'ko';
  notifications: {
    priceAlerts: boolean;
    tradeUpdates: boolean;
    marketNews: boolean;
  };
  trading: {
    defaultAmount: number;
    confirmTrades: boolean;
    soundEffects: boolean;
  };
}

// 마켓 데이터 타입
export interface MarketData {
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  fearGreedIndex: number;
  trendingCoins: string[];
}

// 웹소켓 메시지 타입
export interface WebSocketMessage {
  type: 'PRICE_UPDATE' | 'TRADE_UPDATE' | 'ORDER_UPDATE';
  data: any;
  timestamp: number;
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

// 이벤트 타입
export interface AppEvent {
  type: string;
  payload: any;
  timestamp: number;
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

export interface ChartProps {
  data: ChartDataPoint[];
  config: ChartConfig;
  height?: number;
  className?: string;
}

export interface PortfolioSummaryProps {
  portfolio: Portfolio;
  className?: string;
}

// 유틸리티 타입들
export type SortOrder = 'asc' | 'desc';
export type SortField = 'price' | 'change' | 'volume' | 'marketCap';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

// 상태 관리 타입들
export interface AppState {
  cryptoData: CryptoData[];
  portfolio: Portfolio;
  trades: Trade[];
  notifications: Notification[];
  settings: UserSettings;
  aiTrading: AITradingConfig;
  isLoading: boolean;
  error: string | null;
}

export type AppAction = 
  | { type: 'SET_CRYPTO_DATA'; payload: CryptoData[] }
  | { type: 'UPDATE_PORTFOLIO'; payload: Portfolio }
  | { type: 'ADD_TRADE'; payload: Trade }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> };

// 유틸리티 함수용 타입
export type PriceFormatter = (price: number, currency?: string) => string;
export type PercentageFormatter = (percentage: number) => string;
export type DateFormatter = (timestamp: number) => string;
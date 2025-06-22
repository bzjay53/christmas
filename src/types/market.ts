// 📊 Market Data Types for Christmas Trading Dashboard

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  volume?: number;
}

export interface MarketIndex {
  name: 'KOSPI' | 'NASDAQ' | 'S&P500';
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  history: ChartDataPoint[];
  color: string; // Chart line color
}

export interface Stock {
  symbol: string;
  company: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  lastUpdate: string;
}

export interface VolumeData {
  timestamp: string;
  volume: number;
  price?: number;
}

export interface MarketSnapshot {
  indices: MarketIndex[];
  watchlist: Stock[];
  timestamp: string;
  isMarketOpen: boolean;
}

// Chart component prop types
export interface ChartProps {
  height?: number;
  width?: string;
  showGrid?: boolean;
  animated?: boolean;
  responsive?: boolean;
  theme?: 'dark' | 'light';
}

export interface MultiLineChartProps extends ChartProps {
  datasets: {
    name: string;
    data: ChartDataPoint[];
    color: string;
    strokeWidth?: number;
  }[];
  onDataPointClick?: (data: ChartDataPoint, datasetName: string) => void;
}

export interface SingleLineChartProps extends ChartProps {
  data: ChartDataPoint[];
  color?: string;
  fillArea?: boolean;
  strokeWidth?: number;
  onDataPointClick?: (data: ChartDataPoint) => void;
}

export interface BarChartProps extends ChartProps {
  data: VolumeData[];
  color?: string;
  onBarClick?: (data: VolumeData) => void;
}

// Real-time data types
export interface RealTimeConfig {
  updateInterval: number; // milliseconds
  enableAutoUpdate: boolean;
  maxDataPoints: number;
}

export interface MarketDataUpdate {
  type: 'index' | 'stock' | 'volume';
  symbol: string;
  data: ChartDataPoint | Stock | VolumeData;
  timestamp: string;
}

// Market status
export type MarketStatus = 'pre-market' | 'open' | 'after-hours' | 'closed';

export interface MarketSession {
  status: MarketStatus;
  openTime: string;
  closeTime: string;
  timezone: string;
  nextSessionStart?: string;
}

// Color theme for charts
export const CHART_COLORS = {
  KOSPI: '#10B981',      // Christmas Green
  NASDAQ: '#3B82F6',     // Blue
  'S&P500': '#F59E0B',   // Golden
  APPLE: '#10B981',      // Green for Apple stock
  VOLUME: '#6B7280',     // Gray for volume
  PROFIT: '#10B981',     // Green for profits
  LOSS: '#EF4444',       // Red for losses
  NEUTRAL: '#6B7280'     // Gray for neutral
} as const;

export type ChartColorKey = keyof typeof CHART_COLORS;

// Error types for chart components
export interface ChartError {
  message: string;
  code: string;
  timestamp: string;
  component: string;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface DataLoadingState {
  status: LoadingState;
  error?: ChartError;
  lastUpdate?: string;
}
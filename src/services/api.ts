// 🔌 Christmas Trading API Client
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005/api';

export interface MarketDataResponse {
  success: boolean;
  symbol: string;
  data: number[];
  timestamp: string;
  source: 'live' | 'fallback';
}

export interface HealthResponse {
  status: string;
  service: string;
  environment: string;
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
}

class ChristmasTradingAPI {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // 🏥 Health check
  async health(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  }

  // 📈 Market data endpoints
  async getKOSPIData(): Promise<MarketDataResponse> {
    try {
      const response = await fetch(`${this.baseURL}/market/kospi`);
      if (!response.ok) {
        throw new Error(`KOSPI data fetch failed: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.warn('Failed to fetch KOSPI data from API, using fallback:', error);
      // Fallback to static data
      return {
        success: true,
        symbol: 'KOSPI',
        data: [2580, 2595, 2610, 2625, 2640, 2655, 2670],
        timestamp: new Date().toISOString(),
        source: 'fallback'
      };
    }
  }

  async getNASDAQData(): Promise<MarketDataResponse> {
    try {
      const response = await fetch(`${this.baseURL}/market/nasdaq`);
      if (!response.ok) {
        throw new Error(`NASDAQ data fetch failed: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.warn('Failed to fetch NASDAQ data from API, using fallback:', error);
      return {
        success: true,
        symbol: 'NASDAQ',
        data: [17800, 17850, 17900, 17950, 18000, 18050, 18100],
        timestamp: new Date().toISOString(),
        source: 'fallback'
      };
    }
  }

  async getSP500Data(): Promise<MarketDataResponse> {
    try {
      const response = await fetch(`${this.baseURL}/market/sp500`);
      if (!response.ok) {
        throw new Error(`S&P500 data fetch failed: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.warn('Failed to fetch S&P500 data from API, using fallback:', error);
      return {
        success: true,
        symbol: 'S&P500',
        data: [5950, 5960, 5970, 5980, 5990, 6000, 6010],
        timestamp: new Date().toISOString(),
        source: 'fallback'
      };
    }
  }

  async getStockData(symbol: string): Promise<MarketDataResponse> {
    try {
      const response = await fetch(`${this.baseURL}/market/stock/${symbol}`);
      if (!response.ok) {
        throw new Error(`Stock data fetch failed: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.warn(`Failed to fetch ${symbol} data from API:`, error);
      throw error;
    }
  }

  // 🔐 Authentication endpoints (준비됨, 향후 구현)
  async verifyFirebaseToken(idToken: string) {
    const response = await fetch(`${this.baseURL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      throw new Error(`Token verification failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getUserProfile(authToken: string) {
    const response = await fetch(`${this.baseURL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Profile fetch failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// Singleton instance
export const christmasTradingAPI = new ChristmasTradingAPI();

// Convenience functions
export const getMarketData = {
  kospi: () => christmasTradingAPI.getKOSPIData(),
  nasdaq: () => christmasTradingAPI.getNASDAQData(),
  sp500: () => christmasTradingAPI.getSP500Data(),
  stock: (symbol: string) => christmasTradingAPI.getStockData(symbol),
};

export default christmasTradingAPI;
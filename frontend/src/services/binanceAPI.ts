import { CryptoData, BinanceTickerResponse, ChartDataPoint, ApiResponse } from '../types';

class BinanceAPI {
  private baseURL = 'https://api.binance.com/api/v3';
  private wsURL = 'wss://stream.binance.com:9443/ws';
  private wsConnection: WebSocket | null = null;

  // 단일 심볼 가격 조회
  async getTickerPrice(symbol: string): Promise<ApiResponse<{ symbol: string; price: string }>> {
    try {
      const response = await fetch(`${this.baseURL}/ticker/price?symbol=${symbol}`);
      const data = await response.json();
      
      return {
        success: true,
        data,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching ticker price:', error);
      return {
        success: false,
        error: 'Failed to fetch ticker price',
        timestamp: Date.now()
      };
    }
  }

  // 24시간 가격 변동 데이터
  async get24hrTicker(symbol: string): Promise<ApiResponse<BinanceTickerResponse>> {
    try {
      const response = await fetch(`${this.baseURL}/ticker/24hr?symbol=${symbol}`);
      const data = await response.json();
      
      return {
        success: true,
        data,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching 24hr ticker:', error);
      return {
        success: false,
        error: 'Failed to fetch 24hr ticker data',
        timestamp: Date.now()
      };
    }
  }

  // 여러 심볼 24시간 데이터
  async getMultiple24hrTickers(symbols: string[]): Promise<ApiResponse<BinanceTickerResponse[]>> {
    try {
      const symbolsParam = symbols.map(s => `"${s}"`).join(',');
      const response = await fetch(`${this.baseURL}/ticker/24hr?symbols=[${symbolsParam}]`);
      const data = await response.json();
      
      return {
        success: true,
        data,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching multiple tickers:', error);
      return {
        success: false,
        error: 'Failed to fetch multiple ticker data',
        timestamp: Date.now()
      };
    }
  }

  // K선 데이터 (차트용)
  async getKlines(
    symbol: string, 
    interval: string = '1h', 
    limit: number = 100
  ): Promise<ApiResponse<ChartDataPoint[]>> {
    try {
      const response = await fetch(
        `${this.baseURL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      const data = await response.json();
      
      const chartData: ChartDataPoint[] = data.map((kline: any[]) => ({
        time: new Date(kline[0]).toISOString(),
        price: parseFloat(kline[4]), // 종가
        volume: parseFloat(kline[5]),
        timestamp: kline[0]
      }));
      
      return {
        success: true,
        data: chartData,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching klines:', error);
      return {
        success: false,
        error: 'Failed to fetch chart data',
        timestamp: Date.now()
      };
    }
  }

  // 인기 암호화폐 목록
  async getTopCryptos(limit: number = 10): Promise<ApiResponse<CryptoData[]>> {
    try {
      const response = await fetch(`${this.baseURL}/ticker/24hr`);
      const data = await response.json();
      
      // 거래량 기준으로 정렬하고 상위 항목만 선택
      const topCryptos = data
        .filter((ticker: BinanceTickerResponse) => ticker.symbol.endsWith('USDT'))
        .sort((a: BinanceTickerResponse, b: BinanceTickerResponse) => 
          parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume)
        )
        .slice(0, limit)
        .map((ticker: BinanceTickerResponse) => this.transformToCryptoData(ticker));
      
      return {
        success: true,
        data: topCryptos,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching top cryptos:', error);
      return {
        success: false,
        error: 'Failed to fetch top cryptocurrencies',
        timestamp: Date.now()
      };
    }
  }

  // WebSocket 연결 시작
  startWebSocket(symbols: string[], onMessage: (data: any) => void): void {
    if (this.wsConnection) {
      this.wsConnection.close();
    }

    const streams = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`).join('/');
    const wsUrl = `${this.wsURL}/${streams}`;

    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.wsConnection.onclose = () => {
      console.log('WebSocket connection closed');
      // 5초 후 재연결 시도
      setTimeout(() => {
        this.startWebSocket(symbols, onMessage);
      }, 5000);
    };
  }

  // WebSocket 연결 종료
  stopWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  // 바이낸스 데이터를 CryptoData 형태로 변환
  private transformToCryptoData(ticker: BinanceTickerResponse): CryptoData {
    const baseCurrency = ticker.symbol.replace('USDT', '');
    
    return {
      symbol: ticker.symbol,
      name: this.getCryptoName(baseCurrency),
      price: parseFloat(ticker.lastPrice),
      change: parseFloat(ticker.priceChange),
      changePercent: parseFloat(ticker.priceChangePercent),
      volume: parseFloat(ticker.volume),
      high24h: parseFloat(ticker.highPrice),
      low24h: parseFloat(ticker.lowPrice),
      icon: this.getCryptoIcon(baseCurrency)
    };
  }

  // 암호화폐 이름 매핑
  private getCryptoName(symbol: string): string {
    const nameMap: { [key: string]: string } = {
      'BTC': '🎄 Bitcoin',
      'ETH': '❄️ Ethereum',
      'BNB': '⭐ Binance Coin',
      'ADA': '🎁 Cardano',
      'SOL': '🔔 Solana',
      'DOT': '🎅 Polkadot',
      'AVAX': '⛄ Avalanche',
      'MATIC': '🦌 Polygon',
      'LINK': '🎊 Chainlink',
      'UNI': '🍪 Uniswap'
    };
    
    return nameMap[symbol] || `🪙 ${symbol}`;
  }

  // 암호화폐 아이콘 매핑
  private getCryptoIcon(symbol: string): string {
    const iconMap: { [key: string]: string } = {
      'BTC': '🎄',
      'ETH': '❄️',
      'BNB': '⭐',
      'ADA': '🎁',
      'SOL': '🔔',
      'DOT': '🎅',
      'AVAX': '⛄',
      'MATIC': '🦌',
      'LINK': '🎊',
      'UNI': '🍪'
    };
    
    return iconMap[symbol] || '🪙';
  }

  // 시장 요약 정보
  async getMarketSummary(): Promise<ApiResponse<any>> {
    try {
      const [btcResponse, ethResponse, statsResponse] = await Promise.all([
        this.get24hrTicker('BTCUSDT'),
        this.get24hrTicker('ETHUSDT'),
        fetch(`${this.baseURL}/ticker/24hr`)
      ]);

      const allStats = await statsResponse.json();
      const totalVolume = allStats.reduce((sum: number, ticker: any) => 
        sum + parseFloat(ticker.quoteVolume || 0), 0
      );

      return {
        success: true,
        data: {
          btc: btcResponse.data,
          eth: ethResponse.data,
          totalVolume,
          activeSymbols: allStats.length
        },
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching market summary:', error);
      return {
        success: false,
        error: 'Failed to fetch market summary',
        timestamp: Date.now()
      };
    }
  }

  // 가격 알림을 위한 가격 변화 감지
  detectPriceChanges(
    oldPrices: { [symbol: string]: number },
    newPrices: { [symbol: string]: number },
    threshold: number = 5 // 5% 변화 기준
  ): { symbol: string; oldPrice: number; newPrice: number; changePercent: number }[] {
    const changes: any[] = [];

    Object.keys(newPrices).forEach(symbol => {
      if (oldPrices[symbol]) {
        const changePercent = ((newPrices[symbol] - oldPrices[symbol]) / oldPrices[symbol]) * 100;
        
        if (Math.abs(changePercent) >= threshold) {
          changes.push({
            symbol,
            oldPrice: oldPrices[symbol],
            newPrice: newPrices[symbol],
            changePercent
          });
        }
      }
    });

    return changes;
  }

  // 에러 처리 유틸리티
  private handleAPIError(error: any, context: string): ApiResponse<null> {
    let errorMessage = 'Unknown error occurred';
    
    if (error.code === 'NETWORK_ERROR') {
      errorMessage = 'Network connection failed';
    } else if (error.status === 429) {
      errorMessage = 'API rate limit exceeded';
    } else if (error.status === 403) {
      errorMessage = 'API access forbidden';
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error(`${context}:`, error);
    
    return {
      success: false,
      error: errorMessage,
      timestamp: Date.now()
    };
  }
}

// 싱글톤 인스턴스 내보내기
export const binanceAPI = new BinanceAPI();
export default BinanceAPI;
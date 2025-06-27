// 바이낸스 API 클라이언트 - Christmas Trading 프로젝트
// 생성일: 2025-06-27 UTC
// 용도: 한국투자증권 API → 바이낸스 API 전환

import crypto from 'crypto';

// 환경 변수 타입 확장
declare global {
  interface ImportMetaEnv {
    VITE_BINANCE_API_KEY: string;
    VITE_BINANCE_SECRET_KEY: string;
    VITE_BINANCE_TESTNET: string;
    VITE_BINANCE_BASE_URL: string;
    VITE_BINANCE_TESTNET_URL: string;
  }
}

// 암호화폐 데이터 타입 정의
export interface CryptoPrice {
  symbol: string;
  price: number;
  timestamp: number;
}

export interface Ticker24hr {
  symbol: string;
  priceChange: number;
  priceChangePercent: number;
  weightedAvgPrice: number;
  prevClosePrice: number;
  lastPrice: number;
  volume: number;
  quoteVolume: number;
  openTime: number;
  closeTime: number;
  count: number;
}

export interface KlineData {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  quoteAssetVolume: number;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: number;
  takerBuyQuoteAssetVolume: number;
}

export interface AccountBalance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

export interface SpotOrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT' | 'TAKE_PROFIT_LIMIT';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

export interface OrderResult {
  orderId: number;
  symbol: string;
  status: string;
  executedQty: number;
  cummulativeQuoteQty: number;
  fills: Array<{
    price: number;
    qty: number;
    commission: number;
    commissionAsset: string;
  }>;
  transactTime: number;
}

export interface OrderStatus {
  orderId: number;
  symbol: string;
  status: string;
  side: string;
  type: string;
  origQty: number;
  executedQty: number;
  cummulativeQuoteQty: number;
  price: number;
  stopPrice: number;
  time: number;
  updateTime: number;
}

// 에러 클래스 정의
export class BinanceAPIError extends Error {
  public code: number;
  public body?: any;

  constructor(code: number, message: string, body?: any) {
    super(message);
    this.name = 'BinanceAPIError';
    this.code = code;
    this.body = body;
  }
}

// Rate Limiting 클래스
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 1200; // 분당 1200 요청
  private readonly timeWindow = 60000; // 1분

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      console.warn(`Rate limit 대기 중: ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}

// 메인 바이낸스 API 클래스
export class BinanceAPI {
  private apiKey: string;
  private secretKey: string;
  private baseURL: string;
  private rateLimiter: RateLimiter;

  constructor() {
    // 환경 변수 검증
    if (!import.meta.env.VITE_BINANCE_API_KEY) {
      throw new Error('VITE_BINANCE_API_KEY 환경 변수가 설정되지 않았습니다.');
    }
    if (!import.meta.env.VITE_BINANCE_SECRET_KEY) {
      throw new Error('VITE_BINANCE_SECRET_KEY 환경 변수가 설정되지 않았습니다.');
    }

    this.apiKey = import.meta.env.VITE_BINANCE_API_KEY;
    this.secretKey = import.meta.env.VITE_BINANCE_SECRET_KEY;
    this.baseURL = import.meta.env.VITE_BINANCE_TESTNET === 'true' 
      ? import.meta.env.VITE_BINANCE_TESTNET_URL || 'https://testnet.binance.vision'
      : import.meta.env.VITE_BINANCE_BASE_URL || 'https://api.binance.com';
    
    this.rateLimiter = new RateLimiter();

    console.log(`바이낸스 API 초기화 완료: ${this.baseURL}`);
    console.log(`테스트넷 모드: ${import.meta.env.VITE_BINANCE_TESTNET === 'true'}`);
  }

  // HMAC SHA256 서명 생성
  private createSignature(queryString: string): string {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(queryString)
      .digest('hex');
  }

  // 인증이 필요한 요청을 위한 헤더 생성
  private createAuthHeaders(): HeadersInit {
    return {
      'X-MBX-APIKEY': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  // API 응답 처리 (에러 처리 포함)
  private async handleAPIResponse(response: Response): Promise<any> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new BinanceAPIError(
        data.code || response.status,
        data.msg || response.statusText,
        data
      );
    }
    
    return data;
  }

  // Public API Methods (인증 불필요)

  // 1. 현재가 조회
  async getTickerPrice(symbol: string): Promise<CryptoPrice> {
    await this.rateLimiter.waitIfNeeded();
    
    try {
      const response = await fetch(`${this.baseURL}/api/v3/ticker/price?symbol=${symbol}`);
      const data = await this.handleAPIResponse(response);
      
      return {
        symbol: data.symbol,
        price: parseFloat(data.price),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`가격 조회 실패 (${symbol}):`, error);
      throw error;
    }
  }

  // 2. 24시간 시세 통계
  async getTicker24hr(symbol: string): Promise<Ticker24hr> {
    await this.rateLimiter.waitIfNeeded();
    
    try {
      const response = await fetch(`${this.baseURL}/api/v3/ticker/24hr?symbol=${symbol}`);
      const data = await this.handleAPIResponse(response);
      
      return {
        symbol: data.symbol,
        priceChange: parseFloat(data.priceChange),
        priceChangePercent: parseFloat(data.priceChangePercent),
        weightedAvgPrice: parseFloat(data.weightedAvgPrice),
        prevClosePrice: parseFloat(data.prevClosePrice),
        lastPrice: parseFloat(data.lastPrice),
        volume: parseFloat(data.volume),
        quoteVolume: parseFloat(data.quoteVolume),
        openTime: parseInt(data.openTime),
        closeTime: parseInt(data.closeTime),
        count: parseInt(data.count)
      };
    } catch (error) {
      console.error(`24시간 시세 조회 실패 (${symbol}):`, error);
      throw error;
    }
  }

  // 3. K선 데이터 (차트용)
  async getKlineData(symbol: string, interval: string, limit: number = 100): Promise<KlineData[]> {
    await this.rateLimiter.waitIfNeeded();
    
    try {
      const response = await fetch(
        `${this.baseURL}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      const data = await this.handleAPIResponse(response);
      
      return data.map((kline: any[]) => ({
        openTime: parseInt(kline[0]),
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        closeTime: parseInt(kline[6]),
        quoteAssetVolume: parseFloat(kline[7]),
        numberOfTrades: parseInt(kline[8]),
        takerBuyBaseAssetVolume: parseFloat(kline[9]),
        takerBuyQuoteAssetVolume: parseFloat(kline[10])
      }));
    } catch (error) {
      console.error(`K선 데이터 조회 실패 (${symbol}):`, error);
      throw error;
    }
  }

  // 4. 여러 심볼 현재가 조회
  async getMultipleTickerPrices(symbols: string[]): Promise<CryptoPrice[]> {
    await this.rateLimiter.waitIfNeeded();
    
    try {
      const symbolsParam = JSON.stringify(symbols);
      const response = await fetch(`${this.baseURL}/api/v3/ticker/price?symbols=${encodeURIComponent(symbolsParam)}`);
      const data = await this.handleAPIResponse(response);
      
      return data.map((item: any) => ({
        symbol: item.symbol,
        price: parseFloat(item.price),
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error(`다중 가격 조회 실패:`, error);
      throw error;
    }
  }

  // Private API Methods (인증 필요)

  // 5. 계좌 정보 조회
  async getAccountInfo(): Promise<{ balances: AccountBalance[] }> {
    await this.rateLimiter.waitIfNeeded();
    
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = this.createSignature(queryString);
    
    try {
      const response = await fetch(
        `${this.baseURL}/api/v3/account?${queryString}&signature=${signature}`,
        {
          headers: this.createAuthHeaders()
        }
      );
      
      const data = await this.handleAPIResponse(response);
      
      const balances = data.balances
        .filter((balance: any) => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
        .map((balance: any) => ({
          asset: balance.asset,
          free: parseFloat(balance.free),
          locked: parseFloat(balance.locked),
          total: parseFloat(balance.free) + parseFloat(balance.locked)
        }));

      return { balances };
    } catch (error) {
      console.error('계좌 정보 조회 실패:', error);
      throw error;
    }
  }

  // 6. 현물 주문 생성
  async createSpotOrder(orderRequest: SpotOrderRequest): Promise<OrderResult> {
    await this.rateLimiter.waitIfNeeded();
    
    const timestamp = Date.now();
    const params: any = {
      symbol: orderRequest.symbol,
      side: orderRequest.side,
      type: orderRequest.type,
      quantity: orderRequest.quantity.toString(),
      timestamp: timestamp.toString()
    };

    // 선택적 파라미터 추가
    if (orderRequest.price) {
      params.price = orderRequest.price.toString();
    }
    if (orderRequest.stopPrice) {
      params.stopPrice = orderRequest.stopPrice.toString();
    }
    if (orderRequest.timeInForce) {
      params.timeInForce = orderRequest.timeInForce;
    }

    const queryString = new URLSearchParams(params).toString();
    const signature = this.createSignature(queryString);
    
    try {
      const response = await fetch(
        `${this.baseURL}/api/v3/order?${queryString}&signature=${signature}`,
        {
          method: 'POST',
          headers: this.createAuthHeaders()
        }
      );
      
      const data = await this.handleAPIResponse(response);
      
      return {
        orderId: data.orderId,
        symbol: data.symbol,
        status: data.status,
        executedQty: parseFloat(data.executedQty),
        cummulativeQuoteQty: parseFloat(data.cummulativeQuoteQty),
        fills: data.fills?.map((fill: any) => ({
          price: parseFloat(fill.price),
          qty: parseFloat(fill.qty),
          commission: parseFloat(fill.commission),
          commissionAsset: fill.commissionAsset
        })) || [],
        transactTime: data.transactTime
      };
    } catch (error) {
      console.error('주문 생성 실패:', error);
      throw error;
    }
  }

  // 7. 주문 상태 조회
  async getOrderStatus(symbol: string, orderId: number): Promise<OrderStatus> {
    await this.rateLimiter.waitIfNeeded();
    
    const timestamp = Date.now();
    const queryString = `symbol=${symbol}&orderId=${orderId}&timestamp=${timestamp}`;
    const signature = this.createSignature(queryString);
    
    try {
      const response = await fetch(
        `${this.baseURL}/api/v3/order?${queryString}&signature=${signature}`,
        {
          headers: this.createAuthHeaders()
        }
      );
      
      const data = await this.handleAPIResponse(response);
      
      return {
        orderId: data.orderId,
        symbol: data.symbol,
        status: data.status,
        side: data.side,
        type: data.type,
        origQty: parseFloat(data.origQty),
        executedQty: parseFloat(data.executedQty),
        cummulativeQuoteQty: parseFloat(data.cummulativeQuoteQty),
        price: parseFloat(data.price),
        stopPrice: parseFloat(data.stopPrice || '0'),
        time: data.time,
        updateTime: data.updateTime
      };
    } catch (error) {
      console.error('주문 상태 조회 실패:', error);
      throw error;
    }
  }

  // 8. 주문 취소
  async cancelOrder(symbol: string, orderId: number): Promise<any> {
    await this.rateLimiter.waitIfNeeded();
    
    const timestamp = Date.now();
    const queryString = `symbol=${symbol}&orderId=${orderId}&timestamp=${timestamp}`;
    const signature = this.createSignature(queryString);
    
    try {
      const response = await fetch(
        `${this.baseURL}/api/v3/order?${queryString}&signature=${signature}`,
        {
          method: 'DELETE',
          headers: this.createAuthHeaders()
        }
      );
      
      return await this.handleAPIResponse(response);
    } catch (error) {
      console.error('주문 취소 실패:', error);
      throw error;
    }
  }

  // 9. 활성 주문 목록 조회
  async getOpenOrders(symbol?: string): Promise<OrderStatus[]> {
    await this.rateLimiter.waitIfNeeded();
    
    const timestamp = Date.now();
    const params: any = { timestamp: timestamp.toString() };
    if (symbol) {
      params.symbol = symbol;
    }
    
    const queryString = new URLSearchParams(params).toString();
    const signature = this.createSignature(queryString);
    
    try {
      const response = await fetch(
        `${this.baseURL}/api/v3/openOrders?${queryString}&signature=${signature}`,
        {
          headers: this.createAuthHeaders()
        }
      );
      
      const data = await this.handleAPIResponse(response);
      
      return data.map((order: any) => ({
        orderId: order.orderId,
        symbol: order.symbol,
        status: order.status,
        side: order.side,
        type: order.type,
        origQty: parseFloat(order.origQty),
        executedQty: parseFloat(order.executedQty),
        cummulativeQuoteQty: parseFloat(order.cummulativeQuoteQty),
        price: parseFloat(order.price),
        stopPrice: parseFloat(order.stopPrice || '0'),
        time: order.time,
        updateTime: order.updateTime
      }));
    } catch (error) {
      console.error('활성 주문 조회 실패:', error);
      throw error;
    }
  }

  // 유틸리티 메서드들

  // 연결 테스트
  async testConnectivity(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/v3/ping`);
      return response.ok;
    } catch (error) {
      console.error('연결 테스트 실패:', error);
      return false;
    }
  }

  // 서버 시간 조회
  async getServerTime(): Promise<number> {
    try {
      const response = await fetch(`${this.baseURL}/api/v3/time`);
      const data = await this.handleAPIResponse(response);
      return data.serverTime;
    } catch (error) {
      console.error('서버 시간 조회 실패:', error);
      throw error;
    }
  }

  // 거래소 정보 조회
  async getExchangeInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/v3/exchangeInfo`);
      return await this.handleAPIResponse(response);
    } catch (error) {
      console.error('거래소 정보 조회 실패:', error);
      throw error;
    }
  }
}

// WebSocket 클래스 (실시간 데이터용)
export class BinanceWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly wsBaseURL = 'wss://stream.binance.com:9443';

  // 실시간 가격 스트리밍
  connectPriceStream(symbols: string[], callback: (data: any) => void): void {
    const streams = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`).join('/');
    const wsUrl = `${this.wsBaseURL}/ws/${streams}`;
    
    console.log(`WebSocket 연결 시도: ${wsUrl}`);
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('바이낸스 WebSocket 연결 성공');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error('WebSocket 메시지 파싱 오류:', error);
      }
    };
    
    this.ws.onclose = (event) => {
      console.log(`바이낸스 WebSocket 연결 종료: ${event.code} ${event.reason}`);
      this.handleReconnect(symbols, callback);
    };
    
    this.ws.onerror = (error) => {
      console.error('바이낸스 WebSocket 오류:', error);
    };
  }

  // K선 데이터 스트리밍
  connectKlineStream(symbol: string, interval: string, callback: (data: any) => void): void {
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    const wsUrl = `${this.wsBaseURL}/ws/${stream}`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log(`K선 스트림 연결 성공: ${symbol} ${interval}`);
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error('K선 스트림 메시지 파싱 오류:', error);
      }
    };
    
    this.ws.onclose = () => {
      console.log('K선 스트림 연결 종료');
    };
    
    this.ws.onerror = (error) => {
      console.error('K선 스트림 오류:', error);
    };
  }

  // 재연결 처리
  private handleReconnect(symbols: string[], callback: (data: any) => void): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = 5000 * this.reconnectAttempts; // 점진적 지연
      
      console.log(`재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts} (${delay}ms 후)`);
      
      setTimeout(() => {
        this.connectPriceStream(symbols, callback);
      }, delay);
    } else {
      console.error('최대 재연결 시도 횟수 초과. WebSocket 연결 포기.');
    }
  }

  // 연결 종료
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      console.log('WebSocket 연결 수동 종료');
    }
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// 기본 인스턴스 생성 및 내보내기
let binanceAPI: BinanceAPI | null = null;
let binanceWebSocket: BinanceWebSocket | null = null;

export const getBinanceAPI = (): BinanceAPI => {
  if (!binanceAPI) {
    binanceAPI = new BinanceAPI();
  }
  return binanceAPI;
};

export const getBinanceWebSocket = (): BinanceWebSocket => {
  if (!binanceWebSocket) {
    binanceWebSocket = new BinanceWebSocket();
  }
  return binanceWebSocket;
};

// 개발/테스트용 헬퍼 함수들
export const BinanceUtils = {
  // 주요 암호화폐 거래 쌍 목록
  MAJOR_SYMBOLS: [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 
    'SOLUSDT', 'XRPUSDT', 'DOTUSDT', 'AVAXUSDT'
  ],

  // 가격 포맷팅
  formatPrice: (price: number, symbol: string): string => {
    if (symbol.includes('BTC') && !symbol.endsWith('USDT')) {
      return price.toFixed(8); // BTC 페어는 8자리
    } else if (price < 1) {
      return price.toFixed(6); // 소액 코인은 6자리
    } else if (price < 100) {
      return price.toFixed(4); // 중간 가격은 4자리
    } else {
      return price.toFixed(2); // 고가 코인은 2자리
    }
  },

  // 수량 포맷팅
  formatQuantity: (quantity: number, symbol: string): string => {
    if (symbol.startsWith('BTC')) {
      return quantity.toFixed(8);
    } else if (symbol.startsWith('ETH')) {
      return quantity.toFixed(6);
    } else {
      return quantity.toFixed(4);
    }
  },

  // 거래 쌍에서 기본 자산 추출
  getBaseAsset: (symbol: string): string => {
    if (symbol.endsWith('USDT')) {
      return symbol.replace('USDT', '');
    } else if (symbol.endsWith('BTC')) {
      return symbol.replace('BTC', '');
    } else if (symbol.endsWith('ETH')) {
      return symbol.replace('ETH', '');
    }
    return symbol;
  },

  // 거래 쌍에서 기준 자산 추출
  getQuoteAsset: (symbol: string): string => {
    if (symbol.endsWith('USDT')) {
      return 'USDT';
    } else if (symbol.endsWith('BTC')) {
      return 'BTC';
    } else if (symbol.endsWith('ETH')) {
      return 'ETH';
    }
    return 'USDT';
  }
};

export default BinanceAPI;
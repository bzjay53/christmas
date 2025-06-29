// User-Specific Binance API Client - Christmas Trading
// 사용자별 Binance API 키를 사용하는 거래 클라이언트

import crypto from 'crypto';
import { getUserApiKeys } from './apiKeyService';

// User-specific Binance API error
export class UserBinanceAPIError extends Error {
  public code: number;
  public body?: any;

  constructor(code: number, message: string, body?: any) {
    super(message);
    this.name = 'UserBinanceAPIError';
    this.code = code;
    this.body = body;
  }
}

// User-specific order interfaces
export interface UserSpotOrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity: number;
  price?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

export interface UserOrderResult {
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
  clientOrderId: string;
}

export interface UserAccountInfo {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  balances: Array<{
    asset: string;
    free: string;
    locked: string;
  }>;
}

// 사용자별 Binance API 클라이언트
export class UserBinanceAPI {
  private userId: string;
  private apiKey?: string;
  private secretKey?: string;
  private baseURL: string;
  private isTestnet: boolean;

  constructor(userId: string) {
    this.userId = userId;
    this.isTestnet = import.meta.env.VITE_BINANCE_TESTNET === 'true';
    this.baseURL = this.isTestnet 
      ? (import.meta.env.VITE_BINANCE_TESTNET_URL || 'https://testnet.binance.vision')
      : (import.meta.env.VITE_BINANCE_BASE_URL || 'https://api.binance.com');
  }

  // 사용자 API 키 초기화
  async initializeApiKeys(): Promise<{ success: boolean; error?: string }> {
    try {
      const { apiKey, secretKey, error } = await getUserApiKeys(this.userId);
      
      if (error || !apiKey || !secretKey) {
        return { 
          success: false, 
          error: error || 'API 키가 설정되지 않았습니다. 설정 페이지에서 Binance API 키를 등록해주세요.' 
        };
      }

      this.apiKey = apiKey;
      this.secretKey = secretKey;

      console.log(`✅ 사용자 ${this.userId}의 Binance API 키 초기화 완료`);
      return { success: true };

    } catch (error) {
      console.error('API 키 초기화 실패:', error);
      return { 
        success: false, 
        error: 'API 키 초기화에 실패했습니다.' 
      };
    }
  }

  // HMAC SHA256 서명 생성
  private createSignature(queryString: string): string {
    if (!this.secretKey) {
      throw new UserBinanceAPIError(400, 'Secret key not initialized');
    }
    return crypto.createHmac('sha256', this.secretKey).update(queryString).digest('hex');
  }

  // API 요청 헤더 생성
  private getHeaders(includeSignature: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Christmas-Trading/1.0'
    };

    if (includeSignature && this.apiKey) {
      headers['X-MBX-APIKEY'] = this.apiKey;
    }

    return headers;
  }

  // 서명된 요청 파라미터 생성
  private createSignedParams(params: Record<string, any>): string {
    const timestamp = Date.now();
    const queryString = new URLSearchParams({
      ...params,
      timestamp: timestamp.toString()
    }).toString();
    
    const signature = this.createSignature(queryString);
    return `${queryString}&signature=${signature}`;
  }

  // 공용 API 요청 (서명 불필요)
  private async makePublicRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseURL}${endpoint}?${queryString}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(false)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new UserBinanceAPIError(response.status, `API request failed: ${response.statusText}`, errorBody);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof UserBinanceAPIError) {
        throw error;
      }
      throw new UserBinanceAPIError(500, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 서명된 API 요청 (개인 정보 필요)
  private async makeSignedRequest(endpoint: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', params: Record<string, any> = {}): Promise<any> {
    if (!this.apiKey || !this.secretKey) {
      throw new UserBinanceAPIError(401, 'API keys not initialized. Please set up your Binance API keys in settings.');
    }

    const signedParams = this.createSignedParams(params);
    const url = `${this.baseURL}${endpoint}`;

    try {
      const requestOptions: RequestInit = {
        method,
        headers: this.getHeaders(true)
      };

      if (method === 'POST') {
        requestOptions.body = signedParams;
        requestOptions.headers!['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      const finalUrl = (method === 'GET' || method === 'DELETE') ? `${url}?${signedParams}` : url;
      const response = await fetch(finalUrl, requestOptions);

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `API request failed: ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorBody);
          if (errorData.msg) {
            errorMessage = errorData.msg;
          }
        } catch {
          // JSON 파싱 실패시 원본 메시지 사용
        }

        throw new UserBinanceAPIError(response.status, errorMessage, errorBody);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof UserBinanceAPIError) {
        throw error;
      }
      throw new UserBinanceAPIError(500, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 계정 정보 조회
  async getAccountInfo(): Promise<UserAccountInfo> {
    const initResult = await this.initializeApiKeys();
    if (!initResult.success) {
      throw new UserBinanceAPIError(401, initResult.error || 'API 키 초기화 실패');
    }

    return await this.makeSignedRequest('/api/v3/account');
  }

  // 현재 가격 조회 (공용 API)
  async getPrice(symbol: string): Promise<{ symbol: string; price: number }> {
    const result = await this.makePublicRequest('/api/v3/ticker/price', { symbol });
    return {
      symbol: result.symbol,
      price: parseFloat(result.price)
    };
  }

  // 24시간 통계 조회 (공용 API)
  async get24hrStats(symbol: string): Promise<any> {
    return await this.makePublicRequest('/api/v3/ticker/24hr', { symbol });
  }

  // 스팟 주문 생성
  async createSpotOrder(orderRequest: UserSpotOrderRequest): Promise<UserOrderResult> {
    const initResult = await this.initializeApiKeys();
    if (!initResult.success) {
      throw new UserBinanceAPIError(401, initResult.error || 'API 키 초기화 실패');
    }

    console.log(`🔄 ${this.userId} 사용자 주문 생성:`, orderRequest);

    const params: Record<string, any> = {
      symbol: orderRequest.symbol,
      side: orderRequest.side,
      type: orderRequest.type,
      quantity: orderRequest.quantity.toString()
    };

    if (orderRequest.type === 'LIMIT') {
      if (!orderRequest.price) {
        throw new UserBinanceAPIError(400, 'LIMIT 주문에는 가격이 필요합니다.');
      }
      params.price = orderRequest.price.toString();
      params.timeInForce = orderRequest.timeInForce || 'GTC';
    }

    const result = await this.makeSignedRequest('/api/v3/order', 'POST', params);
    
    console.log(`✅ ${this.userId} 사용자 주문 완료:`, result);
    return result;
  }

  // 주문 취소
  async cancelOrder(symbol: string, orderId: number): Promise<any> {
    const initResult = await this.initializeApiKeys();
    if (!initResult.success) {
      throw new UserBinanceAPIError(401, initResult.error || 'API 키 초기화 실패');
    }

    return await this.makeSignedRequest('/api/v3/order', 'DELETE', {
      symbol,
      orderId: orderId.toString()
    });
  }

  // 주문 상태 조회
  async getOrder(symbol: string, orderId: number): Promise<any> {
    const initResult = await this.initializeApiKeys();
    if (!initResult.success) {
      throw new UserBinanceAPIError(401, initResult.error || 'API 키 초기화 실패');
    }

    return await this.makeSignedRequest('/api/v3/order', 'GET', {
      symbol,
      orderId: orderId.toString()
    });
  }

  // 잔액 조회
  async getBalance(asset?: string): Promise<any> {
    const accountInfo = await this.getAccountInfo();
    
    if (asset) {
      const balance = accountInfo.balances.find(b => b.asset === asset);
      return balance ? {
        asset: balance.asset,
        free: parseFloat(balance.free),
        locked: parseFloat(balance.locked),
        total: parseFloat(balance.free) + parseFloat(balance.locked)
      } : null;
    }

    return accountInfo.balances.map(balance => ({
      asset: balance.asset,
      free: parseFloat(balance.free),
      locked: parseFloat(balance.locked),
      total: parseFloat(balance.free) + parseFloat(balance.locked)
    }));
  }

  // API 키 유효성 테스트
  async testApiConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const initResult = await this.initializeApiKeys();
      if (!initResult.success) {
        return { success: false, error: initResult.error };
      }

      await this.getAccountInfo();
      return { success: true };
    } catch (error) {
      console.error('API 연결 테스트 실패:', error);
      return { 
        success: false, 
        error: error instanceof UserBinanceAPIError ? error.message : 'API 연결 테스트에 실패했습니다.' 
      };
    }
  }
}

// 사용자별 Binance API 인스턴스 생성 함수
export const createUserBinanceAPI = (userId: string): UserBinanceAPI => {
  return new UserBinanceAPI(userId);
};

export default UserBinanceAPI;
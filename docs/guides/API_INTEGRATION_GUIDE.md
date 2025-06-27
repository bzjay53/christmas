# 바이낸스 API 연동 가이드 (Binance API Integration Guide)

## 작성일: 2025-06-27 UTC

---

## 연동 목표

### 핵심 미션
Mock 데이터를 **바이낸스 API**로 완전 교체하여 실제 글로벌 암호화폐 시장 데이터 기반 거래 시스템 구축

### API 선택 근거
- **바이낸스 API**: 세계 최대 암호화폐 거래소 API
- **실시간 데이터**: WebSocket 기반 밀리초 단위 업데이트
- **포괄적 데이터**: Spot, Futures, Options 모든 시장 지원
- **높은 안정성**: 99.99% 업타임 보장
- **무료 제공**: 기본 시세 조회 무료, 거래 시 수수료만 발생

---

## API 설정 및 인증

### 1단계: 바이낸스 계정 및 API 키 발급

```bash
# 바이낸스 계정 생성 및 KYC 인증
# 1. binance.com 방문하여 계정 생성
# 2. KYC 인증 완료 (신분증 인증)
# 3. 2FA 보안 설정 (Google Authenticator 권장)
# 4. API Management에서 API 키 생성
```

### 2단계: API 키 권한 설정

```bash
# API 키 권한 설정 (보안상 최소 권한 부여)
✅ Enable Reading              # 시세 조회용
✅ Enable Spot & Margin Trading # 현물 거래용
❌ Enable Futures             # 선물 거래 (필요시에만)
❌ Enable Universal Transfer  # 자금 이체 (보안상 비활성화)

# IP 제한 설정 (필수)
- 개발 서버 IP 주소 등록
- 운영 서버 IP 주소 등록
- 와일드카드(*) 사용 금지
```

### 3단계: 환경 변수 설정

```env
# .env 파일에 추가
VITE_BINANCE_API_KEY=your_api_key_here
VITE_BINANCE_SECRET_KEY=your_secret_key_here
VITE_BINANCE_TESTNET=true  # 개발 환경에서는 testnet 사용
VITE_BINANCE_BASE_URL=https://api.binance.com
VITE_BINANCE_TESTNET_URL=https://testnet.binance.vision

# 제거할 기존 한국투자증권 환경변수
# KOREA_INVESTMENT_APP_KEY=...
# KOREA_INVESTMENT_APP_SECRET=...
# KOREA_INVESTMENT_ACCOUNT_NO=...
```

### 4단계: API 인증 방식 (HMAC SHA256)

```typescript
// src/lib/binanceAPI.ts
import crypto from 'crypto';

export class BinanceAPI {
  private apiKey: string;
  private secretKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_BINANCE_API_KEY;
    this.secretKey = import.meta.env.VITE_BINANCE_SECRET_KEY;
    this.baseURL = import.meta.env.VITE_BINANCE_TESTNET === 'true' 
      ? import.meta.env.VITE_BINANCE_TESTNET_URL
      : import.meta.env.VITE_BINANCE_BASE_URL;
  }

  // HMAC SHA256 서명 생성
  private createSignature(queryString: string): string {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(queryString)
      .digest('hex');
  }

  // 인증이 필요한 요청을 위한 헤더 생성
  private createAuthHeaders(timestamp: number, signature: string) {
    return {
      'X-MBX-APIKEY': this.apiKey,
      'Content-Type': 'application/json',
    };
  }
}
```

---

## 핵심 API 기능 구현

### 1. 시세 조회 (Public API - 인증 불필요)

```typescript
// 현재가 조회
async getTickerPrice(symbol: string): Promise<CryptoPrice> {
  const response = await fetch(`${this.baseURL}/api/v3/ticker/price?symbol=${symbol}`);
  const data = await response.json();
  
  return {
    symbol: data.symbol,
    price: parseFloat(data.price),
    timestamp: Date.now()
  };
}

// 24시간 시세 통계
async getTicker24hr(symbol: string): Promise<Ticker24hr> {
  const response = await fetch(`${this.baseURL}/api/v3/ticker/24hr?symbol=${symbol}`);
  const data = await response.json();
  
  return {
    symbol: data.symbol,
    priceChange: parseFloat(data.priceChange),
    priceChangePercent: parseFloat(data.priceChangePercent),
    weightedAvgPrice: parseFloat(data.weightedAvgPrice),
    prevClosePrice: parseFloat(data.prevClosePrice),
    lastPrice: parseFloat(data.lastPrice),
    volume: parseFloat(data.volume),
    quoteVolume: parseFloat(data.quoteVolume),
    count: parseInt(data.count)
  };
}

// K선 데이터 (차트용)
async getKlineData(symbol: string, interval: string, limit: number = 100): Promise<KlineData[]> {
  const response = await fetch(
    `${this.baseURL}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );
  const data = await response.json();
  
  return data.map((kline: any[]) => ({
    openTime: parseInt(kline[0]),
    open: parseFloat(kline[1]),
    high: parseFloat(kline[2]),
    low: parseFloat(kline[3]),
    close: parseFloat(kline[4]),
    volume: parseFloat(kline[5]),
    closeTime: parseInt(kline[6])
  }));
}
```

### 2. 계좌 정보 조회 (Private API - 인증 필요)

```typescript
// 계좌 잔고 조회
async getAccountBalance(): Promise<AccountBalance[]> {
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  const signature = this.createSignature(queryString);
  
  const response = await fetch(
    `${this.baseURL}/api/v3/account?${queryString}&signature=${signature}`,
    {
      headers: this.createAuthHeaders(timestamp, signature)
    }
  );
  
  const data = await response.json();
  
  return data.balances
    .filter((balance: any) => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
    .map((balance: any) => ({
      asset: balance.asset,
      free: parseFloat(balance.free),
      locked: parseFloat(balance.locked),
      total: parseFloat(balance.free) + parseFloat(balance.locked)
    }));
}
```

### 3. 주문 처리 (Private API - 인증 필요)

```typescript
// 현물 주문 생성
async createSpotOrder(orderRequest: SpotOrderRequest): Promise<OrderResult> {
  const timestamp = Date.now();
  const queryString = new URLSearchParams({
    symbol: orderRequest.symbol,
    side: orderRequest.side, // 'BUY' or 'SELL'
    type: orderRequest.type, // 'MARKET' or 'LIMIT'
    quantity: orderRequest.quantity.toString(),
    ...(orderRequest.price && { price: orderRequest.price.toString() }),
    timestamp: timestamp.toString()
  }).toString();
  
  const signature = this.createSignature(queryString);
  
  const response = await fetch(
    `${this.baseURL}/api/v3/order?${queryString}&signature=${signature}`,
    {
      method: 'POST',
      headers: this.createAuthHeaders(timestamp, signature)
    }
  );
  
  const data = await response.json();
  
  return {
    orderId: data.orderId,
    symbol: data.symbol,
    status: data.status,
    executedQty: parseFloat(data.executedQty),
    cummulativeQuoteQty: parseFloat(data.cummulativeQuoteQty),
    transactTime: data.transactTime
  };
}

// 주문 상태 조회
async getOrderStatus(symbol: string, orderId: number): Promise<OrderStatus> {
  const timestamp = Date.now();
  const queryString = `symbol=${symbol}&orderId=${orderId}&timestamp=${timestamp}`;
  const signature = this.createSignature(queryString);
  
  const response = await fetch(
    `${this.baseURL}/api/v3/order?${queryString}&signature=${signature}`,
    {
      headers: this.createAuthHeaders(timestamp, signature)
    }
  );
  
  return await response.json();
}
```

---

## 실시간 데이터 (WebSocket)

### WebSocket 연결 설정

```typescript
// 실시간 가격 스트리밍
class BinanceWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connectPriceStream(symbols: string[], callback: (data: any) => void) {
    const streams = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`).join('/');
    const wsUrl = `wss://stream.binance.com:9443/ws/${streams}`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('바이낸스 WebSocket 연결 성공');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };
    
    this.ws.onclose = () => {
      console.log('바이낸스 WebSocket 연결 종료');
      this.handleReconnect(symbols, callback);
    };
    
    this.ws.onerror = (error) => {
      console.error('바이낸스 WebSocket 오류:', error);
    };
  }

  private handleReconnect(symbols: string[], callback: (data: any) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connectPriceStream(symbols, callback);
      }, 5000 * this.reconnectAttempts);
    }
  }
}
```

---

## 데이터 타입 정의

```typescript
// 암호화폐 가격 정보
interface CryptoPrice {
  symbol: string;
  price: number;
  timestamp: number;
}

// 24시간 시세 통계
interface Ticker24hr {
  symbol: string;
  priceChange: number;
  priceChangePercent: number;
  weightedAvgPrice: number;
  prevClosePrice: number;
  lastPrice: number;
  volume: number;
  quoteVolume: number;
  count: number;
}

// K선 데이터
interface KlineData {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

// 계좌 잔고
interface AccountBalance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

// 주문 요청
interface SpotOrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity: number;
  price?: number;
}

// 주문 결과
interface OrderResult {
  orderId: number;
  symbol: string;
  status: string;
  executedQty: number;
  cummulativeQuoteQty: number;
  transactTime: number;
}
```

---

## 에러 처리 및 Rate Limiting

### 1. 에러 처리

```typescript
class BinanceAPIError extends Error {
  constructor(public code: number, public message: string) {
    super(message);
    this.name = 'BinanceAPIError';
  }
}

async handleAPIResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json();
    throw new BinanceAPIError(errorData.code, errorData.msg);
  }
  return response.json();
}
```

### 2. Rate Limiting

```typescript
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
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}
```

---

## 보안 베스트 프랙티스

### 1. API 키 보안
- 환경 변수로만 저장, 코드에 하드코딩 금지
- IP 제한 설정 필수
- 정기적인 API 키 로테이션
- Testnet에서 충분한 테스트 후 Mainnet 적용

### 2. 서명 검증
- 모든 Private API 요청에 HMAC SHA256 서명 필수
- 타임스탬프 기반 요청 유효성 검증
- 네트워크 지연 고려한 타임스탬프 윈도우 설정

### 3. 에러 로깅
- 모든 API 호출 로그 기록
- 민감한 정보 (API 키, 서명) 로그에서 제외
- 에러 발생 시 즉시 알림 시스템

---

## 테스트 전략

### 1. Unit Tests
```typescript
describe('BinanceAPI', () => {
  test('should get ticker price', async () => {
    const api = new BinanceAPI();
    const price = await api.getTickerPrice('BTCUSDT');
    expect(price.symbol).toBe('BTCUSDT');
    expect(price.price).toBeGreaterThan(0);
  });
});
```

### 2. Integration Tests
- Testnet을 활용한 실제 API 호출 테스트
- WebSocket 연결 안정성 테스트
- Rate Limiting 동작 확인

### 3. Mock Tests
- API 응답 모킹으로 에러 상황 시뮬레이션
- 네트워크 장애 상황 테스트

---

## 모니터링 및 로깅

### 1. 성능 메트릭
- API 응답 시간 모니터링
- Rate Limit 사용률 추적
- WebSocket 연결 상태 모니터링

### 2. 비즈니스 메트릭
- 거래 성공/실패율
- 실시간 데이터 정확성
- 사용자 거래 패턴 분석

---

## 마이그레이션 체크리스트

### Phase 1: 기반 설정
- [ ] 바이낸스 API 키 발급 완료
- [ ] 환경 변수 설정 완료
- [ ] BinanceAPI 클래스 기본 구조 완성
- [ ] 인증 시스템 구현 및 테스트

### Phase 2: 핵심 기능
- [ ] 시세 조회 API 구현
- [ ] 계좌 정보 조회 구현
- [ ] 주문 시스템 구현
- [ ] WebSocket 실시간 데이터 구현

### Phase 3: 통합 및 테스트
- [ ] 기존 한국투자증권 API 코드 제거
- [ ] 에러 처리 및 Rate Limiting 구현
- [ ] 통합 테스트 완료
- [ ] 프로덕션 배포

---

## 참고 자료

### 공식 문서
- [바이낸스 API 공식 문서](https://binance-docs.github.io/apidocs/spot/en/)
- [바이낸스 WebSocket API](https://binance-docs.github.io/apidocs/spot/en/#websocket-market-streams)
- [바이낸스 Testnet](https://testnet.binance.vision/)

### 개발 도구
- [API 테스트 도구](https://binance-docs.github.io/apidocs/spot/en/#test-connectivity)
- [서명 생성 예제](https://binance-docs.github.io/apidocs/spot/en/#signed-trade-and-user_data-endpoint-security)

---

문서 작성 완료: 2025-06-27 UTC
다음 업데이트 예정: 바이낸스 API 통합 완료 후
# 바이낸스 암호화폐 거래 시스템 명세서

## 📋 문서 정보
- **문서명**: 바이낸스 암호화폐 거래 시스템 명세서 (Binance Crypto Trading System Specification)
- **작성일**: 2025-06-27 (한국투자증권 → 바이낸스 전환)
- **버전**: v2.0 (Binance Edition)
- **우선순위**: CRITICAL
- **상태**: 활성화 (Active) - 바이낸스 API 통합

## 🎯 목적
Christmas Trading 플랫폼의 바이낸스 암호화폐 거래 시스템 전반에 대한 기술적 명세와 구현 방법을 정의합니다.

## 🏗️ 시스템 아키텍처

### 1. 바이낸스 암호화폐 거래 시스템 핵심 컴포넌트
```
바이낸스 암호화폐 거래 시스템 구조:
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React) - 24/7 대응            │
├─────────────────────────────────────────────────────────────┤
│  CryptoDashboardReact.tsx  │  BinanceConnectionTest.tsx   │
│  - 암호화폐 거래 UI 컴포넌트   │  - 바이낸스 API 연결 테스트   │
│  - 안전한 암호화폐 거래 버튼   │  - 실시간 상태 모니터링       │
│  - 24/7 시장 대응 인터페이스   │  - Rate Limiting 모니터링     │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer (암호화폐 특화)            │
├─────────────────────────────────────────────────────────────┤
│       cryptoService.ts         │  cryptoTradingConflictManager.ts│
│   - 암호화폐 거래 요청 처리     │   - 동시 암호화폐 거래 방지    │
│   - 바이낸스 API 데이터 통합   │   - 충돌 감지 시스템          │
│   - Mock/Real 데이터 전환      │   - 대안 코인 추천            │
│   - 24/7 시장 데이터 처리      │   - 높은 변동성 보호 로직     │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    API Integration (하이브리드)             │
├─────────────────────────────────────────────────────────────┤
│         binanceAPI.ts          │       supabase.ts         │
│   - 바이낸스 REST API 통합     │   - 암호화폐 데이터베이스    │
│   - 실시간 암호화폐 시세       │   - 사용자 포트폴리오 관리   │
│   - Spot 거래 처리             │   - 실시간 구독 시스템       │
│   - WebSocket 실시간 데이터    │   - 암호화폐 주문 히스토리   │
│   - HMAC SHA256 인증           │   - RLS 보안 정책           │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 거래 플로우

### 2. 바이낸스 암호화폐 안전한 거래 처리 과정
```typescript
// 암호화폐 거래 요청 → 충돌 감지 → 안전 검증 → 바이낸스 주문 처리 → 결과 반환
async function safePlaceCryptoOrder(
  userId: string, 
  symbol: string,              // 'BTCUSDT', 'ETHUSDT'
  side: 'BUY' | 'SELL', 
  type: 'MARKET' | 'LIMIT',
  quantity: number,            // DECIMAL(20,8) 정밀도
  price?: number,              // LIMIT 주문시
  timeInForce?: 'GTC' | 'IOC' | 'FOK'
): Promise<CryptoTradeResult>
```

**바이낸스 특화 단계별 처리:**
1. **암호화폐 거래 요청 접수** - 사용자 입력 검증 (24/7 대응)
2. **바이낸스 Rate Limiting 체크** - 분당 1200 요청 제한 확인
3. **충돌 감지 시스템** - 동시 암호화폐 거래 방지 로직
4. **변동성 안전 검증** - 높은 암호화폐 변동성 보호
5. **바이낸스 API 주문 처리** - HMAC SHA256 인증 + Spot 거래
6. **실시간 주문 상태 추적** - WebSocket 기반 체결 모니터링
7. **결과 반환** - 성공/실패 메시지 + 대안 코인 제안

### 3. 암호화폐 동시 거래 방지 시스템
```typescript
interface CryptoTradeConflict {
  conflictType: 'same_symbol' | 'volatility_risk' | 'timing_collision' | 'market_impact';
  affectedUsers: string[];
  symbol: string;              // 'BTCUSDT', 'ETHUSDT'
  baseAsset: string;          // 'BTC', 'ETH'
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  currentVolatility: number;   // 24시간 변동률
  marketCap: number;          // 시가총액 (USD)
}
```

**암호화폐 특화 충돌 감지 규칙:**
- **동일 심볼 제한**: 최대 5명까지 동시 거래 허용 (높은 유동성)
- **타이밍 충돌**: 1초 내 동시 주문 시 지연 권장 (빠른 시장)
- **변동성 보호**: 24시간 변동률 10% 초과 시 경고
- **AI 클러스터링**: 전략 유사도 70% 이상 시 대안 코인 제공
- **시장 영향도**: 거래량 대비 주문 규모 분석

## 🚦 바이낸스 API 통합 시스템

### 4. 바이낸스 API 연동 (24/7 글로벌 시장)
```typescript
// 환경별 설정 (테스트넷/메인넷)
const binanceAPI = new BinanceAPI();

// 테스트넷: https://testnet.binance.vision
// 메인넷: https://api.binance.com

// 환경 변수 기반 자동 전환
const baseURL = import.meta.env.VITE_BINANCE_TESTNET === 'true' 
  ? import.meta.env.VITE_BINANCE_TESTNET_URL
  : import.meta.env.VITE_BINANCE_BASE_URL;
```

**바이낸스 특화 주요 기능:**
- **HMAC SHA256 인증**: API 키 + Secret 키 기반 보안 인증
- **Rate Limiting 관리**: 분당 1200 요청 자동 제한 관리
- **실시간 WebSocket**: 밀리초 단위 실시간 시세 수신
- **24/7 시장 대응**: 시간 제약 없는 글로벌 암호화폐 시장
- **높은 정밀도**: 소수점 8자리 암호화폐 거래 지원
- **시세 조회**: 실시간 주식 가격 정보
- **주문 처리**: 매수/매도 주문 (모의투자 우선)
- **계좌 조회**: 잔고 및 보유 종목 확인

### 5. 데이터 우선순위 시스템
```typescript
// 데이터 소스 우선순위: 실제 API → Supabase → Mock 데이터
const dataFlow = {
  primary: "Korean Investment API",
  fallback1: "Supabase Database",
  fallback2: "Mock Data"
};
```

## 🛡️ 보안 및 위험 관리

### 6. 환경변수 관리
```env
# 한국투자증권 API (모의투자)
VITE_KOREA_INVESTMENT_APP_KEY=your_app_key_here
VITE_KOREA_INVESTMENT_APP_SECRET=your_app_secret_here
VITE_KOREA_INVESTMENT_ACCOUNT_NO=your_account_number
VITE_KOREA_INVESTMENT_ACCOUNT_TYPE=02  # 02: 모의투자, 01: 실전투자

# 보안 설정
VITE_ENABLE_MOCK_DATA=true  # true: Mock 데이터, false: 실제 API
```

### 7. 오류 처리 및 복구
```typescript
// 계층적 오류 처리
try {
  // 1차: 실제 API 시도
  const result = await koreaInvestmentAPI.getCurrentPrice(stockCode);
} catch (apiError) {
  // 2차: Supabase 데이터 사용
  const cachedData = await supabase.from('stocks').select('*');
} catch (dbError) {
  // 3차: Mock 데이터 사용
  return mockStocks;
}
```

## 📊 성능 및 모니터링

### 8. 실시간 데이터 시스템
```typescript
// 장중/장마감 시간 자동 감지
const isMarketOpen = (): { isOpen: boolean; message: string } => {
  // 한국시간 기준: 평일 09:00-15:30
  // 장중: 1초 간격 업데이트
  // 장마감: 정적 데이터 유지
}
```

**성능 최적화:**
- **Rate Limiting**: API 호출 간격 조정 (100ms 지연)
- **캐싱 시스템**: Supabase 데이터 자동 저장
- **실시간 구독**: WebSocket 기반 데이터 업데이트

### 9. 거래 현황 모니터링
```typescript
// 실시간 거래 현황 조회
const getActiveTradingStatus = (): TradingStatus[] => {
  return tradingConflictManager.getActiveTradeStatus();
}

interface TradingStatus {
  stockCode: string;
  userCount: number;
  recentOrders: number;
}
```

## 🔧 기술 명세

### 10. 주요 타입 정의
```typescript
// 주식 데이터 인터페이스
interface StockData {
  symbol: string;
  name: string;
  current_price: number;
  price_change: number;
  price_change_percent: number;
  volume: number;
  last_updated: string;
}

// 거래 요청 인터페이스
interface TradeRequest {
  userId: string;
  stockCode: string;
  orderType: 'buy' | 'sell';
  quantity: number;
  price?: number;
  timestamp: number;
}

// 거래 결과 인터페이스
interface TradeResult {
  success: boolean;
  message: string;
  conflict?: TradeConflict;
  alternatives?: AlternativeStock[];
}
```

### 11. 컴포넌트 구조
```typescript
// 거래 UI 컴포넌트
const StaticDashboardReact: React.FC = () => {
  const [isTrading, setIsTrading] = useState(false);
  const [stockCode, setStockCode] = useState('005930');
  const [quantity, setQuantity] = useState(10);
  const [tradeMessage, setTradeMessage] = useState('');

  const handleTrade = async (orderType: 'buy' | 'sell') => {
    // 안전한 거래 처리 로직
  };
};
```

## 📈 확장성 고려사항

### 12. 향후 개선 계획
1. **AI 전략 고도화**: 개별 사용자별 맞춤형 지표 설정
2. **실시간 알림**: WebSocket 기반 거래 상태 알림
3. **포트폴리오 관리**: 자동 리밸런싱 시스템
4. **백테스팅**: 전략 성과 분석 도구
5. **소셜 기능**: 친구 초대 및 리더보드 시스템

### 13. 성능 벤치마크
- **API 응답 시간**: < 1초 (한국투자증권 API)
- **UI 반응성**: < 200ms (React 상태 업데이트)
- **데이터 동기화**: 1초 간격 (장중 실시간 업데이트)
- **동시 사용자**: 최대 1,000명 (추정)

## 🏃‍♂️ 배포 및 운영

### 14. 배포 프로세스
```bash
# 빌드 및 배포
npm run build
npm run deploy  # Vercel 자동 배포

# 환경 확인
npm run test:api  # API 연결 테스트
npm run test:trading  # 거래 시스템 테스트
```

### 15. 모니터링 지표
- **API 성공률**: > 99%
- **거래 충돌 방지율**: > 95%
- **시스템 가용성**: > 99.9%
- **데이터 정확도**: > 99.5%

---

## 📝 변경 이력
- **v1.0** (2025-06-24): 초기 거래 시스템 명세서 작성
- 한국투자증권 API 통합 완료
- 동시 거래 방지 시스템 구현
- 안전한 거래 UI 컴포넌트 완성

## 🔗 관련 문서
- [API 통합 가이드](../guides/API_INTEGRATION_GUIDE.md)
- [위험 관리 명세서](RISK_MANAGEMENT_SPEC.md)
- [문서 맵](../DOCUMENT_MAP.md)

---
*이 문서는 Christmas Trading 프로젝트의 거래 시스템 핵심 명세서입니다.*
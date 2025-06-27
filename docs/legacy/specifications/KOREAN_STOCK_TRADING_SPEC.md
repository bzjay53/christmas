# 🎄 Christmas Trading - 거래 시스템 명세서

## 📋 문서 정보
- **문서명**: 거래 시스템 명세서 (Trading System Specification)
- **작성일**: 2025-06-24
- **버전**: v1.0
- **우선순위**: CRITICAL
- **상태**: 활성화 (Active)

## 🎯 목적
Christmas Trading 플랫폼의 거래 시스템 전반에 대한 기술적 명세와 구현 방법을 정의합니다.

## 🏗️ 시스템 아키텍처

### 1. 핵심 컴포넌트
```
거래 시스템 구조:
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│  StaticDashboardReact.tsx  │  APIConnectionTest.tsx        │
│  - 거래 UI 컴포넌트         │  - API 연결 테스트            │
│  - 안전한 거래 버튼         │  - 실시간 상태 모니터링       │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                           │
├─────────────────────────────────────────────────────────────┤
│         stocksService.ts        │    tradingConflictManager.ts│
│    - 거래 요청 처리            │    - 동시 거래 방지         │
│    - API 데이터 통합           │    - 충돌 감지 시스템       │
│    - Mock/Real 데이터 전환     │    - 대안 종목 추천         │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    API Integration                         │
├─────────────────────────────────────────────────────────────┤
│      koreaInvestmentAPI.ts      │       supabase.ts         │
│   - 한국투자증권 OpenAPI        │   - 데이터베이스 연동      │
│   - 실시간 시세 조회           │   - 사용자 데이터 관리     │
│   - 주문 처리 (모의/실전)      │   - 실시간 구독 시스템     │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 거래 플로우

### 2. 안전한 거래 처리 과정
```typescript
// 거래 요청 → 충돌 감지 → 안전 검증 → 주문 처리 → 결과 반환
async function safePlaceOrder(
  userId: string, 
  stockCode: string, 
  orderType: 'buy' | 'sell', 
  quantity: number, 
  price?: number
): Promise<TradeResult>
```

**단계별 처리:**
1. **거래 요청 접수** - 사용자 입력 검증
2. **충돌 감지 시스템** - 동시 거래 방지 로직
3. **시간 분산 권장** - 최적 거래 타이밍 계산
4. **실제 주문 처리** - 한국투자증권 API 호출
5. **결과 반환** - 성공/실패 메시지 + 대안 제안

### 3. 동시 거래 방지 시스템
```typescript
interface TradeConflict {
  conflictType: 'same_stock' | 'cluster_risk' | 'timing_collision';
  affectedUsers: string[];
  stockCode: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
```

**충돌 감지 규칙:**
- **동일 종목 제한**: 최대 3명까지 동시 거래 허용
- **타이밍 충돌**: 5초 내 동시 주문 시 지연 권장
- **AI 클러스터링**: 전략 유사도 70% 이상 시 대안 제공

## 🚦 API 통합 시스템

### 4. 한국투자증권 API 연동
```typescript
// 환경별 설정
const koreaInvestmentAPI = new KoreaInvestmentAPI(isProduction);

// 모의투자: https://openapivts.koreainvestment.com:29443
// 실전투자: https://openapi.koreainvestment.com:9443
```

**주요 기능:**
- **인증 관리**: OAuth2 토큰 자동 갱신
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
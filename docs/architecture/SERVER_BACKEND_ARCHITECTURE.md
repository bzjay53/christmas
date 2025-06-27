# 바이낸스 암호화폐 거래 플랫폼 - Supabase Backend Architecture

## 📅 **업데이트**: 2025-06-27 (한국투자증권 → 바이낸스 암호화폐 전환)

---

## 🏗️ **바이낸스 전환 아키텍처 개요**

### **Frontend: React + Vite (암호화폐 최적화)**
- **배포**: Vercel (https://christmas-ruddy.vercel.app/)
- **프레임워크**: React 18 + TypeScript
- **차트**: Chart.js (24/7 실시간 암호화폐 데이터)
- **스타일링**: Tailwind CSS (다크 모드 최적화)

### **Backend: Supabase + Binance API (하이브리드)**
- **데이터베이스**: PostgreSQL with RLS (암호화폐 중심 스키마)
- **실시간**: Supabase Realtime + Binance WebSocket
- **외부 API**: Binance REST API + WebSocket
- **인증**: Supabase Auth + Binance API 키 관리
- **API**: 자동 생성 REST API + 커스텀 Binance 통합

---

## 📊 **암호화폐 데이터베이스 설계**

### **바이낸스 연동 핵심 테이블 구조**

#### **1. crypto_pairs (암호화폐 거래 쌍)**
```sql
CREATE TABLE crypto_pairs (
  symbol VARCHAR(20) PRIMARY KEY,           -- 'BTCUSDT', 'ETHUSDT'
  base_asset VARCHAR(10) NOT NULL,          -- 'BTC', 'ETH'
  quote_asset VARCHAR(10) NOT NULL,         -- 'USDT', 'BTC'
  current_price DECIMAL(20,8),              -- 높은 정밀도 (소수점 8자리)
  price_change_24h DECIMAL(20,8),           -- 24시간 변동액
  price_change_percent_24h DECIMAL(10,4),   -- 24시간 변동률
  volume_24h DECIMAL(20,8),                 -- 24시간 거래량
  quote_volume_24h DECIMAL(20,8),           -- 24시간 거래대금
  high_24h DECIMAL(20,8),                   -- 24시간 최고가
  low_24h DECIMAL(20,8),                    -- 24시간 최저가
  market_cap DECIMAL(25,2),                 -- 시가총액 (USD)
  is_active BOOLEAN DEFAULT true,           -- 거래 활성화 여부
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **2. users (사용자 - 암호화폐 최적화)**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  portfolio_balance_usdt DECIMAL(20,8) DEFAULT 0.00000000, -- USDT 기준 총 자산
  available_cash_usdt DECIMAL(20,8) DEFAULT 1000.00000000, -- 거래 가능 USDT
  binance_api_key_encrypted TEXT,           -- 암호화된 사용자 API 키
  binance_api_settings JSONB,               -- API 설정 (권한, 제한사항)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **3. portfolios (포트폴리오 - 암호화폐)**
```sql
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  asset VARCHAR(10) NOT NULL,               -- 'BTC', 'ETH', 'USDT'
  quantity DECIMAL(20,8) NOT NULL,          -- 보유 수량 (높은 정밀도)
  avg_cost_usdt DECIMAL(20,8),              -- 평균 매입 단가 (USDT)
  total_cost_usdt DECIMAL(20,8),            -- 총 매입 금액 (USDT)
  unrealized_pnl_usdt DECIMAL(20,8),        -- 미실현 손익 (USDT)
  realized_pnl_usdt DECIMAL(20,8) DEFAULT 0, -- 실현 손익 (USDT)
  first_purchase_at TIMESTAMP WITH TIME ZONE,
  last_transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, asset)
);
```

#### **4. orders (주문 - 바이낸스 연동)**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  binance_order_id BIGINT,                  -- 바이낸스 주문 ID
  symbol VARCHAR(20) NOT NULL,              -- 'BTCUSDT', 'ETHUSDT'
  side VARCHAR(4) NOT NULL,                 -- 'BUY', 'SELL'
  type VARCHAR(10) NOT NULL,                -- 'MARKET', 'LIMIT', 'STOP_LOSS'
  quantity DECIMAL(20,8) NOT NULL,          -- 주문 수량
  price DECIMAL(20,8),                      -- 주문 가격 (LIMIT 주문시)
  executed_quantity DECIMAL(20,8) DEFAULT 0, -- 체결 수량
  executed_quote_quantity DECIMAL(20,8) DEFAULT 0, -- 체결 금액
  avg_execution_price DECIMAL(20,8),        -- 평균 체결 가격
  status VARCHAR(20) DEFAULT 'PENDING',     -- 주문 상태
  commission DECIMAL(20,8) DEFAULT 0,       -- 수수료
  commission_asset VARCHAR(10),             -- 수수료 자산
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CHECK (side IN ('BUY', 'SELL')),
  CHECK (status IN ('PENDING', 'FILLED', 'PARTIALLY_FILLED', 'CANCELED', 'REJECTED', 'EXPIRED'))
);
```

---

## 🔄 **바이낸스 실시간 데이터 플로우**

### **현재 구현 (바이낸스 Public API)**
```
1. 24/7 글로벌 암호화폐 시장 (시간 제한 없음)
2. 바이낸스 REST API 실시간 호출
3. 실시간 가격 데이터 수신
4. Chart.js 암호화폐 차트 업데이트
5. 1초 간격 고속 업데이트
```

### **고급 구현 (WebSocket + 데이터베이스)**
```
Binance WebSocket → binanceAPI.ts → Supabase Functions → PostgreSQL → Realtime → React
                 ↓
            Price History 저장
            Portfolio 자동 계산
            Alert 시스템 트리거
```

### **하이브리드 아키텍처**
```
[프론트엔드]
    ↓
[binanceAPI.ts 클라이언트]
    ↓
[바이낸스 API] ←→ [Supabase PostgreSQL]
    ↓                    ↓
[실시간 시세]        [사용자 데이터]
[거래 기능]          [포트폴리오]
[차트 데이터]        [주문 히스토리]
```

---

## 🔒 **바이낸스 통합 보안 모델**

### **Row Level Security (RLS) - 암호화폐 최적화**
```sql
-- 사용자별 포트폴리오 데이터 격리
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own crypto portfolio" ON portfolios
  FOR ALL USING (auth.uid() = user_id);

-- 사용자별 주문 데이터 격리  
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON orders
  FOR ALL USING (auth.uid() = user_id);

-- 암호화폐 거래 쌍 데이터는 모든 사용자 조회 가능
ALTER TABLE crypto_pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view crypto pairs" ON crypto_pairs
  FOR SELECT USING (true);

-- 사용자 API 키는 본인만 접근 가능
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users
  FOR ALL USING (auth.uid() = id);
```

### **바이낸스 API 키 보안**
```sql
-- API 키 암호화 저장
CREATE OR REPLACE FUNCTION encrypt_api_key(api_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(encrypt(api_key::bytea, 'AES_KEY', 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- API 키 복호화 (서버 사이드만)
CREATE OR REPLACE FUNCTION decrypt_api_key(encrypted_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN convert_from(decrypt(decode(encrypted_key, 'base64'), 'AES_KEY', 'aes'), 'UTF8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📡 **하이브리드 API 엔드포인트**

### **Supabase 자동 생성 REST API (사용자 데이터)**
```
GET    /rest/v1/crypto_pairs        # 모든 암호화폐 조회
GET    /rest/v1/crypto_pairs?symbol=eq.BTCUSDT  # 특정 코인 조회
POST   /rest/v1/portfolios         # 포트폴리오 추가
GET    /rest/v1/portfolios?user_id=eq.{userId}  # 사용자 포트폴리오
GET    /rest/v1/orders?user_id=eq.{userId}      # 사용자 주문 히스토리
```

### **바이낸스 API 통합 엔드포인트 (binanceAPI.ts)**
```typescript
// Public API (인증 불필요)
await binanceAPI.getTickerPrice('BTCUSDT')           // 현재가
await binanceAPI.getTicker24hr('BTCUSDT')            // 24시간 통계
await binanceAPI.getKlineData('BTCUSDT', '1h', 100)  // K선 데이터
await binanceAPI.getMultipleTickerPrices(['BTCUSDT', 'ETHUSDT'])

// Private API (사용자 인증 + API 키 필요)
await binanceAPI.getAccountInfo()                    // 계좌 정보
await binanceAPI.createSpotOrder(orderRequest)       // 주문 생성
await binanceAPI.getOrderStatus('BTCUSDT', orderId)  // 주문 상태
await binanceAPI.cancelOrder('BTCUSDT', orderId)     // 주문 취소
```

### **실시간 구독 (하이브리드)**
```typescript
// Supabase Realtime (사용자 데이터)
supabase
  .channel('portfolio_channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public', 
    table: 'portfolios',
    filter: `user_id=eq.${userId}`
  }, callback)
  .subscribe()

// Binance WebSocket (시장 데이터)
binanceWebSocket.connectPriceStream(
  ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'], 
  (priceData) => {
    // 실시간 가격 업데이트 처리
    updateChart(priceData);
    updatePortfolioValue(priceData);
  }
);
```

---

## 🚀 **바이낸스 통합 배포 및 인프라**

### **프로덕션 스택 (암호화폐 최적화)**
- **Frontend**: Vercel (CDN + Edge Functions + 24/7 대응)
- **Database**: Supabase (Multi-region PostgreSQL + 암호화폐 스키마)
- **외부 API**: Binance API (REST + WebSocket)
- **Static Assets**: Vercel Edge Network (글로벌 캐싱)
- **Environment**: Production-ready (24/7 암호화폐 시장 대응)

### **바이낸스 성능 최적화**
```typescript
// 1. 암호화폐 차트 최적화 (24/7 대응)
chart.update('none') // 애니메이션 없이 즉시 업데이트
chart.data.datasets[0].data = cryptoPriceData // 실시간 암호화폐 데이터

// 2. 바이낸스 API Rate Limiting
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 1200; // 분당 1200 요청
  private readonly timeWindow = 60000; // 1분
  
  async waitIfNeeded(): Promise<void> {
    // Rate limiting 로직
  }
}

// 3. WebSocket 연결 관리
useEffect(() => {
  const binanceWS = new BinanceWebSocket();
  binanceWS.connectPriceStream(['BTCUSDT', 'ETHUSDT'], handlePriceUpdate);
  
  return () => {
    binanceWS.disconnect();
    chart.destroy();
    supabaseSubscription.unsubscribe();
  }
}, [])

// 4. 번들 최적화 (암호화폐 특화)
const { BinanceAPI } = await import('./lib/binanceAPI') // 동적 임포트
const { getCryptoMarketStatus } = await import('./utils/cryptoMarketHours') // 24/7 로직
```

### **환경 변수 관리**
```env
# Vercel 환경 변수 (Production)
VITE_BINANCE_API_KEY=your_production_api_key
VITE_BINANCE_SECRET_KEY=your_production_secret_key
VITE_BINANCE_TESTNET=false  # 프로덕션에서는 메인넷
VITE_BINANCE_BASE_URL=https://api.binance.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### **성능 모니터링**
```typescript
// 바이낸스 API 응답 시간 모니터링
const startTime = performance.now();
const priceData = await binanceAPI.getTickerPrice('BTCUSDT');
const responseTime = performance.now() - startTime;

console.log(`바이낸스 API 응답 시간: ${responseTime}ms`);

// Rate Limit 사용률 추적
console.log(`Rate Limit 사용률: ${rateLimiter.getUsage()}%`);
```

---

## 📊 **암호화폐 특화 아키텍처 장점**

### **24/7 글로벌 시장 대응**
- ✅ 시간 제약 없는 실시간 데이터
- ✅ 전 세계 사용자 동시 접속 지원
- ✅ 높은 변동성 대응 고속 업데이트

### **높은 정밀도 데이터 처리**
- ✅ DECIMAL(20,8) 소수점 8자리 지원
- ✅ 사토시 단위 미세 거래 처리
- ✅ 정확한 포트폴리오 손익 계산

### **확장 가능한 하이브리드 구조**
- ✅ Supabase (사용자 데이터) + Binance (시장 데이터)
- ✅ 각 시스템 독립적 확장 가능
- ✅ 장애 발생 시 부분적 서비스 유지

---

## 🔮 **다음 단계 로드맵**

### **Phase 2.1: 바이낸스 API 실제 연동 (1주)**
- ✅ binanceAPI.ts 모듈 활성화 (완료)
- ⏳ Secret 키 설정 및 Private API 테스트
- ⏳ 실시간 시세 데이터 교체

### **Phase 2.2: 데이터베이스 마이그레이션 (1주)**
- ⏳ crypto_pairs 테이블 생성 및 초기 데이터
- ⏳ portfolios/orders 테이블 암호화폐 버전 생성
- ⏳ RLS 정책 적용

### **Phase 2.3: 통합 테스트 (1주)**
- ⏳ Public API ↔ Private API 연동
- ⏳ WebSocket 실시간 데이터 통합
- ⏳ 포트폴리오 자동 계산 로직

---

**📅 문서 업데이트**: 2025-06-27 UTC (바이낸스 전환 완료)  
**🔄 다음 업데이트**: Secret 키 설정 후 Phase 2 실행 시

---

## 📈 **모니터링 및 로깅**

### **클라이언트 사이드**
```javascript
console.log('⏰ 현재 한국시간:', koreaTime)
console.log('🔍 시장 상태 체크:', marketStatus.message)
console.log('📈 장중 데이터 업데이트:', stocks)
console.log('⏸️ 장 마감 - 데이터 업데이트 중지')
```

### **Supabase 대시보드**
- Real-time 연결 상태
- API 사용량 모니터링  
- Database 성능 메트릭

---

## 🔮 **향후 확장 계획**

### **Phase 3: 고급 기능**
1. **실제 API 연동**
   - Alpha Vantage / Yahoo Finance
   - Supabase Functions로 데이터 수집
   
2. **사용자 인증**
   - Supabase Auth 활용
   - Social 로그인 (Google, GitHub)
   
3. **포트폴리오 관리**
   - 매수/매도 기능
   - 수익률 계산
   - 히스토리 추적

4. **알림 시스템**
   - 가격 알림
   - Push Notifications
   - Email 알림

---

## 🛠️ **개발 환경**

### **로컬 개발**
```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드  
npm run preview      # 빌드 미리보기
```

### **환경 변수**
```env
VITE_SUPABASE_URL=https://qehzzsxzjijfzqkysazc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

---

## 📋 **기술 스택 요약**

| 영역 | 기술 | 상태 |
|------|------|------|
| **Frontend** | React 18 + TypeScript | ✅ 완료 |
| **Build Tool** | Vite | ✅ 완료 |
| **Styling** | Tailwind CSS | ✅ 완료 |
| **Charts** | Chart.js | ✅ 완료 |
| **Database** | Supabase PostgreSQL | ✅ 완료 |
| **Realtime** | Supabase Realtime | ✅ 완료 |
| **Deployment** | Vercel | ✅ 완료 |
| **Auth** | Supabase Auth | ⏳ 계획됨 |
| **API** | External Market Data | ⏳ 계획됨 |

---

**🎯 상태: Production Ready**  
**📊 진행률: 70% 완료**  
**🚀 Next: 사용자 인증 및 실제 API 연동**

*최종 업데이트: 2025-06-23 20:10 UTC*
# 🎄 Christmas Trading - Supabase Backend Architecture

## 📅 **업데이트**: 2025-06-23 (Firebase → Supabase 완전 전환)

---

## 🏗️ **현재 아키텍처 개요**

### **Frontend: React + Vite**
- **배포**: Vercel (https://christmas-ruddy.vercel.app/)
- **프레임워크**: React 18 + TypeScript
- **차트**: Chart.js (실시간 업데이트)
- **스타일링**: Tailwind CSS

### **Backend: Supabase (PostgreSQL)**
- **데이터베이스**: PostgreSQL with Row Level Security
- **실시간**: Supabase Realtime
- **인증**: Supabase Auth (향후 구현)
- **API**: 자동 생성 REST API

---

## 📊 **데이터베이스 설계**

### **핵심 테이블 구조**

#### **1. stocks (주식 정보)**
```sql
CREATE TABLE stocks (
  symbol VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  current_price DECIMAL(10,2),
  price_change DECIMAL(10,2),
  price_change_percent DECIMAL(5,2),
  market VARCHAR(20) DEFAULT 'KOSPI',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **2. users (사용자)**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  portfolio_balance DECIMAL(15,2) DEFAULT 0.00,
  available_cash DECIMAL(15,2) DEFAULT 100000.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **3. portfolios (포트폴리오)**
```sql
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) REFERENCES stocks(symbol),
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  avg_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(15,2) GENERATED ALWAYS AS (quantity * avg_cost) STORED
);
```

---

## 🔄 **실시간 데이터 플로우**

### **현재 구현 (Mock 데이터)**
```
1. 시장시간 체크 (평일 09:00-15:00)
2. Mock 데이터 ±1% 변동 시뮬레이션
3. Chart.js 실시간 업데이트
4. 5초 간격 업데이트
```

### **향후 구현 (실제 데이터)**
```
외부 API → Supabase Functions → PostgreSQL → Realtime → React
```

---

## 🔒 **보안 모델**

### **Row Level Security (RLS)**
```sql
-- 사용자별 데이터 격리
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own portfolio" ON portfolios
  FOR ALL USING (auth.uid() = user_id);

-- 주식 데이터는 모든 사용자 조회 가능
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stocks" ON stocks
  FOR SELECT USING (true);
```

---

## 📡 **API 엔드포인트**

### **Supabase 자동 생성 REST API**
```
GET    /rest/v1/stocks              # 모든 주식 조회
GET    /rest/v1/stocks?symbol=eq.005930  # 특정 주식 조회
POST   /rest/v1/portfolios         # 포트폴리오 추가
GET    /rest/v1/portfolios?user_id=eq.{userId}  # 사용자 포트폴리오
```

### **실시간 구독**
```javascript
supabase
  .channel('stocks_channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public', 
    table: 'stocks'
  }, callback)
  .subscribe()
```

---

## 🚀 **배포 및 인프라**

### **현재 스택**
- **Frontend**: Vercel (CDN + Edge Functions)
- **Database**: Supabase (Multi-region PostgreSQL)
- **Static Assets**: Vercel Edge Network
- **Environment**: Production-ready

### **성능 최적화**
```javascript
// 1. 차트 업데이트 최적화
chart.update('none') // 애니메이션 없이 즉시 업데이트

// 2. 메모리 관리
useEffect(() => {
  return () => {
    chart.destroy()
    subscription.unsubscribe()
  }
}, [])

// 3. 번들 최적화
// Dynamic imports for market hours logic
const { getMarketStatus } = await import('./marketHours')
```

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
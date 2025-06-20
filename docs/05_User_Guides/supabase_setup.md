# Christmas 프로젝트 - Supabase 통합 가이드

## 📋 개요

Christmas Trading 프로젝트를 Supabase를 활용한 완전한 클라우드 기반 시스템으로 전환하는 방법을 설명합니다. 무료 플랜만을 사용하여 PostgreSQL 데이터베이스, 실시간 인증, API 자동 생성 등의 기능을 구현합니다.

## 🎯 Supabase 선택 이유

### 장점
```yaml
무료 플랜 혜택:
  - PostgreSQL 데이터베이스: 500MB
  - API 요청: 500,000회/월
  - 실시간 구독: 무제한
  - 인증 사용자: 50,000명
  - 스토리지: 1GB
  - Edge Functions: 500,000회/월

기술적 장점:
  - 자동 REST API 생성
  - 실시간 구독 (WebSocket)
  - Row Level Security (RLS)
  - 내장 인증 시스템
  - 파일 스토리지
  - Edge Functions (Deno)
```

### 기존 MongoDB 대비 장점
- **타입 안정성**: PostgreSQL의 강력한 타입 시스템
- **ACID 트랜잭션**: 데이터 일관성 보장
- **복잡한 쿼리**: JOIN 및 고급 SQL 지원
- **확장성**: 수직/수평 확장 용이
- **실시간 기능**: 내장 실시간 구독

## 🚀 Supabase 프로젝트 설정

### 1. 계정 생성 및 프로젝트 초기화

```bash
# 1. https://supabase.com 에서 계정 생성
# 2. 새 프로젝트 생성
#    - 프로젝트명: christmas-trading
#    - 데이터베이스 비밀번호: 강력한 비밀번호 설정
#    - 리전: Northeast Asia (서울/도쿄)

# 3. 프로젝트 URL 및 API 키 확인
# 예시:
# URL: https://your-project-ref.supabase.co
# Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. 환경변수 설정

```bash
# web-dashboard/.env 파일 생성
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_NODE_ENV=development
VITE_APP_URL=http://localhost:3000
```

### 3. 클라이언트 라이브러리 설치

```bash
cd web-dashboard
npm install @supabase/supabase-js
```

## 🗄️ 데이터베이스 스키마 설정

### 1. SQL 에디터에서 스키마 실행

Supabase 대시보드의 SQL Editor에서 `supabase/schema.sql` 파일의 내용을 실행합니다.

```sql
-- 주요 테이블 구조
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  membership_type TEXT NOT NULL DEFAULT 'free',
  free_trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  personal_referral_code TEXT UNIQUE,
  -- ... 기타 필드들
);

CREATE TABLE public.referral_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE CHECK (LENGTH(code) = 8),
  -- ... 기타 필드들
);

-- RLS 정책 설정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);
```

### 2. 스키마 검증

```sql
-- 테이블 목록 확인
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- 사용자 테이블 구조 확인
\d public.users

-- RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies WHERE schemaname = 'public';
```

## 🔐 Authentication 설정

### 1. 인증 설정 구성

```javascript
// web-dashboard/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

### 2. 이메일 인증 설정

Supabase 대시보드 > Authentication > Settings에서:

```yaml
Email Settings:
  - Enable email confirmations: ON
  - Email confirmation redirect URL: http://localhost:3000
  - Confirm email template: 커스터마이징 (선택사항)

Site URL:
  - Site URL: http://localhost:3000
  - Additional redirect URLs: 
    - https://christmas-trading.netlify.app
    - https://your-domain.com (프로덕션 도메인)
```

### 3. 소셜 로그인 설정 (선택사항)

```yaml
OAuth Providers:
  Google:
    - Client ID: Google Console에서 발급
    - Client Secret: Google Console에서 발급
    - Redirect URL: https://your-project-ref.supabase.co/auth/v1/callback
  
  GitHub:
    - Client ID: GitHub OAuth App에서 발급
    - Client Secret: GitHub OAuth App에서 발급
```

## 🔌 API 연동

### 1. 기본 CRUD 작업

```javascript
// 사용자 프로필 조회
const { data: user, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()

// 사용자 프로필 업데이트
const { data, error } = await supabase
  .from('users')
  .update({ first_name: 'New Name' })
  .eq('id', userId)
  .select()

// 초대 코드 검증
const { data: referralCode, error } = await supabase
  .from('referral_codes')
  .select(`
    *,
    users:user_id (
      first_name,
      last_name,
      membership_type
    )
  `)
  .eq('code', code)
  .eq('is_active', true)
  .single()
```

### 2. 실시간 구독

```javascript
// 포트폴리오 실시간 업데이트
const subscription = supabase
  .channel('portfolio_updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'trade_records',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('거래 기록 업데이트:', payload)
    // 포트폴리오 UI 업데이트
  })
  .subscribe()

// 정리
return () => {
  subscription.unsubscribe()
}
```

### 3. Edge Functions 연동

```javascript
// 회원가입 후처리
const { data, error } = await supabase.functions.invoke('auth-handler', {
  body: {
    action: 'signup-complete',
    userId: user.id,
    email: user.email,
    firstName: formData.firstName,
    lastName: formData.lastName,
    referralCode: formData.referralCode
  }
})

// 초대 코드 검증
const { data, error } = await supabase.functions.invoke('auth-handler', {
  body: {
    action: 'validate-referral',
    code: referralCode
  }
})
```

## 🛡️ 보안 설정

### 1. Row Level Security (RLS) 정책

```sql
-- 사용자는 자신의 데이터만 조회/수정
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 관리자는 모든 데이터 접근 가능
CREATE POLICY "Admins can view all users" ON public.users
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- 공개 쿠폰은 모든 사용자가 조회 가능
CREATE POLICY "Anyone can view public coupons" ON public.coupons
  FOR SELECT USING (is_active = TRUE AND is_public = TRUE);
```

### 2. API 키 관리

```javascript
// 환경별 API 키 관리
const getSupabaseConfig = () => {
  const isDevelopment = import.meta.env.MODE === 'development'
  
  return {
    url: isDevelopment 
      ? import.meta.env.VITE_SUPABASE_URL 
      : import.meta.env.VITE_SUPABASE_URL,
    anonKey: isDevelopment 
      ? import.meta.env.VITE_SUPABASE_ANON_KEY 
      : import.meta.env.VITE_SUPABASE_ANON_KEY
  }
}

// 민감한 작업은 Edge Functions 사용
const sensitiveOperation = async (data) => {
  return await supabase.functions.invoke('secure-operation', {
    body: data,
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })
}
```

### 3. 데이터 암호화

```sql
-- API 키 암호화 저장
CREATE OR REPLACE FUNCTION encrypt_api_key(api_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    encrypt(
      api_key::bytea, 
      'encryption_key'::bytea, 
      'aes'
    ), 
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용 예시
UPDATE users 
SET binance_api_key = encrypt_api_key('user_api_key')
WHERE id = user_id;
```

## 🔄 데이터 마이그레이션

### 1. MongoDB에서 PostgreSQL로 데이터 이전

```javascript
// migration/migrate-users.js
const { MongoClient } = require('mongodb')
const { createClient } = require('@supabase/supabase-js')

const mongoUrl = 'mongodb://localhost:27017/christmas_trading'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateUsers() {
  const mongoClient = new MongoClient(mongoUrl)
  await mongoClient.connect()
  
  const db = mongoClient.db()
  const users = await db.collection('users').find({}).toArray()
  
  for (const user of users) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: user._id.toString(),
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        membership_type: user.membershipType,
        created_at: user.createdAt
      })
    
    if (error) {
      console.error('Migration error:', error)
    } else {
      console.log('Migrated user:', user.email)
    }
  }
  
  await mongoClient.close()
}
```

### 2. 배치 처리로 대량 데이터 이전

```javascript
async function batchMigration(collection, transformer, batchSize = 100) {
  const totalCount = await db.collection(collection).countDocuments()
  const batches = Math.ceil(totalCount / batchSize)
  
  for (let i = 0; i < batches; i++) {
    const skip = i * batchSize
    const documents = await db.collection(collection)
      .find({})
      .skip(skip)
      .limit(batchSize)
      .toArray()
    
    const transformedData = documents.map(transformer)
    
    const { data, error } = await supabase
      .from(collection)
      .insert(transformedData)
    
    if (error) {
      console.error(`Batch ${i + 1} failed:`, error)
    } else {
      console.log(`Batch ${i + 1}/${batches} completed`)
    }
  }
}
```

## 📊 모니터링 및 분석

### 1. Supabase 대시보드 활용

```yaml
Dashboard Metrics:
  - Database Usage: 용량 및 연결 수 모니터링
  - API Requests: 요청 수 및 응답 시간 추적
  - Auth Users: 가입자 수 및 인증 통계
  - Storage Usage: 파일 스토리지 사용량
  - Realtime Connections: 실시간 연결 수

Alert Settings:
  - 무료 플랜 한도 80% 도달 시 알림
  - API 에러율 5% 초과 시 알림
  - 데이터베이스 응답 시간 1초 초과 시 알림
```

### 2. 커스텀 메트릭 수집

```javascript
// 사용량 추적
const trackApiUsage = async (endpoint, duration) => {
  await supabase
    .from('api_usage_logs')
    .insert({
      endpoint,
      duration,
      timestamp: new Date(),
      user_id: auth.user?.id
    })
}

// 에러 로깅
const logError = async (error, context) => {
  await supabase
    .from('error_logs')
    .insert({
      error_message: error.message,
      error_stack: error.stack,
      context: JSON.stringify(context),
      user_id: auth.user?.id,
      timestamp: new Date()
    })
}
```

## 🚀 배포 및 프로덕션 설정

### 1. 환경별 설정 분리

```bash
# 개발 환경 (.env.development)
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev-anon-key

# 프로덕션 환경 (.env.production)
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-anon-key
```

### 2. Netlify 환경변수 설정

```bash
# Netlify Dashboard > Site settings > Environment variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_NODE_ENV=production
VITE_APP_URL=https://christmas-trading.netlify.app
```

### 3. 도메인 및 CORS 설정

```yaml
Supabase Dashboard > Authentication > Settings:
  Site URL: https://christmas-trading.netlify.app
  Additional redirect URLs:
    - https://christmas-trading.netlify.app
    - https://your-custom-domain.com
    
  CORS:
    - https://christmas-trading.netlify.app
    - https://your-custom-domain.com
    - http://localhost:3000 (개발용)
```

## 🔧 최적화 및 성능 튜닝

### 1. 쿼리 최적화

```javascript
// 효율적인 쿼리 작성
const { data, error } = await supabase
  .from('users')
  .select(`
    id,
    first_name,
    last_name,
    membership_type,
    referral_codes!inner (
      code,
      expires_at
    )
  `)
  .eq('referral_codes.is_active', true)
  .limit(10)

// 인덱스 활용
// SQL Editor에서 실행:
CREATE INDEX idx_users_membership_type ON users(membership_type);
CREATE INDEX idx_referral_codes_active ON referral_codes(is_active, expires_at);
```

### 2. 실시간 구독 최적화

```javascript
// 필터를 사용한 효율적인 구독
const subscription = supabase
  .channel(`user_${userId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'users',
    filter: `id=eq.${userId}`
  }, handleUserUpdate)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'trade_records',
    filter: `user_id=eq.${userId}`
  }, handleNewTrade)
  .subscribe()
```

### 3. 캐싱 전략

```javascript
// React Query와 함께 사용
import { useQuery } from '@tanstack/react-query'

const useUserProfile = (userId) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => supabaseHelpers.getUserProfile(userId),
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 10 * 60 * 1000, // 10분
    refetchOnWindowFocus: false
  })
}

// 로컬 스토리지 캐싱
const cachedQuery = async (key, fetcher, ttl = 5 * 60 * 1000) => {
  const cached = localStorage.getItem(key)
  if (cached) {
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < ttl) {
      return data
    }
  }
  
  const data = await fetcher()
  localStorage.setItem(key, JSON.stringify({
    data,
    timestamp: Date.now()
  }))
  
  return data
}
```

## 🆘 트러블슈팅

### 1. 일반적인 문제들

```yaml
인증 문제:
  증상: "Invalid API key" 에러
  해결: API 키 확인, 환경변수 설정 재확인
  
RLS 정책 문제:
  증상: "permission denied" 에러  
  해결: RLS 정책 확인, 사용자 권한 검증
  
실시간 구독 문제:
  증상: 실시간 업데이트 작동 안함
  해결: 구독 필터 확인, 네트워크 연결 상태 확인

API 제한 문제:
  증상: "quota exceeded" 에러
  해결: 사용량 확인, 쿼리 최적화, 캐싱 적용
```

### 2. 디버깅 도구

```javascript
// 쿼리 디버깅
const debugQuery = async (query) => {
  console.log('Query:', query)
  const start = Date.now()
  const result = await query
  const duration = Date.now() - start
  console.log('Result:', result)
  console.log('Duration:', duration, 'ms')
  return result
}

// 실시간 구독 디버깅
const debugSubscription = supabase
  .channel('debug')
  .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
    console.log('Realtime event:', payload)
  })
  .subscribe((status) => {
    console.log('Subscription status:', status)
  })
```

## 📈 다음 단계

1. **Edge Functions 개발**: 복잡한 비즈니스 로직 구현
2. **파일 스토리지 활용**: 프로필 이미지, 문서 업로드
3. **실시간 채팅**: 사용자 간 커뮤니케이션
4. **고급 인증**: MFA, SSO 연동
5. **데이터 분석**: 대시보드 및 리포트 생성

---

**완료 체크리스트:**
- ✅ Supabase 프로젝트 생성
- ✅ 데이터베이스 스키마 설정
- ✅ RLS 정책 구성
- ✅ 클라이언트 연동
- ✅ 인증 시스템 구현
- ✅ API 연동 완료
- ✅ 실시간 기능 구현
- ✅ 보안 설정 완료
- ✅ 배포 환경 구성 
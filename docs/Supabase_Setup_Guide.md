# 🎄 Christmas Trading Supabase 설정 가이드

## 📋 개요
이 문서는 Christmas Trading 프로젝트의 Supabase 데이터베이스 설정을 위한 단계별 가이드입니다.

## 🎯 **긴급 작업 - 테이블 생성 필요**

### ⚠️ 현재 상황
- **문제**: 백엔드 서버 연결 실패 (타임아웃)
- **원인**: Supabase 테이블이 생성되지 않아 API 오류 발생
- **해결**: 아래 SQL 스크립트를 Supabase에서 실행 필요

## 🔧 1단계: Supabase 대시보드 접속

1. **Supabase 대시보드 접속**: https://supabase.com/dashboard
2. **프로젝트 선택**: `qehzzsxzjijfzqkysazc` (Christmas Trading)
3. **SQL Editor 메뉴 클릭**

## 📝 2단계: 테이블 생성 SQL 실행

### 🚀 **즉시 실행 필요한 SQL 스크립트**

**파일 위치**: `scripts/create-supabase-tables.sql`

**실행 방법**:
1. Supabase SQL Editor에서 "New query" 클릭
2. 아래 스크립트 전체를 복사하여 붙여넣기
3. "Run" 버튼 클릭하여 실행

### 📊 생성될 테이블 목록

| 테이블명 | 설명 | 주요 컬럼 |
|---------|------|----------|
| `users` | 사용자 정보 | id, email, password, tier |
| `coupons` | 할인 쿠폰 | code, discount_type, discount_value |
| `coupon_usage` | 쿠폰 사용 내역 | coupon_id, user_id, used_at |
| `referral_codes` | 리퍼럴 코드 | code, owner_id, usage_count |
| `referral_rewards` | 리퍼럴 보상 | referrer_id, reward_amount, status |
| `trading_orders` | 거래 주문 | user_id, stock_code, order_type |
| `user_sessions` | 사용자 세션 | user_id, session_token, expires_at |

## 🔐 3단계: RLS (Row Level Security) 확인

테이블 생성 후 다음 RLS 정책이 자동으로 적용됩니다:

- ✅ 사용자는 자신의 데이터만 조회/수정 가능
- ✅ 거래 주문은 본인 것만 접근 가능
- ✅ 세션 관리 보안 정책 적용

## 🧪 4단계: 테이블 생성 확인

SQL 실행 후 다음 쿼리로 확인:

```sql
-- 생성된 테이블 목록 확인
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'coupons', 'coupon_usage', 'referral_codes', 'referral_rewards', 'trading_orders', 'user_sessions')
ORDER BY table_name;
```

**예상 결과**: 7개 테이블이 모두 표시되어야 함

## 🌐 5단계: 백엔드 서버 재시작

테이블 생성 완료 후:

1. **서버 재시작 필요** (Docker 컨테이너)
2. **API 테스트 재실행**
3. **프론트엔드 연결 확인**

## 📱 6단계: 프론트엔드 테스트

1. **Netlify 사이트 접속**: https://christmas-protocol.netlify.app/
2. **회원가입/로그인 테스트**
3. **데모 모드 테스트**

## 🚨 문제 해결

### 일반적인 오류들

| 오류 | 원인 | 해결방법 |
|------|------|----------|
| `relation does not exist` | 테이블 미생성 | SQL 스크립트 재실행 |
| `permission denied` | RLS 정책 문제 | 정책 확인 및 재설정 |
| `connection timeout` | 네트워크 문제 | 서버 상태 확인 |

### 🔍 디버깅 쿼리

```sql
-- 1. 테이블 존재 확인
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- 3. 인덱스 확인
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';
```

## 📞 지원

문제 발생 시:
1. **SQL 실행 로그 확인**
2. **에러 메시지 복사**
3. **테이블 생성 상태 확인**

---

## ⏰ 작업 우선순위

### 🔥 **즉시 실행 (5분 내)**
1. ✅ Supabase SQL Editor에서 `create-supabase-tables.sql` 실행
2. ✅ 테이블 생성 확인 쿼리 실행

### 🚀 **단기 작업 (30분 내)**
1. 백엔드 서버 상태 확인
2. API 연결 테스트
3. 프론트엔드 배포 업데이트

### 📈 **중기 작업 (1시간 내)**
1. 전체 시스템 통합 테스트
2. 사용자 플로우 검증
3. 성능 최적화

---

**⚡ 긴급도**: 최우선 (시스템 전체가 이 작업에 의존)
**📅 작성일**: 2025-05-26
**🔄 업데이트**: 실시간 진행 상황 반영 
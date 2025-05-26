# 📚 Christmas Trading RAG 지식 베이스

## 🎯 개요
이 문서는 Christmas Trading 프로젝트의 모든 기술적 지식, 비즈니스 로직, 문제 해결 방법을 체계적으로 정리한 지식 베이스입니다.

## 🏗️ 시스템 아키텍처

### 전체 구조
```
Frontend (React) → Backend (Node.js) → Database (Supabase PostgreSQL)
     ↓                    ↓                        ↓
  Netlify            31.220.83.213              Supabase Cloud
```

### 기술 스택
- **프론트엔드**: React 18, Zustand, TailwindCSS, Vite
- **백엔드**: Node.js, Express.js, JWT, bcrypt
- **데이터베이스**: Supabase (PostgreSQL)
- **배포**: Netlify (Frontend), Docker (Backend)
- **인증**: Supabase Auth + JWT
- **실시간**: WebSocket

## 🗄️ 데이터베이스 스키마

### 핵심 테이블
1. **users**: 사용자 정보 및 인증
2. **coupons**: 쿠폰 시스템
3. **coupon_usage**: 쿠폰 사용 내역
4. **referral_codes**: 리퍼럴 코드
5. **referral_rewards**: 리퍼럴 보상
6. **trading_orders**: 거래 주문
7. **user_sessions**: 사용자 세션

### 주요 관계
- users ← referral_codes (1:N)
- users ← trading_orders (1:N)
- coupons ← coupon_usage (1:N)
- users ← coupon_usage (1:N)

## 🔐 인증 시스템

### 인증 플로우
1. **회원가입**: email + password → Supabase Auth
2. **로그인**: JWT 토큰 발급
3. **토큰 검증**: 모든 API 요청 시 검증
4. **세션 관리**: user_sessions 테이블

### 환경변수
```env
SUPABASE_URL=https://qehzzsxzjijfzqkysazc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=[실제 서비스 키]
JWT_SECRET=christmas-trading-jwt-secret-key-2024-very-long-and-secure
```

## 🚀 API 엔드포인트

### 인증 API
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/verify` - 토큰 검증

### 사용자 API
- `GET /api/users/profile` - 프로필 조회
- `PUT /api/users/profile` - 프로필 수정
- `GET /api/users/tier` - 회원등급 조회

### 거래 API
- `POST /api/trading/order` - 주문 생성
- `GET /api/trading/orders` - 주문 내역
- `GET /api/trading/balance` - 잔고 조회

### 시스템 API
- `GET /api/health` - 헬스 체크
- `GET /api/database-status` - DB 상태
- `GET /api/websocket-status` - WebSocket 상태

## 🎁 비즈니스 로직

### 쿠폰 시스템
```javascript
// 쿠폰 검증 로직
const validateCoupon = (coupon, orderAmount) => {
  if (!coupon.is_active) return false;
  if (new Date() > new Date(coupon.valid_until)) return false;
  if (orderAmount < coupon.min_order_amount) return false;
  if (coupon.used_count >= coupon.usage_limit) return false;
  return true;
};
```

### 리퍼럴 시스템
```javascript
// 리퍼럴 보상 계산
const calculateReferralReward = (referralType, orderAmount) => {
  const rewards = {
    signup: 10000,
    first_order: orderAmount * 0.05,
    milestone: 50000
  };
  return rewards[referralType] || 0;
};
```

### 회원등급 시스템
```javascript
// 회원등급 계산
const calculateUserTier = (totalOrders, totalAmount) => {
  if (totalAmount >= 10000000) return 'diamond';
  if (totalAmount >= 5000000) return 'platinum';
  if (totalAmount >= 1000000) return 'gold';
  if (totalAmount >= 500000) return 'silver';
  return 'basic';
};
```

## 🔧 개발 환경 설정

### 로컬 개발
```bash
# 백엔드 실행
cd backend
npm install
npm run dev

# 프론트엔드 실행
cd frontend
npm install
npm run dev
```

### Docker 배포
```bash
# 이미지 빌드
docker build -t christmas-backend-production .

# 컨테이너 실행
docker run -d --name christmas-backend-production \
  -p 8000:8000 \
  --env-file .env.docker \
  --restart unless-stopped \
  christmas-backend-production
```

## 🐛 문제 해결 가이드

### 자주 발생하는 오류

#### 1. "Invalid API key" 오류
**원인**: SUPABASE_SERVICE_KEY 미설정 또는 잘못된 키
**해결**: 
1. `.env` 파일에서 SUPABASE_SERVICE_KEY 확인
2. Supabase 대시보드에서 올바른 Service Role Key 복사
3. 백엔드 서버 재시작

#### 2. Health Check 404 오류
**원인**: 백엔드 서버 다운 또는 라우트 문제
**해결**:
1. Docker 컨테이너 상태 확인: `docker ps`
2. 컨테이너 로그 확인: `docker logs christmas-backend-production`
3. 필요시 컨테이너 재시작

#### 3. Signup API 500 오류
**원인**: Supabase 테이블 미생성
**해결**:
1. Supabase 대시보드에서 테이블 존재 확인
2. `scripts/create-supabase-tables.sql` 실행
3. 백엔드 서버 재시작

#### 4. CORS 오류
**원인**: 허용되지 않은 Origin에서 요청
**해결**:
1. `backend/server.js`에서 allowedOrigins 확인
2. 프론트엔드 URL 추가
3. 서버 재시작

### 디버깅 명령어
```bash
# 백엔드 로그 확인
docker logs -f christmas-backend-production

# 컨테이너 내부 접속
docker exec -it christmas-backend-production /bin/bash

# 환경변수 확인
docker exec christmas-backend-production env | grep SUPABASE

# 네트워크 연결 테스트
curl -X GET http://31.220.83.213:8000/api/health
```

## 📊 성능 최적화

### 데이터베이스 최적화
- 인덱스 활용: email, username, referral_code
- 쿼리 최적화: JOIN 대신 서브쿼리 사용
- 연결 풀링: Supabase 자동 관리

### API 최적화
- 레이트 리밋: 15분당 100 요청
- 응답 캐싱: 정적 데이터 캐시
- 압축: gzip 압축 활성화

### 프론트엔드 최적화
- 코드 스플리팅: React.lazy 사용
- 이미지 최적화: WebP 형식 사용
- 번들 최적화: Vite 빌드 최적화

## 🔒 보안 가이드라인

### 인증 보안
- JWT 토큰 만료 시간: 24시간
- 비밀번호 해싱: bcrypt (10 rounds)
- 세션 관리: 자동 만료 및 정리

### API 보안
- HTTPS 강제 사용
- CORS 정책 엄격 적용
- 입력 데이터 검증 및 새니타이징
- SQL 인젝션 방지: Parameterized Query

### 환경변수 보안
- 민감한 정보 .env 파일 관리
- 프로덕션 환경 별도 키 사용
- 정기적인 키 로테이션

## 📈 모니터링 및 로깅

### 로그 레벨
- **ERROR**: 시스템 오류
- **WARN**: 경고 사항
- **INFO**: 일반 정보
- **DEBUG**: 디버깅 정보

### 모니터링 지표
- API 응답 시간
- 에러율
- 동시 접속자 수
- 데이터베이스 연결 상태

## 🚀 배포 프로세스

### 프론트엔드 배포 (Netlify)
1. GitHub 푸시
2. Netlify 자동 빌드
3. 배포 완료 확인

### 백엔드 배포 (Docker)
1. 코드 변경 사항 서버 복사
2. Docker 이미지 재빌드
3. 컨테이너 재시작
4. 헬스 체크 확인

## 📚 참조 문서

### 외부 문서
- [Supabase 공식 문서](https://supabase.com/docs)
- [Express.js 가이드](https://expressjs.com/ko/guide/)
- [React 공식 문서](https://react.dev/)
- [JWT 토큰 가이드](https://jwt.io/introduction)

### 내부 문서
- `docs/Project_Architecture.md` - 시스템 아키텍처
- `docs/Database_Schema.md` - 데이터베이스 스키마
- `docs/API_Documentation.md` - API 명세서
- `docs/WBS_Christmas_Trading_Migration.md` - 프로젝트 WBS

## 🔄 업데이트 이력

### 2025-05-26
- RAG 지식 베이스 초기 생성
- 시스템 아키텍처 정리
- 문제 해결 가이드 추가
- 보안 가이드라인 정의

---
**마지막 업데이트**: 2025-05-26 17:30
**담당자**: PM
**다음 업데이트 예정**: Phase 2 완료 후 
# 환경 변수 설정 가이드

## 📌 개요
Christmas Trading 시스템의 프론트엔드와 백엔드에서 필요한 환경 변수들을 설정하는 가이드입니다.

## 🗂️ 파일 구조
```
christmas/
├── web-dashboard/.env          # 프론트엔드 환경 변수
└── backend/.env               # 백엔드 환경 변수
```

## 🎨 프론트엔드 환경 변수 설정

### `web-dashboard/.env` 파일 생성
```bash
# Christmas Trading Frontend 환경 변수

# 🌍 기본 설정
VITE_NODE_ENV=development
VITE_APP_NAME=Christmas Trading
VITE_APP_VERSION=2.0.0
VITE_APP_URL=http://localhost:3000

# 📊 Supabase 설정
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# 📈 KIS API 설정 (프론트엔드용 - 선택사항)
VITE_KIS_MOCK_MODE=true
VITE_KIS_ACCOUNT_NUMBER=50123456-01

# 🎯 기능 플래그
VITE_ENABLE_DEMO_MODE=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_REAL_TRADING=false
VITE_ENABLE_KIS_API=true

# 💳 결제 시스템 (향후 구현)
VITE_TOSS_PAYMENTS_CLIENT_KEY=test_ck_your-client-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key

# 🔧 개발 설정
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_DEV_TOOLS=true
```

## 🛠️ 백엔드 환경 변수 설정

### `backend/.env` 파일 생성
```bash
# Christmas Trading Backend 환경 변수

# 🌍 기본 서버 설정
NODE_ENV=development
PORT=8000
CLIENT_URL=http://localhost:3000

# 🔒 보안 설정
JWT_SECRET=your-jwt-secret-key-here-make-it-long-and-random
BCRYPT_ROUNDS=10

# 📊 Supabase 설정 (필수)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# 📈 KIS API 설정 (한국투자증권 - 필수)
# 모의투자 환경 (개발/테스트용)
KIS_MOCK_MODE=true
KIS_DEMO_APP_KEY=DEMO-your-demo-app-key
KIS_DEMO_APP_SECRET=your-demo-app-secret

# 실전투자 환경 (운영용 - 주의!)
KIS_REAL_APP_KEY=P-your-real-app-key
KIS_REAL_APP_SECRET=your-real-app-secret

# 계좌 정보
KIS_ACCOUNT_NUMBER=50123456-01

# ⚡ 성능 및 보안 설정
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 📧 이메일 설정 (선택사항)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-app-password

# 💳 결제 시스템 설정 (향후 구현)
TOSS_PAYMENTS_CLIENT_KEY=test_ck_your-client-key
TOSS_PAYMENTS_SECRET_KEY=test_sk_your-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret

# 📱 알림 설정 (선택사항)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
DISCORD_WEBHOOK_URL=your-discord-webhook-url

# 🔧 개발 도구 설정
LOG_LEVEL=info
ENABLE_CORS=true
ENABLE_HELMET=true
ENABLE_RATE_LIMIT=true

# 📊 모니터링 설정 (선택사항)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
AMPLITUDE_API_KEY=your-amplitude-key
```

## 🔑 주요 설정 항목 상세 설명

### 1. Supabase 설정 (필수)
```bash
# Supabase 대시보드 > Settings > API에서 확인
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. KIS API 설정 (필수)
```bash
# KIS Developers에서 발급 받은 키
KIS_DEMO_APP_KEY=DEMO-PSxxxxxxxxxxxxxxxxxxxxxxxx
KIS_DEMO_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
KIS_REAL_APP_KEY=P-xxxxxxxxxxxxxxxxxxxxxxxx
KIS_REAL_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
KIS_ACCOUNT_NUMBER=50123456-01
```

### 3. 보안 설정
```bash
# JWT 시크릿 키 (무작위 문자열, 최소 32자 이상)
JWT_SECRET=your-very-long-and-random-jwt-secret-key-here-change-this

# 해싱 라운드 (기본값: 10)
BCRYPT_ROUNDS=10
```

## 🚀 설정 순서

### 1단계: 기본 환경 변수 설정
1. **프론트엔드 `.env` 파일 생성**
   ```bash
   cd web-dashboard
   cp .env.example .env  # 예시 파일이 있다면
   # 또는 직접 생성
   ```

2. **백엔드 `.env` 파일 생성**
   ```bash
   cd backend
   # 직접 .env 파일 생성 및 편집
   ```

### 2단계: Supabase 설정 (필수)
1. [Supabase 대시보드](https://supabase.com) 접속
2. **Settings > API**에서 다음 정보 복사:
   - Project URL
   - anon public key
   - service_role key (백엔드에만 사용)

### 3단계: KIS API 설정 (실거래 연동용)
1. [KIS Developers](https://apiportal.koreainvestment.com) 가입
2. 모의투자 앱 생성하여 테스트 키 발급
3. 충분한 테스트 후 실전투자 키 발급

### 4단계: 보안 키 생성
```bash
# JWT 시크릿 키 생성 예시 (Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 또는 온라인 도구 사용
# https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
```

## ⚠️ 보안 주의사항

### 🚨 절대 금지 사항
- ❌ GitHub에 `.env` 파일 커밋하지 마세요
- ❌ service_role 키를 프론트엔드에서 사용하지 마세요
- ❌ 실전투자 키를 개발 환경에서 사용하지 마세요
- ❌ API 키를 로그에 출력하지 마세요

### ✅ 권장 사항
- 🔐 강력한 JWT 시크릿 키 사용
- 🔄 정기적인 API 키 갱신
- 🏗️ 환경별 키 분리 (개발/스테이징/운영)
- 📝 키 관리 내역 기록

## 🧪 설정 테스트

### 프론트엔드 테스트
```bash
cd web-dashboard
npm run dev
# 브라우저에서 http://localhost:3000 접속 확인
```

### 백엔드 테스트
```bash
cd backend
npm run dev
# http://localhost:8000/health 확인
# http://localhost:8000/api/kis/status 확인
```

## ✅ **테스트 완료 상태 (2024-12-25)**

### 성공적으로 완료된 테스트:
- ✅ **백엔드 서버**: 포트 8000에서 정상 실행
- ✅ **프론트엔드 서버**: 포트 3000에서 정상 실행  
- ✅ **헬스 체크**: `/health` API 정상 응답
- ✅ **Supabase 연결**: 데이터베이스 정상 연결
- ✅ **환경 변수**: 모든 필수 설정 완료

### 테스트 결과:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-25T07:33:22.349Z",
  "uptime": 960.842548,
  "database": "supabase-connected",
  "mode": "production"
}
```

## 🔧 문제 해결

### 자주 발생하는 오류들

#### 1. Supabase 연결 오류
```
Error: Invalid Supabase URL or API key
```
**해결책**: Supabase 대시보드에서 URL과 키 재확인

#### 2. KIS API 인증 오류
```
Error: KIS API 토큰 발급 실패
```
**해결책**: 
- KIS API 키 형식 확인
- 모의투자/실전투자 모드 확인
- KIS 개발자 포털에서 키 상태 확인

#### 3. CORS 오류
```
Access to fetch blocked by CORS policy
```
**해결책**: 백엔드 `CLIENT_URL` 설정 확인

## 📚 관련 문서
- [Supabase 프로젝트 설정 가이드](./41.%20Supabase%20프로젝트%20설정%20가이드.md)
- [KIS API 실거래 연동 가이드](./42.%20KIS%20API%20실거래%20연동%20가이드.md)

---

**모든 환경 변수 설정이 완료되면 시스템이 정상적으로 작동합니다.** 🎉 
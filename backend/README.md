# 🎄 Christmas Trading Backend

고성능 Node.js + Express 기반의 크리스마스 트레이딩 플랫폼 백엔드 API

## 📋 **기술 스택**

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Cache**: Redis
- **Authentication**: Firebase Auth
- **Market Data**: Alpha Vantage API
- **Deployment**: Docker + Docker Compose

## 🚀 **빠른 시작**

### **1. 환경 설정**

```bash
# 환경 변수 파일 생성
cp .env.example .env

# 환경 변수 편집
nano .env
```

### **2. Firebase 설정**

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Firestore Database 활성화
3. Authentication 활성화 (Google, Email/Password)
4. 프로젝트 설정 > 서비스 계정 > 새 비공개 키 생성
5. 다운로드한 JSON 파일을 `firebase-service-account.json`으로 저장

### **3. Alpha Vantage API 키 설정**

1. [Alpha Vantage](https://www.alphavantage.co/support/#api-key)에서 무료 API 키 발급
2. `.env` 파일에 `ALPHA_VANTAGE_API_KEY` 설정

### **4. Docker로 실행**

```bash
# Docker 이미지 빌드 및 실행
npm run docker:build
npm run docker:up

# 로그 확인
npm run docker:logs

# 중지
npm run docker:down
```

### **5. 개발 모드 실행**

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

## 📡 **API 엔드포인트**

### **인증 (Authentication)**

```http
POST /api/auth/verify
Content-Type: application/json

{
  "idToken": "firebase_id_token"
}
```

### **시장 데이터 (Market Data)**

```http
# 주요 지수 (KOSPI, NASDAQ, S&P500)
GET /api/market/indices

# KOSPI 데이터
GET /api/market/kospi

# 개별 주식
GET /api/market/stock/AAPL

# 시장 상태
GET /api/market/status
```

### **포트폴리오 (Portfolio)**

```http
# 포트폴리오 조회
GET /api/portfolio
Authorization: Bearer <firebase_token>

# 포트폴리오 업데이트
PUT /api/portfolio
Authorization: Bearer <firebase_token>
```

### **거래 (Trading)**

```http
# 주문 생성
POST /api/trading/order
Authorization: Bearer <firebase_token>

{
  "symbol": "AAPL",
  "type": "buy",
  "quantity": 10,
  "price": "market"
}
```

## 🔧 **환경 변수**

```env
# 서버 설정
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://christmas-protocol.netlify.app

# Firebase 설정
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

# Redis 설정
REDIS_URL=redis://redis:6379

# API 키
ALPHA_VANTAGE_API_KEY=your-api-key
```

## 📊 **모니터링**

### **헬스체크**

```http
GET /health
```

### **Redis 모니터링**

Redis Commander가 포함되어 있어 `http://localhost:8081`에서 Redis 상태를 모니터링할 수 있습니다.

### **로그**

```bash
# 실시간 로그 확인
docker-compose logs -f christmas-trading-api

# 로그 파일 위치
./logs/combined.log
./logs/error.log
```

## 🔒 **보안**

- **Rate Limiting**: IP당 15분간 100회 요청 제한
- **CORS**: 허용된 도메인에서만 접근 가능
- **Helmet**: 보안 헤더 자동 설정
- **Firebase Auth**: 검증된 인증 시스템
- **Input Validation**: express-validator로 입력 검증

## 📈 **성능 최적화**

- **Redis 캐싱**: 시장 데이터 5분, 사용자 데이터 15분 캐시
- **압축**: gzip 압축 활성화
- **Connection Pooling**: Firebase 연결 풀링
- **Rate Limiting**: API 호출 제한으로 안정성 확보

## 🐳 **Docker 명령어**

```bash
# 빌드
docker-compose build

# 백그라운드 실행
docker-compose up -d

# 실시간 로그
docker-compose logs -f

# 특정 서비스 재시작
docker-compose restart christmas-trading-api

# 컨테이너 상태 확인
docker-compose ps

# 볼륨 정리
docker-compose down -v
```

## 🔧 **개발 가이드**

### **새 라우트 추가**

1. `src/routes/` 디렉터리에 라우트 파일 생성
2. `src/server.js`에 라우트 등록
3. 필요시 미들웨어나 서비스 추가

### **새 미들웨어 추가**

1. `src/middleware/` 디렉터리에 미들웨어 파일 생성
2. 해당 라우트에서 import 후 사용

### **캐시 설정**

```javascript
const { cacheMiddleware } = require('../middleware/cache');

// 300초(5분) 캐시
router.get('/data', cacheMiddleware(300), handler);
```

## 🚨 **문제 해결**

### **Firebase 연결 실패**

1. `firebase-service-account.json` 파일 확인
2. `.env` 파일의 Firebase 설정 확인
3. Firebase 프로젝트 권한 확인

### **Redis 연결 실패**

1. Redis 컨테이너 상태 확인: `docker-compose ps`
2. Redis 로그 확인: `docker-compose logs redis`
3. 네트워크 설정 확인

### **API 호출 제한**

1. Alpha Vantage API 키 확인
2. 호출 빈도 제한 (무료: 5회/분)
3. Fallback 데이터로 대체

## 📞 **지원**

- 이슈 리포팅: GitHub Issues
- 문서: `/docs` 디렉터리
- 로그: `./logs/` 디렉터리

---

**🎄 Christmas Trading Platform - Bringing festive spirit to financial markets!**
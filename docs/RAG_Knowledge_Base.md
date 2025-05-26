# 🧠 Christmas Trading RAG 지식 베이스

## 📊 프로젝트 개요

### 🎯 프로젝트 정보
- **프로젝트명**: Christmas Trading - 크리스마스 테마 주식 거래 플랫폼
- **아키텍처**: 프론트엔드(React) + 백엔드(Node.js) + 데이터베이스(Supabase)
- **배포 환경**: 
  - 프론트엔드: Netlify (https://christmas-protocol.netlify.app/)
  - 백엔드: Docker on 31.220.83.213:8000
  - 데이터베이스: Supabase PostgreSQL

### 🔧 기술 스택
- **프론트엔드**: React, Zustand, TailwindCSS, Vite
- **백엔드**: Node.js, Express.js, JWT Authentication
- **데이터베이스**: Supabase (PostgreSQL)
- **API 연동**: 한국투자증권(KIS) API
- **배포**: Docker, Netlify, Contabo VPS
- **모니터링**: Telegram Bot, Discord Webhook

## 🗂️ 프로젝트 구조

### 📁 디렉토리 구조
```
christmas/
├── backend/                 # Node.js 백엔드 서버
│   ├── .env                # 환경변수 (실제 파일)
│   ├── env.txt             # 환경변수 참조용
│   ├── package.json        # 백엔드 의존성
│   └── src/                # 백엔드 소스코드
├── web-dashboard/          # React 프론트엔드
│   ├── src/                # 프론트엔드 소스코드
│   ├── package.json        # 프론트엔드 의존성
│   └── dist/               # 빌드 결과물
├── docs/                   # PM 문서 모음
├── scripts/                # 자동화 스크립트
├── supabase/              # Supabase 설정
├── docker-compose.yml     # Docker 설정
└── netlify.toml           # Netlify 배포 설정
```

### 🔑 핵심 경로
- **백엔드 서버 경로**: `~/christmas-trading/backend/`
- **프론트엔드 경로**: `./web-dashboard/`
- **환경변수 파일**: `backend/.env` (실제), `backend/env.txt` (참조)

## 🔐 환경변수 구성

### 📋 필수 환경변수
```bash
# 기본 서버 설정
NODE_ENV=development
PORT=8000
CLIENT_URL=http://localhost:3000

# 보안 설정
JWT_SECRET=christmas-trading-jwt-secret-key-2024-very-long-and-secure
BCRYPT_ROUNDS=10

# Supabase 설정 (필수)
SUPABASE_URL=https://qehzzsxzjijfzqkysazc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=your-supabase-service-role-key  # ⚠️ 설정 필요

# KIS API 설정
KIS_MOCK_MODE=true
KIS_DEMO_APP_KEY=DEMO-your-demo-app-key
KIS_ACCOUNT_NUMBER=50123456-01
```

### ⚠️ 현재 이슈
- `SUPABASE_SERVICE_KEY`: 플레이스홀더 값으로 설정되어 있음
- 이로 인해 백엔드 서버 시작 실패

## 🗄️ 데이터베이스 스키마

### 📊 Supabase 테이블 구조
1. **users** - 사용자 정보
2. **user_profiles** - 사용자 프로필
3. **coupons** - 쿠폰 시스템
4. **coupon_usage** - 쿠폰 사용 내역
5. **referrals** - 리퍼럴 시스템
6. **user_tiers** - 회원등급
7. **trading_history** - 거래 내역

### 🔗 관계도
- users ↔ user_profiles (1:1)
- users ↔ coupon_usage (1:N)
- users ↔ referrals (1:N)
- users ↔ trading_history (1:N)

## 🚀 배포 환경

### 🌐 프론트엔드 (Netlify)
- **URL**: https://christmas-protocol.netlify.app/
- **빌드 명령**: `npm run build`
- **배포 디렉토리**: `dist/`
- **환경변수**: `netlify-production.env`

### 🐳 백엔드 (Docker)
- **서버**: 31.220.83.213:8000
- **컨테이너**: Docker Compose
- **프로젝트 경로**: `~/christmas-trading/backend/`
- **재시작 명령**: 
  ```bash
  docker-compose down
  docker-compose up -d --build
  ```

## 🔧 개발 워크플로우

### 📝 코드 수정 프로세스
1. 로컬에서 개발 및 테스트
2. Git 커밋 및 푸시
3. 백엔드: SSH로 서버 접속 → git pull → Docker 재시작
4. 프론트엔드: Netlify 자동 배포

### 🧪 테스트 전략
- **단위 테스트**: Jest
- **통합 테스트**: API 엔드포인트 테스트
- **E2E 테스트**: 프론트엔드-백엔드 연동

## 🚨 문제 해결 가이드

### 🔴 로그인 실패 문제
**증상**: "인증 실패: 네트워크 연결을 확인해주세요"
**원인**: SUPABASE_SERVICE_KEY 미설정
**해결**: 
1. Supabase 대시보드에서 service_role 키 복사
2. backend/.env 파일 업데이트
3. Docker 컨테이너 재시작

### 🔴 백엔드 서버 다운
**진단 명령**:
```powershell
Test-NetConnection -ComputerName 31.220.83.213 -Port 8000
```
**해결 단계**:
1. SSH 접속: `ssh user@31.220.83.213`
2. 프로젝트 이동: `cd ~/christmas-trading/backend`
3. 로그 확인: `docker-compose logs -f`
4. 재시작: `docker-compose restart`

## 📚 API 엔드포인트

### 🔐 인증 API
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/profile` - 프로필 조회

### 🎫 쿠폰 API
- `GET /api/coupons` - 쿠폰 목록
- `POST /api/coupons/use` - 쿠폰 사용
- `GET /api/coupons/history` - 사용 내역

### 👥 리퍼럴 API
- `POST /api/referrals/generate` - 리퍼럴 코드 생성
- `POST /api/referrals/use` - 리퍼럴 코드 사용
- `GET /api/referrals/stats` - 리퍼럴 통계

### 📈 거래 API
- `GET /api/trading/stocks` - 주식 목록
- `POST /api/trading/order` - 주문 실행
- `GET /api/trading/history` - 거래 내역

## 🔒 보안 가이드라인

### 🛡️ 환경변수 보안
- `.env` 파일은 Git에 커밋하지 않음
- 프로덕션 키는 별도 관리
- 정기적인 키 로테이션

### 🔐 API 보안
- JWT 토큰 기반 인증
- CORS 설정 적용
- Rate Limiting 구현
- Helmet.js 보안 헤더

## 📊 모니터링

### 📱 알림 시스템
- **Telegram Bot**: 시스템 알림
- **Discord Webhook**: 개발팀 알림
- **로그 수집**: 서버 로그 모니터링

### 📈 성능 메트릭
- API 응답 시간 < 500ms
- 서버 가용성 > 99.9%
- 동시 접속자 수 모니터링

## 🔄 CI/CD 파이프라인

### 🚀 자동 배포
- **프론트엔드**: Netlify 자동 배포
- **백엔드**: 수동 배포 (SSH + Docker)
- **데이터베이스**: Supabase 관리형

### 🧪 테스트 자동화
- PR 생성 시 자동 테스트
- 배포 전 통합 테스트
- 성능 테스트 자동화

## 📞 팀 협업

### 👥 역할 분담
- **PM**: 프로젝트 관리, 문서화
- **Frontend**: React 개발, UI/UX
- **Backend**: Node.js API 개발
- **DevOps**: 인프라 관리, 배포

### 📋 이슈 관리
- GitHub Issues 활용
- 라벨링 시스템 적용
- 마일스톤 기반 관리

## 🔧 개발 도구

### 💻 필수 도구
- **IDE**: VS Code, Cursor
- **API 테스트**: Postman, Thunder Client
- **DB 관리**: Supabase Dashboard
- **서버 관리**: SSH, Docker

### 📦 패키지 관리
- **Frontend**: npm, Vite
- **Backend**: npm, Express
- **의존성**: package.json 기반

---
**📅 최종 업데이트**: 2025-05-26 19:15  
**👤 작성자**: PM AI Assistant  
**🔄 버전**: v1.0  
**📊 상태**: 활성 - 지속 업데이트 중 
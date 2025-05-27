# 🎄 Christmas Trading RAG Knowledge Base (Updated 2025-05-26)

## 📋 프로젝트 개요

### 🎯 시스템 정보
- **프로젝트명**: Christmas Trading - AI 기반 자동매매 시스템
- **버전**: v2.0.0
- **개발 시작**: 2025-05-26
- **현재 상태**: Phase 2 진행 중 (백엔드 서버 복구)

### 🏗️ 아키텍처 구조
```
Frontend (Netlify)     Backend (Docker)      Database (Supabase)
├── React + Zustand    ├── Node.js + Express ├── PostgreSQL
├── Vite Build         ├── Docker Compose    ├── Real-time API
└── christmas-protocol └── 31.220.83.213     └── Authentication
    .netlify.app           :8000
```

## 🔧 기술 스택

### Frontend
- **Framework**: React 18
- **State Management**: Zustand
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI)
- **Styling**: CSS-in-JS, Emotion
- **Deployment**: Netlify (자동 배포)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Container**: Docker + Docker Compose
- **Server**: 31.220.83.213 (Contabo VPS)
- **Port**: 8000

### Database
- **Primary**: Supabase PostgreSQL
- **URL**: https://qehzzsxzjijfzqkysazc.supabase.co
- **Features**: Real-time subscriptions, Authentication, Row Level Security

### External APIs
- **Trading**: 한국투자증권(KIS) API
- **AI**: OpenAI GPT API (예정)
- **Notifications**: Telegram Bot API

## 📊 데이터베이스 스키마

### 핵심 테이블
1. **users** - 사용자 정보
2. **referral_codes** - 초대 코드
3. **referral_rewards** - 초대 보상
4. **coupons** - 쿠폰 시스템
5. **coupon_usages** - 쿠폰 사용 내역
6. **trade_records** - 거래 기록
7. **ai_learning_data** - AI 학습 데이터
8. **ai_strategy_performance** - AI 전략 성과

### 스키마 이슈
- **현재 문제**: `strategy_type` 컬럼 누락
- **해결 방안**: `scripts/fix-supabase-schema.sql` 실행 필요

## 🔐 환경변수 관리

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://qehzzsxzjijfzqkysazc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_BASE_URL=http://31.220.83.213:8000
VITE_ENABLE_DEMO_MODE=true
```

### Backend (.env)
```env
NODE_ENV=production
PORT=8000
SUPABASE_URL=https://qehzzsxzjijfzqkysazc.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key  # 🚨 수정 필요
KIS_DEMO_APP_KEY=DEMO-your-demo-app-key
KIS_DEMO_APP_SECRET=your-demo-app-secret
```

## 🚨 현재 이슈 및 해결 방안

### Critical Issues
1. **Docker 컨테이너 충돌**
   - 문제: `/christmas-backend` 이름 충돌
   - 해결: `scripts/docker-recovery.sh` 실행

2. **환경변수 플레이스홀더**
   - 문제: `SUPABASE_SERVICE_KEY=your-supabase-service-role-key`
   - 해결: Supabase Dashboard에서 실제 키 복사

3. **서버-로컬 동기화**
   - 문제: 로컬 스크립트가 서버에 없음
   - 해결: `git pull origin main` 실행

### 해결 순서
1. SSH 접속: `ssh root@31.220.83.213`
2. Git 동기화: `git pull origin main`
3. 환경변수 수정: `nano backend/.env`
4. Docker 복구: `./scripts/docker-recovery.sh`

## 📁 프로젝트 구조

### 루트 디렉토리
```
christmas/
├── web-dashboard/          # Frontend (React)
├── backend/               # Backend (Node.js)
├── scripts/              # 자동화 스크립트
├── docs/                 # 문서
├── config/               # 설정 파일
├── docker-compose.yml    # Docker 설정
└── README.md            # 프로젝트 설명
```

### Frontend 구조
```
web-dashboard/
├── src/
│   ├── components/       # React 컴포넌트
│   ├── lib/             # 유틸리티 (Supabase 등)
│   ├── stores/          # Zustand 스토어
│   └── App.jsx          # 메인 앱
├── public/              # 정적 파일
└── package.json         # 의존성
```

### Backend 구조
```
backend/
├── src/                 # 소스 코드
├── .env                 # 환경변수
├── package.json         # 의존성
└── Dockerfile          # Docker 설정
```

## 🔄 배포 프로세스

### Frontend (Netlify)
1. **자동 배포**: Git push 시 자동 트리거
2. **URL**: https://christmas-protocol.netlify.app/
3. **환경변수**: Netlify Dashboard에서 관리

### Backend (Docker)
1. **수동 배포**: 서버에서 직접 실행
2. **명령어**: `docker-compose up -d --build`
3. **포트**: 31.220.83.213:8000

## 🧪 테스트 전략

### Frontend 테스트
- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Cypress (예정)
- **Manual Tests**: 브라우저 테스트

### Backend 테스트
- **API Tests**: Postman/Insomnia
- **Health Check**: `/health` 엔드포인트
- **Integration Tests**: 데이터베이스 연결

### 테스트 체크리스트
- [ ] 로그인/회원가입 기능
- [ ] 데이터베이스 연결
- [ ] API 응답 시간
- [ ] 에러 핸들링

## 📈 성능 최적화

### Frontend 최적화
- **Code Splitting**: React.lazy()
- **Bundle Size**: Vite 최적화
- **Caching**: Service Worker (예정)

### Backend 최적화
- **Database**: 인덱스 최적화
- **API**: 응답 캐싱
- **Docker**: 멀티스테이지 빌드

## 🔒 보안 가이드라인

### 인증 및 권한
- **Authentication**: Supabase Auth
- **Authorization**: Row Level Security (RLS)
- **API Keys**: 환경변수로 관리

### 데이터 보호
- **HTTPS**: 모든 통신 암호화
- **Input Validation**: 사용자 입력 검증
- **SQL Injection**: Prepared Statements

## 🤝 비즈니스 로직

### 회원 등급 시스템
- **Guest**: 제한된 기능
- **Free**: 기본 기능
- **Premium**: 고급 기능
- **Lifetime**: 모든 기능

### 쿠폰 시스템
- **할인 타입**: 퍼센트, 고정 금액, 무료 기간
- **사용 제한**: 1회, 다회, 무제한
- **유효기간**: 시작일, 종료일

### 리퍼럴 시스템
- **초대 코드**: 고유 코드 생성
- **보상**: 초대자/피초대자 혜택
- **추적**: 초대 성과 분석

## 📊 모니터링 및 로깅

### 시스템 모니터링
- **Health Check**: 서비스 상태 확인
- **Performance**: 응답 시간 측정
- **Error Tracking**: 에러 로그 수집

### 로그 관리
- **Frontend**: 브라우저 콘솔
- **Backend**: Winston 로거 (예정)
- **Database**: Supabase 로그

## 🔧 개발 도구

### 코드 품질
- **Linting**: ESLint
- **Formatting**: Prettier
- **Type Checking**: TypeScript (예정)

### 버전 관리
- **Git**: 소스 코드 관리
- **GitHub**: 원격 저장소
- **Branching**: main 브랜치 중심

## 📚 문서화

### 기술 문서
- **API Documentation**: Swagger (예정)
- **Code Comments**: JSDoc
- **README**: 프로젝트 설명

### 사용자 문서
- **User Guide**: 사용법 안내
- **FAQ**: 자주 묻는 질문
- **Troubleshooting**: 문제 해결

## 🎯 향후 계획

### 단기 목표 (1주)
- [ ] 백엔드 서버 복구 완료
- [ ] 데이터베이스 스키마 수정
- [ ] 비즈니스 로직 복원

### 중기 목표 (1개월)
- [ ] AI 기능 구현
- [ ] 실시간 거래 연동
- [ ] 성능 최적화

### 장기 목표 (3개월)
- [ ] 모바일 앱 개발
- [ ] 고급 분석 기능
- [ ] 사용자 커뮤니티

## 🔍 트러블슈팅

### 일반적인 문제
1. **CORS 에러**: Supabase URL 확인
2. **인증 실패**: 환경변수 확인
3. **API 타임아웃**: 네트워크 상태 확인

### 해결 방법
1. **로그 확인**: 브라우저 개발자 도구
2. **환경변수**: .env 파일 검증
3. **네트워크**: ping, curl 테스트

---
**📅 최종 업데이트**: 2025-05-26 23:00  
**👤 작성자**: PM AI Assistant  
**🔄 버전**: v2.0  
**📊 상태**: 지속적 업데이트  
**📞 참조**: PM_Master_Plan_2025-05-26.md 
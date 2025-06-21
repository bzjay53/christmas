# 🎄 Christmas Trading 프로젝트 구조도 (2025-05-30)

## 📊 **전체 시스템 아키텍처**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Christmas Trading AI System                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │   Frontend      │  │   Backend       │  │   Database      │    │
│  │                 │  │                 │  │                 │    │
│  │ 🌐 Netlify      │─→│ 🐳 Docker      │─→│ 🗄️ Supabase    │    │
│  │ christmas-      │  │ 31.220.83.213  │  │ PostgreSQL      │    │
│  │ protocol.app    │  │ Ubuntu 22.04    │  │ qehzzsxzjijf... │    │
│  │                 │  │ Port 8000       │  │                 │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│           │                     │                     │             │
│           │                     │                     │             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ React + Vite    │  │ Node.js + Express│  │ Tables:         │    │
│  │ TypeScript      │  │ WebSocket       │  │ - users ✅      │    │
│  │ TailwindCSS     │  │ Auth + JWT      │  │ - ai_learning ✅│    │
│  │ Chart.js        │  │ KIS API         │  │ - ai_strategy ✅│    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## 🗂️ **프로젝트 디렉토리 구조**

```
christmas/
├── 📁 frontend (web-dashboard/)
│   ├── src/
│   │   ├── components/           # React 컴포넌트
│   │   ├── services/            # API 서비스
│   │   ├── utils/               # 유틸리티 함수
│   │   └── types/               # TypeScript 타입
│   ├── public/                  # 정적 파일
│   ├── dist/                    # 빌드 출력 (Netlify 배포)
│   └── package.json
│
├── 📁 backend/
│   ├── routes/                  # API 라우트
│   │   ├── auth.js             # 인증 API
│   │   ├── trading.js          # 거래 API
│   │   ├── users.js            # 사용자 API
│   │   └── setup.js            # 설정 API
│   ├── services/               # 비즈니스 로직
│   │   ├── supabaseAuth.js     # 인증 서비스 ✅
│   │   ├── kisApi.js           # 증권사 API
│   │   └── aiTradingService.js # AI 거래 로직
│   ├── models/                 # 데이터 모델
│   ├── middleware/             # Express 미들웨어
│   ├── config/                 # 설정 파일
│   ├── server.js               # 메인 서버 ✅
│   ├── websocket.js            # WebSocket 서버
│   └── package.json
│
├── 📁 database (Supabase)
│   ├── scripts/                # DB 스크립트
│   │   ├── fix-users-table-corrected.sql ✅
│   │   ├── ai-tables-fix-corrected.sql ✅
│   │   └── *.sql
│   └── supabase/               # Supabase 설정
│
├── 📁 docs/                    # 프로젝트 문서
│   ├── PM_Session*.md          # PM 관리 문서
│   ├── WBS*.md                 # 작업 분해 구조
│   └── *.md                    # 기타 문서
│
├── 📁 monitoring/              # 모니터링 도구
├── 📁 nginx/                   # 웹 서버 설정
├── 📁 logs/                    # 로그 파일
├── 📁 tests/                   # 테스트 파일
├── 📁 config/                  # 환경 설정
│   └── production.env.template
│
├── 🐳 Docker 관련
│   ├── docker-compose.yml      # 메인 Docker 설정
│   ├── docker-compose.*.yml    # 환경별 설정
│   └── Dockerfile.*           # 각종 Dockerfile
│
├── 📄 설정 파일
│   ├── .env                    # 환경 변수 (보안)
│   ├── env.txt                 # 환경 변수 템플릿
│   ├── netlify.toml            # Netlify 설정 ✅
│   ├── package.json            # 루트 패키지 정보
│   └── .gitignore
│
└── 📄 배포 스크립트
    ├── deploy.sh               # Linux 배포
    ├── deploy-*.ps1            # Windows 배포
    └── *.py                    # Python 도구들
```

## 🔧 **기술 스택 현황**

### **Frontend (프론트엔드)**
```
📱 Framework: React 18 + Vite
📝 Language: TypeScript
🎨 Styling: TailwindCSS
📊 Charts: Chart.js / Recharts
🔗 HTTP Client: Axios
🌐 Deployment: Netlify (자동 배포)
📍 URL: https://christmas-protocol.netlify.app
```

### **Backend (백엔드)**
```
⚡ Runtime: Node.js v22.13.1
🖥️ Framework: Express.js
🔌 WebSocket: ws library
🔐 Authentication: JWT + bcryptjs
🗄️ Database Client: @supabase/supabase-js ✅
📡 External APIs: 한국투자증권 KIS API
🐳 Deployment: Docker on Ubuntu 22.04
📍 Server: 31.220.83.213:8000
```

### **Database (데이터베이스)**
```
🗄️ Service: Supabase (PostgreSQL)
🔗 URL: https://qehzzsxzjijfzqkysazc.supabase.co
📋 Tables:
  ✅ users (인증 시스템 완료)
  ✅ ai_learning_data (AI 학습 데이터)
  ✅ ai_strategy_performance (AI 성능 데이터)
  ✅ orders, trades, positions (거래 데이터)
```

### **DevOps & 배포**
```
🔄 CI/CD: 
  - Frontend: Netlify (Git 연동 자동 배포)
  - Backend: Docker Compose (수동 배포)
📁 Version Control: Git + GitHub
🐳 Containerization: Docker + Docker Compose
🖥️ Server: Ubuntu 22.04 LTS (31.220.83.213)
📊 Monitoring: 기본 로깅 (고도화 필요)
```

## 🔗 **시스템 연동 흐름**

### **사용자 인증 플로우**
```
1. 사용자 → Frontend (로그인 폼)
2. Frontend → Backend (/api/auth/login)
3. Backend → Supabase (사용자 검증)
4. Backend → Frontend (JWT 토큰 반환)
5. Frontend → 로컬 스토리지 저장
6. 이후 API 호출 시 Authorization 헤더에 토큰 포함
```

### **AI 거래 플로우**
```
1. Frontend → Backend (거래 요청)
2. Backend → AI Service (전략 분석)
3. AI Service → Supabase (학습 데이터 조회)
4. AI Service → Backend (거래 신호)
5. Backend → KIS API (실제 주문)
6. Backend → Supabase (거래 결과 저장)
7. Backend → Frontend (실시간 업데이트)
```

### **데이터 실시간 동기화**
```
1. Backend WebSocket Server ↔ Frontend
2. 거래 상태, AI 분석 결과, 계좌 정보 실시간 전송
3. Chart.js를 통한 실시간 차트 업데이트
```

## 📈 **현재 시스템 상태**

### **✅ 정상 동작 구성요소**
- Frontend: Netlify 배포 완료, 빌드 정상
- Database: Supabase 완전 복구, 모든 테이블 정상
- Local Backend: localhost:8000 정상 동작
- 인증 시스템: JWT 기반 완전 구현
- AI 테이블: 스키마 완성, 학습 준비 완료

### **🔄 업데이트 필요 구성요소**
- Remote Backend: 31.220.83.213 서버 동기화 필요
- Docker 컨테이너: 최신 코드 반영 필요
- 프론트엔드-백엔드 연동: 원격 서버 연결 확인 필요

### **📋 다음 개발 계획**
- 모니터링 시스템 구축
- 성능 최적화 (캐싱, DB 인덱싱)
- 보안 강화 (API 율 제한, 입력 검증)
- 테스트 자동화 (Unit, Integration, E2E)

---

## 🎯 **아키텍처 개선 로드맵**

### **Phase 1: 안정성 확보** (현재 진행 중)
- [x] 데이터베이스 스키마 정규화
- [x] 인증 시스템 완성
- [ ] 원격 서버 배포 완료
- [ ] 전체 시스템 통합 테스트

### **Phase 2: 성능 최적화** (다음 단계)
- [ ] 데이터베이스 인덱싱 최적화
- [ ] API 응답 시간 개선
- [ ] 프론트엔드 번들 크기 최적화
- [ ] CDN 적용

### **Phase 3: 확장성 구축** (장기 계획)
- [ ] 마이크로서비스 아키텍처 검토
- [ ] 로드 밸런싱 도입
- [ ] 자동 스케일링 구현
- [ ] 다중 지역 배포

**📝 업데이트**: 2025-05-30 | **버전**: v1.2 | **상태**: 85% 완성 
# 🏗️ Christmas Trading - 아키텍처 다이어그램

## 🔒 **보안 강화 아키텍처 (2025-05-31 업데이트)**

### **전체 시스템 구조**

```
┌─────────────────────────────────────────────────────────────────┐
│                    🌐 Frontend (Netlify)                        │
│                https://christmas-protocol.netlify.app/          │
├─────────────────────────────────────────────────────────────────┤
│  ✅ React + Vite + Material-UI                                 │
│  ✅ 환경변수: 백엔드 API URL만 노출                              │
│  🚫 Supabase 키: 완전 제거 (보안 강화)                          │
│  🔒 모든 DB 요청: 백엔드 프록시 경유                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS API 요청
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   🖥️ Backend (31.220.83.213)                   │
│                        Docker 서비스                            │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Node.js + Express                                          │
│  ✅ API 프록시: 모든 DB 요청 중계                                │
│  ✅ 인증 시스템: JWT 토큰 관리                                   │
│  ✅ KIS API 연동: 실시간 거래                                    │
│  🔒 Supabase 키: 서버 내부에서만 관리                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ 내부 연결
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     🗄️ Database (Supabase)                     │
│                    PostgreSQL + RLS                            │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Users 테이블: 인증 및 프로필                                 │
│  ✅ AI 테이블: 학습 데이터 및 성과                               │
│  ✅ Trading 테이블: 거래 기록                                    │
│  🔒 RLS: Row Level Security 적용                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 **보안 계층 구조**

### **Layer 1: Frontend Security**
```
Frontend (Netlify)
├── 🚫 Supabase 키 제거
├── 🔒 환경변수 최소화
├── 🛡️ HTTPS 강제
└── 📡 백엔드 API만 호출
```

### **Layer 2: Backend Proxy**
```
Backend (31.220.83.213)
├── 🔐 API 인증 검증
├── 🔄 요청 프록시 처리
├── 🛡️ Rate Limiting
├── 📊 로깅 및 모니터링
└── 🔒 Supabase 키 보호
```

### **Layer 3: Database Security**
```
Supabase Database
├── 🔐 RLS (Row Level Security)
├── 🔑 JWT 토큰 검증
├── 📋 권한 기반 접근
└── 🛡️ SQL Injection 방지
```

---

## 🔄 **데이터 플로우**

### **1. 사용자 인증 플로우**
```
1. 사용자 로그인 요청
   Frontend → Backend (/api/auth/signin)

2. 백엔드에서 Supabase 인증
   Backend → Supabase (내부 연결)

3. JWT 토큰 생성 및 반환
   Backend → Frontend (토큰 전달)

4. 이후 모든 요청에 토큰 포함
   Frontend → Backend (Authorization Header)
```

### **2. 데이터 조회 플로우**
```
1. 프론트엔드 데이터 요청
   Frontend → Backend (/api/users/profile/{id})

2. 토큰 검증 및 권한 확인
   Backend (JWT 검증)

3. Supabase 쿼리 실행
   Backend → Supabase (내부 연결)

4. 데이터 반환
   Backend → Frontend (JSON 응답)
```

### **3. 실시간 거래 플로우**
```
1. KIS API 연동
   Backend → KIS API (실시간 데이터)

2. AI 분석 처리
   Backend (AI 알고리즘)

3. 거래 신호 생성
   Backend → WebSocket

4. 프론트엔드 업데이트
   WebSocket → Frontend (실시간 알림)
```

---

## 🛠️ **기술 스택**

### **Frontend**
- **Framework**: React 18 + Vite
- **UI Library**: Material-UI v5
- **State Management**: React Hooks + Context
- **HTTP Client**: Axios
- **Deployment**: Netlify

### **Backend**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Authentication**: JWT
- **Database ORM**: Supabase Client
- **Deployment**: Docker (31.220.83.213)

### **Database**
- **Provider**: Supabase (PostgreSQL)
- **Security**: Row Level Security (RLS)
- **Backup**: 자동 백업 (Supabase)

### **External APIs**
- **Trading**: 한국투자증권 KIS API
- **AI**: OpenAI GPT-4
- **Payment**: 토스페이먼츠
- **Notification**: 텔레그램 Bot

---

## 📊 **성능 최적화**

### **Frontend 최적화**
- ✅ Code Splitting (React.lazy)
- ✅ Bundle 최적화 (Vite)
- ✅ CDN 캐싱 (Netlify)
- ✅ 이미지 최적화

### **Backend 최적화**
- ✅ API 응답 캐싱
- ✅ Database Connection Pool
- ✅ Rate Limiting
- ✅ 압축 (gzip)

### **Database 최적화**
- ✅ 인덱스 최적화
- ✅ 쿼리 최적화
- ✅ Connection Pool
- ✅ 읽기 전용 복제본

---

## 🔍 **모니터링 및 로깅**

### **Frontend 모니터링**
- 📊 사용자 행동 분석
- 🐛 에러 추적
- ⚡ 성능 메트릭
- 📱 사용자 경험 모니터링

### **Backend 모니터링**
- 📈 API 응답 시간
- 🔍 에러 로그 수집
- 📊 시스템 리소스 모니터링
- 🚨 알림 시스템

### **Database 모니터링**
- 📊 쿼리 성능 분석
- 💾 스토리지 사용량
- 🔐 보안 이벤트 로깅
- 📈 연결 상태 모니터링

---

## 🚀 **배포 전략**

### **CI/CD 파이프라인**
```
1. Git Push → GitHub
2. Netlify 자동 빌드 (Frontend)
3. Docker 이미지 빌드 (Backend)
4. 31.220.83.213 서버 배포
5. 헬스 체크 및 알림
```

### **환경 분리**
- **Development**: 로컬 개발 환경
- **Staging**: 테스트 환경
- **Production**: 운영 환경 (현재)

---

*📝 문서 작성일: 2025-05-31*
*🔄 다음 업데이트: 아키텍처 변경 시* 
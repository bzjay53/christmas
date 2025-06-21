# Christmas Trading 프로젝트 구조도 및 아키텍처 현황

## 🏗️ 전체 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    Christmas Trading Platform                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Netlify)     │◄──►│   (Contabo)     │◄──►│   (Supabase)    │
│                 │    │                 │    │                 │
│ React + Vite    │    │ Node.js + API   │    │ PostgreSQL      │
│ Material-UI     │    │ Docker Stack    │    │ Real-time DB    │
│ WebSocket       │    │ nginx + Redis   │    │ Auth System     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Hosting   │    │   VPS Server    │    │   Cloud DB      │
│                 │    │                 │    │                 │
│ HTTPS Enabled   │    │ 31.220.83.213   │    │ Managed Service │
│ Global Deploy   │    │ Ubuntu 22.04    │    │ Auto Backup     │
│ Auto Build      │    │ 8GB RAM/3 CPU   │    │ High Availability│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 현재 배포 상태 (2025-05-25)

### ✅ 프론트엔드 (Netlify)
- **URL**: https://christmas-trading.netlify.app
- **상태**: 배포 완료, 환경 변수 업데이트 필요
- **기술 스택**: React 18, Vite, Material-UI v5
- **기능**: 완전한 UI/UX, 인증 시스템, 대시보드

### ✅ 백엔드 (Contabo VPS)
- **IP**: 31.220.83.213
- **상태**: 정상 운영 중 (8개 컨테이너)
- **API**: http://31.220.83.213/api/health (200 OK)
- **인증**: SSH 키 기반 자동 접속

### ✅ 데이터베이스 (Supabase)
- **상태**: 클라우드 연결 완료
- **기능**: 실시간 DB, 사용자 인증, 파일 저장소
- **연동**: 백엔드에서 정상 접근

## 🐳 Docker 컨테이너 구성

### 현재 실행 중인 서비스들

| 컨테이너명 | 이미지 | 상태 | 포트 | 역할 |
|-----------|--------|------|------|------|
| `christmas-nginx` | nginx:alpine | Up (unhealthy) | 80, 443 | 리버스 프록시 |
| `christmas-backend` | custom | Up (healthy) | 8000 | API 서버 |
| `christmas-postgres` | postgres:15 | Up (healthy) | 5432 | 로컬 DB |
| `christmas-redis` | redis:7 | Up (healthy) | 6379 | 캐시/세션 |
| `christmas-grafana` | grafana | Up | 3001 | 모니터링 |
| `christmas-prometheus` | prometheus | Up | 9090 | 메트릭 수집 |
| `christmas-wordpress` | wordpress | Up | - | CMS |
| `christmas-n8n` | n8n | Up | 5678 | 워크플로우 |

### 네트워크 구성
```
Internet → nginx (80/443) → Backend API (8000)
                         → Grafana (3001)
                         → Prometheus (9090)
```

## 📁 프로젝트 디렉토리 구조

```
christmas/
├── 📁 backend/                 # Node.js API 서버
│   ├── 📄 server.js           # 메인 서버 파일
│   ├── 📁 routes/             # API 라우트
│   ├── 📁 middleware/         # 미들웨어
│   ├── 📄 websocket.js        # WebSocket 서버
│   └── 📄 Dockerfile          # 백엔드 컨테이너
│
├── 📁 web-dashboard/          # React 프론트엔드
│   ├── 📁 src/
│   │   ├── 📁 components/     # React 컴포넌트
│   │   ├── 📁 services/       # API 서비스
│   │   ├── 📁 utils/          # 유틸리티
│   │   └── 📄 App.jsx         # 메인 앱
│   ├── 📄 package.json        # 의존성 관리
│   └── 📄 vite.config.js      # Vite 설정
│
├── 📁 docs/                   # 프로젝트 문서
│   ├── 📄 18. christmas_wbs.md
│   ├── 📄 62. Contabo_백엔드_배포_완료_및_Netlify_연동_가이드.md
│   ├── 📄 63. Netlify_환경변수_업데이트_가이드.md
│   └── 📄 64. 프로젝트_구조도_및_아키텍처_현황.md
│
├── 📁 scripts/                # 배포 및 유틸리티 스크립트
│   ├── 📄 netlify-env-update.md
│   └── 📁 deployment/
│
├── 📁 nginx/                  # nginx 설정
│   ├── 📄 nginx.conf
│   └── 📁 ssl/
│
├── 📁 monitoring/             # 모니터링 설정
│   ├── 📁 grafana/
│   └── 📁 prometheus/
│
├── 📄 docker-compose.yml      # 전체 서비스 구성
├── 📄 deploy-simple.ps1       # 배포 스크립트
├── 📄 production.env          # 프로덕션 환경 변수
└── 📄 netlify-production.env  # Netlify 환경 변수
```

## 🔗 데이터 흐름도

```
┌─────────────┐    HTTPS     ┌─────────────┐    HTTP      ┌─────────────┐
│   Browser   │◄────────────►│   Netlify   │◄────────────►│   Contabo   │
│             │              │  Frontend   │              │   Backend   │
│ User Input  │              │ React App   │              │  Node.js    │
└─────────────┘              └─────────────┘              └─────────────┘
                                     │                            │
                                     │                            │
                                     ▼                            ▼
                              ┌─────────────┐              ┌─────────────┐
                              │  WebSocket  │              │  Supabase   │
                              │ Real-time   │              │ PostgreSQL  │
                              │ Updates     │              │ Database    │
                              └─────────────┘              └─────────────┘
```

## 🔧 기술 스택 상세

### Frontend (Netlify)
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.0
- **UI Library**: Material-UI v5
- **State Management**: React Context + Hooks
- **HTTP Client**: Fetch API + Custom Service
- **WebSocket**: Native WebSocket API
- **Authentication**: Supabase Auth

### Backend (Contabo)
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: Supabase PostgreSQL
- **Cache**: Redis 7
- **WebSocket**: ws package
- **Security**: Helmet, CORS, Rate Limiting
- **Monitoring**: Prometheus metrics

### Infrastructure
- **Container**: Docker + Docker Compose
- **Reverse Proxy**: nginx
- **SSL**: Let's Encrypt (예정)
- **Monitoring**: Grafana + Prometheus
- **CI/CD**: GitHub Actions
- **Deployment**: Automated scripts

## 🚀 배포 프로세스

### 1. 개발 → 스테이징
```bash
git push origin main
↓
GitHub Actions 트리거
↓
Netlify 자동 빌드 및 배포
```

### 2. 스테이징 → 프로덕션
```powershell
.\deploy-simple.ps1 dry-run    # 테스트
.\deploy-simple.ps1 deploy     # 실제 배포
```

### 3. 배포 검증
```bash
# 헬스체크
curl http://31.220.83.213/api/health

# 서비스 상태
ssh -i ~/.ssh/christmas_contabo root@31.220.83.213 "docker ps"
```

## 📊 성능 및 모니터링

### 현재 메트릭
- **응답 시간**: < 200ms (API)
- **가용성**: 99.9% (목표)
- **동시 사용자**: 100명 (예상)
- **데이터 처리**: 실시간

### 모니터링 도구
- **Grafana**: http://31.220.83.213:3001
- **Prometheus**: http://31.220.83.213:9090
- **로그**: Docker logs
- **헬스체크**: /api/health 엔드포인트

## 🔒 보안 구성

### 네트워크 보안
- **방화벽**: UFW 활성화
- **SSH**: 키 기반 인증만 허용
- **HTTPS**: Netlify 자동 SSL
- **API**: CORS 정책 적용

### 애플리케이션 보안
- **인증**: Supabase Auth + JWT
- **권한**: 역할 기반 접근 제어
- **데이터**: 암호화 전송
- **API**: Rate Limiting 적용

## 🎯 다음 단계 계획

### 즉시 진행 (1-2일)
1. **Netlify 환경 변수 업데이트** (수동 작업 필요)
2. **nginx 헬스체크 문제 해결**
3. **SSL 인증서 설치**

### 단기 계획 (1주일)
1. **실제 기능 테스트 및 검증**
2. **KIS API 실제 연동**
3. **성능 최적화**

### 중기 계획 (1개월)
1. **사용자 피드백 반영**
2. **추가 기능 구현**
3. **스케일링 준비**

---

**작성일**: 2025-05-25  
**작성자**: Christmas Trading 개발팀  
**상태**: 백엔드 배포 완료, 프론트엔드 연동 진행 중 
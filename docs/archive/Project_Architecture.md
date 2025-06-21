# Christmas Trading 프로젝트 아키텍처

## 📋 문서 정보
- **작성일**: 2025-05-26
- **버전**: 1.0
- **상태**: 현재 구현된 아키텍처 기준

## 🏗️ 시스템 아키텍처 개요

### 전체 시스템 구조
```
┌─────────────────────────────────────────────────────────────┐
│                    Christmas Trading System                 │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Netlify)                                        │
│  ├── React + Vite                                          │
│  ├── Zustand (State Management)                            │
│  ├── Tailwind CSS                                          │
│  └── Dark/Light Theme                                      │
├─────────────────────────────────────────────────────────────┤
│  Reverse Proxy (nginx)                                     │
│  ├── SSL Termination                                       │
│  ├── Load Balancing                                        │
│  └── API Routing                                           │
├─────────────────────────────────────────────────────────────┤
│  Backend API (Node.js + Docker)                           │
│  ├── Express.js Framework                                  │
│  ├── JWT Authentication                                    │
│  ├── Supabase Integration                                  │
│  ├── WebSocket Support                                     │
│  └── KIS API Integration                                   │
├─────────────────────────────────────────────────────────────┤
│  Database (Supabase PostgreSQL)                           │
│  ├── User Management                                       │
│  ├── Trading Data                                          │
│  ├── Coupon System                                         │
│  └── Referral System                                       │
├─────────────────────────────────────────────────────────────┤
│  External Services                                         │
│  ├── KIS API (한국투자증권)                                │
│  ├── Telegram Bot                                          │
│  └── Monitoring Stack                                      │
└─────────────────────────────────────────────────────────────┘
```

## 🌐 네트워크 아키텍처

### 배포 환경
- **프론트엔드**: Netlify CDN (https://christmas-protocol.netlify.app/)
- **백엔드**: Docker Container (31.220.83.213)
- **데이터베이스**: Supabase Cloud (https://qehzzsxzjijfzqkysazc.supabase.co)

### 네트워크 플로우
```
Internet → Netlify CDN → nginx (31.220.83.213:80/443)
                      ↓
                   Backend Container (christmas-backend:8000)
                      ↓
                   Supabase PostgreSQL
```

## 🐳 Docker 컨테이너 구조

### 현재 실행 중인 컨테이너
```yaml
services:
  christmas-nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    network: christmas-trading_christmas-network
    
  christmas-backend:
    image: christmas-backend-production
    ports: ["8000:8000"]
    network: christmas-trading_christmas-network
    env_file: .env.docker
    
  christmas-postgres:
    image: postgres:15-alpine
    network: christmas-trading_christmas-network
    
  christmas-redis:
    image: redis:7-alpine
    network: christmas-trading_christmas-network
    
  christmas-grafana:
    image: grafana/grafana:latest
    ports: ["3001:3000"]
    
  christmas-prometheus:
    image: prom/prometheus:latest
    ports: ["9090:9090"]
```

## 📁 프로젝트 디렉토리 구조

### 서버 디렉토리 (/root/christmas-trading)
```
christmas-trading/
├── backend/                 # Node.js 백엔드
│   ├── routes/             # API 라우트
│   │   ├── auth.js         # 인증 API
│   │   ├── kis.js          # KIS API 연동
│   │   ├── kisApi.js       # KIS API 헬퍼
│   │   ├── telegram.js     # 텔레그램 봇
│   │   ├── trading.js      # 거래 API
│   │   └── users.js        # 사용자 관리
│   ├── services/           # 비즈니스 로직
│   │   ├── supabaseAuth.js # Supabase 인증
│   │   └── kisApi.js       # KIS API 서비스
│   ├── middleware/         # 미들웨어
│   │   └── auth.js         # JWT 인증 미들웨어
│   ├── server.js           # 메인 서버 파일
│   ├── websocket.js        # WebSocket 핸들러
│   ├── package.json        # 의존성 관리
│   └── Dockerfile          # Docker 빌드 설정
├── web-dashboard/          # React 프론트엔드
├── nginx/                  # nginx 설정
├── config/                 # 설정 파일들
├── scripts/                # 자동화 스크립트
├── docs/                   # 프로젝트 문서
└── .env.docker            # Docker 환경변수
```

## 🔧 기술 스택

### Frontend
- **Framework**: React 18 + Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Deployment**: Netlify

### Backend
- **Runtime**: Node.js 18 (Alpine)
- **Framework**: Express.js
- **Authentication**: JWT + Supabase Auth
- **WebSocket**: Socket.io
- **Container**: Docker

### Database
- **Primary**: Supabase PostgreSQL
- **Cache**: Redis (Docker)
- **Monitoring**: Prometheus + Grafana

### External APIs
- **Trading**: KIS API (한국투자증권)
- **Notifications**: Telegram Bot API
- **Payments**: Toss Payments (예정)

## 🔐 보안 아키텍처

### 인증 플로우
```
1. 사용자 로그인 → Supabase Auth
2. JWT 토큰 발급 → Backend
3. API 요청 시 토큰 검증 → Middleware
4. 권한 확인 → Route Handler
```

### 보안 계층
- **SSL/TLS**: nginx에서 종료
- **JWT**: 토큰 기반 인증
- **CORS**: 허용된 도메인만 접근
- **Rate Limiting**: API 요청 제한
- **Input Validation**: 모든 입력 데이터 검증

## 📊 데이터 플로우

### 사용자 인증
```
Frontend → nginx → Backend → Supabase → Backend → Frontend
```

### 거래 데이터
```
Frontend → Backend → KIS API → Backend → Supabase → Frontend
```

### 실시간 알림
```
Backend → WebSocket → Frontend
Backend → Telegram Bot → 사용자
```

## 🚀 배포 아키텍처

### 현재 배포 상태
- **Frontend**: Netlify 자동 배포 (GitHub 연동)
- **Backend**: Docker 수동 배포 (31.220.83.213)
- **Database**: Supabase 관리형 서비스

### 배포 프로세스
1. 코드 변경 → GitHub 푸시
2. Frontend: Netlify 자동 빌드/배포
3. Backend: 수동 Docker 이미지 빌드/배포
4. Database: Supabase 콘솔에서 스키마 관리

## 📈 확장성 고려사항

### 수평 확장
- Backend: Docker Swarm 또는 Kubernetes
- Database: Supabase 자동 스케일링
- Cache: Redis Cluster

### 성능 최적화
- CDN: Netlify Edge Network
- Caching: Redis + Application Level
- Database: Connection Pooling + Query Optimization

## 🔍 모니터링 아키텍처

### 현재 구성
- **Metrics**: Prometheus
- **Visualization**: Grafana
- **Logs**: Docker Logs
- **Health Checks**: nginx + Backend

### 모니터링 대상
- API 응답 시간
- 데이터베이스 연결 상태
- 컨테이너 리소스 사용량
- 사용자 활동 로그

## 🔄 향후 개선 계획

### Phase 2 아키텍처 개선
1. **CI/CD 파이프라인**: GitHub Actions
2. **컨테이너 오케스트레이션**: Kubernetes
3. **마이크로서비스**: 기능별 서비스 분리
4. **API Gateway**: 통합 API 관리
5. **Message Queue**: Redis Pub/Sub → RabbitMQ 
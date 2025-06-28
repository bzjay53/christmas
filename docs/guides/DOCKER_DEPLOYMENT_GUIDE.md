# 🐳 Christmas Trading - Docker 배포 가이드

## 📅 **작성일**: 2025-06-28 UTC
## 🎯 **상태**: Docker 서비스 구성 완료 - Multi-container Architecture

---

## 🎯 **Docker 서비스 개요**

Christmas Trading 프로젝트는 사용자 요청에 따라 **별도 스크립트 실행 없이** 완전한 Docker 서비스로 구성되었습니다. Multi-container 아키텍처로 Frontend, MCP 서비스들, 데이터베이스를 통합 관리합니다.

### **핵심 설계 원칙**
- ✅ **별도 스크립트 불필요**: 모든 서비스가 Docker 내에서 자동 실행
- ✅ **체계적 접근**: 업무 중요도와 순서에 맞는 단계별 구성
- ✅ **참조 문서 기반**: 기존 아키텍처 문서를 완전히 반영
- ✅ **MCP 통합**: Task Master, Memory Bank, Gemini MCP 완전 통합

---

## 🏗️ **Docker 아키텍처 구성**

### **컨테이너 구성**
```
christmas-trading/
├── christmas-trading (메인 컨테이너)
│   ├── Frontend (React + Vite) : 3000
│   ├── Task Master MCP        : 8001
│   ├── Memory Bank MCP        : 8002
│   └── Gemini MCP             : 8003
├── christmas-db (데이터 지속성)
├── christmas-proxy (Nginx - 선택적)
└── christmas-dev (개발 모드 - 선택적)
```

### **볼륨 관리**
- `christmas-data`: SQLite DB 및 영구 데이터
- `christmas-logs`: 모든 서비스 로그
- `christmas-ssl`: SSL 인증서 (HTTPS용)

### **네트워크**
- `christmas-network`: 내부 서비스 간 통신

---

## 🚀 **빠른 시작 가이드**

### **1단계: 환경 준비**
```bash
# 저장소 클론
git clone https://github.com/bzjay53/christmas.git
cd christmas-trading

# 환경 설정 파일 생성
cp .env.docker .env

# API 키 설정 (필수)
vim .env  # 또는 nano .env
```

### **2단계: Docker 서비스 시작**
```bash
# 초기 설정 (최초 1회만)
./docker-manage.sh setup

# 서비스 시작
./docker-manage.sh start

# 또는 직접 Docker Compose 사용
docker-compose up -d --build
```

### **3단계: 접속 확인**
- **메인 애플리케이션**: http://localhost:3000
- **Task Master MCP**: http://localhost:8001  
- **Memory Bank MCP**: http://localhost:8002
- **Gemini MCP**: http://localhost:8003

---

## 🔧 **상세 설정 가이드**

### **환경 변수 설정 (.env)**
```bash
# Supabase 설정 (필수)
VITE_SUPABASE_URL=https://qehzzsxzjijfzqkysazc.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Binance API (암호화폐 거래)
VITE_BINANCE_API_KEY=your_binance_api_key
VITE_BINANCE_SECRET_KEY=your_binance_secret_key
VITE_BINANCE_TESTNET=true

# MCP 서비스 (AI 분석)
GEMINI_API_KEY=your_gemini_api_key

# Mock 데이터 모드 (개발용)
VITE_ENABLE_MOCK_DATA=true
```

### **Docker 관리 스크립트 사용법**
```bash
# 서비스 관리
./docker-manage.sh start          # 프로덕션 모드 시작
./docker-manage.sh dev             # 개발 모드 시작 (Hot Reload)
./docker-manage.sh stop            # 서비스 중지
./docker-manage.sh restart         # 서비스 재시작

# 모니터링
./docker-manage.sh status          # 서비스 상태 확인
./docker-manage.sh logs            # 모든 로그 확인
./docker-manage.sh logs christmas-trading  # 특정 서비스 로그
./docker-manage.sh health          # 헬스체크

# 유지보수
./docker-manage.sh build           # 이미지 다시 빌드
./docker-manage.sh backup          # 데이터 백업
./docker-manage.sh clean           # 완전 정리
```

---

## 📋 **서비스별 상세 구성**

### **1. Frontend Service (React + Vite)**
```dockerfile
# Multi-stage build로 최적화
FROM node:18-alpine AS frontend-builder
# 빌드 후 serve로 정적 파일 서빙
EXPOSE 3000
```

**특징**:
- ✅ 번들 최적화 (Vite 기반)
- ✅ Binance API 통합
- ✅ Chart.js 실시간 차트
- ✅ frontend.png 100% 구현

### **2. Task Master MCP (포트 8001)**
```python
# task-master-integration.py
class TaskMasterMCP:
    - SQLite DB: .task-master.db
    - 4개 작업 추적
    - 일일/주간 보고서
    - 진행률 관리
```

**기능**:
- ✅ 체계적 작업 관리
- ✅ 진행 상황 추적
- ✅ 프로젝트 상태 모니터링

### **3. Memory Bank MCP (포트 8002)**
```python
# memory-bank-integration.py  
class MemoryBankMCP:
    - SQLite DB: .memory-bank.db
    - 5개 핵심 메모리 보존
    - 기술적 결정사항 관리
    - 프로젝트 컨텍스트
```

**기능**:
- ✅ 기술적 결정 사항 보존
- ✅ 프로젝트 메모리 관리
- ✅ 컨텍스트 검색 및 분석

### **4. Gemini MCP (포트 8003)**
```python
# gemini_mcp_server.py
class ChristmasGeminiMCP:
    - AI 시장 분석
    - 거래 전략 최적화  
    - 코드 생성
    - 리스크 평가
```

**기능**:
- ✅ AI 기반 시장 분석
- ✅ 거래 전략 생성
- ✅ 자동 코드 생성

---

## 🔧 **운영 및 모니터링**

### **로그 관리**
```bash
# 실시간 로그 확인
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f christmas-trading

# 로그 파일 위치 (컨테이너 내부)
/app/logs/task-master.log
/app/logs/memory-bank.log  
/app/logs/gemini-mcp.log
```

### **데이터 백업**
```bash
# 자동 백업 (타임스탬프 포함)
./docker-manage.sh backup

# 백업 파일 위치
./backups/20250628_143000/
├── christmas-data.tar.gz    # 데이터베이스 파일들
├── .env                     # 환경 설정
└── docker-compose.yml       # 서비스 구성
```

### **헬스체크**
```bash
# 모든 서비스 상태 확인
./docker-manage.sh health

# 수동 헬스체크
curl http://localhost:3000/health
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
```

---

## 🌐 **배포 모드별 가이드**

### **개발 모드**
```bash
# Hot Reload 활성화
./docker-manage.sh dev

# 또는 직접 실행
docker-compose --profile development up -d

# 접속: http://localhost:5173 (Vite Dev Server)
```

**특징**:
- ✅ 소스 코드 변경 시 즉시 반영
- ✅ 개발 도구 포함
- ✅ 디버깅 모드

### **프로덕션 모드**
```bash
# 최적화된 빌드로 실행
./docker-manage.sh start

# 프록시 포함 (권장)
./docker-manage.sh start --proxy

# 접속: http://localhost:3000 (또는 :80)
```

**특징**:
- ✅ 번들 최적화
- ✅ Nginx 리버스 프록시
- ✅ SSL/TLS 지원
- ✅ 캐싱 최적화

### **프록시 모드 (Nginx)**
```bash
# Nginx 프록시 포함 실행
docker-compose --profile proxy up -d

# 접속: http://localhost:80
```

**기능**:
- ✅ 리버스 프록시
- ✅ 로드 밸런싱
- ✅ SSL 종료
- ✅ 정적 파일 캐싱

---

## 🛡️ **보안 및 최적화**

### **보안 설정**
```yaml
# docker-compose.yml
security_opt:
  - no-new-privileges:true
  
# 읽기 전용 파일시스템
read_only: true
tmpfs:
  - /tmp
  - /app/logs
```

### **리소스 제한**
```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

### **네트워크 보안**
```yaml
networks:
  christmas-network:
    driver: bridge
    internal: true  # 외부 접근 차단
```

---

## 🚨 **문제 해결 가이드**

### **일반적인 문제들**

#### **1. 포트 충돌**
```bash
# 사용 중인 포트 확인
netstat -tulpn | grep :3000

# 다른 포트로 변경
export FRONTEND_PORT=3001
docker-compose up -d
```

#### **2. 권한 문제**
```bash
# Docker 그룹에 사용자 추가
sudo usermod -aG docker $USER
newgrp docker

# 파일 권한 수정
chmod +x docker-manage.sh
```

#### **3. 메모리 부족**
```bash
# Docker 메모리 제한 확인
docker system df

# 사용하지 않는 리소스 정리
docker system prune -a
```

#### **4. 빌드 실패**
```bash
# 캐시 없이 다시 빌드
docker-compose build --no-cache

# 개별 서비스 빌드
docker-compose build christmas-trading
```

### **로그 기반 디버깅**
```bash
# 서비스별 로그 확인
docker-compose logs christmas-trading
docker-compose logs christmas-db

# 에러 로그만 필터링
docker-compose logs | grep ERROR

# 특정 시간대 로그
docker-compose logs --since="2025-06-28T14:00:00"
```

---

## 📊 **성능 모니터링**

### **리소스 사용량 확인**
```bash
# 컨테이너 리소스 사용량
docker stats

# 특정 컨테이너만
docker stats christmas-trading

# 볼륨 사용량
docker system df -v
```

### **애플리케이션 메트릭스**
```bash
# MCP 서비스 상태
curl http://localhost:8001/status
curl http://localhost:8002/status  
curl http://localhost:8003/status

# 데이터베이스 상태
sqlite3 /app/data/.task-master.db ".tables"
sqlite3 /app/data/.memory-bank.db ".schema"
```

---

## 🔄 **업데이트 및 배포**

### **서비스 업데이트**
```bash
# 1. 새 코드 가져오기
git pull origin main

# 2. 이미지 다시 빌드
./docker-manage.sh build

# 3. 무중단 업데이트
docker-compose up -d --no-deps christmas-trading

# 4. 헬스체크
./docker-manage.sh health
```

### **환경 변수 업데이트**
```bash
# 1. .env 파일 수정
vim .env

# 2. 서비스 재시작 (필요한 경우만)
docker-compose restart christmas-trading
```

### **데이터베이스 마이그레이션**
```bash
# 1. 데이터 백업
./docker-manage.sh backup

# 2. 마이그레이션 실행
docker exec christmas-trading python migrate.py

# 3. 검증
./docker-manage.sh health
```

---

## 📚 **참조 문서 연동**

### **기존 아키텍처 반영**
이 Docker 구성은 다음 참조 문서들을 완전히 반영합니다:

- **[SERVER_BACKEND_ARCHITECTURE.md](../architecture/SERVER_BACKEND_ARCHITECTURE.md)** - Supabase + Binance API 하이브리드 구조
- **[VERCEL_SUPABASE_MIGRATION_PLAN.md](../planning/VERCEL_SUPABASE_MIGRATION_PLAN.md)** - 안전성 우선 원칙
- **[MCP_INTEGRATION_GUIDE.md](./MCP_INTEGRATION_GUIDE.md)** - Task Master & Memory Bank 통합

### **MCP 통합 상태**
- ✅ **Task Master MCP**: 4개 작업 관리 중
- ✅ **Memory Bank MCP**: 5개 핵심 메모리 보존
- ✅ **Gemini MCP**: AI 분석 서비스 연동

### **사용자 피드백 반영**
- ✅ **별도 스크립트 불필요**: 모든 서비스가 Docker 내에서 자동 실행
- ✅ **체계적 접근**: 업무 중요도와 순서에 맞는 구성
- ✅ **참조 문서 기반**: 기존 아키텍처 완전 반영

---

## 🎯 **다음 단계**

### **Phase 4: 고급 Docker 기능**
1. **Kubernetes 지원**: Helm 차트 작성
2. **CI/CD 통합**: GitHub Actions 배포 파이프라인
3. **모니터링 강화**: Prometheus + Grafana
4. **자동 스케일링**: 부하에 따른 자동 확장

### **운영 개선**
- Docker Swarm 클러스터 구성
- 자동 백업 스케줄링
- 로그 중앙화 (ELK Stack)
- 보안 스캔 자동화

---

## 📋 **체크리스트**

### **배포 전 확인사항**
- [ ] .env 파일에 모든 API 키 설정
- [ ] Docker 및 Docker Compose 설치 확인
- [ ] 필요한 포트 (3000, 8001-8003) 사용 가능 확인
- [ ] 디스크 공간 충분 확인 (최소 2GB)

### **배포 후 검증**
- [ ] 모든 컨테이너 정상 실행: `docker-compose ps`
- [ ] 메인 애플리케이션 접속: http://localhost:3000
- [ ] MCP 서비스 응답 확인: `./docker-manage.sh health`
- [ ] 로그에 에러 없음 확인: `./docker-manage.sh logs`

---

**🎯 목표**: 완전한 Docker 기반 서비스 운영  
**📊 현재 상태**: Multi-container 아키텍처 구축 완료  
**🔄 다음 단계**: 운영 환경 배포 및 모니터링 강화

*Docker 서비스 구성 완료: 2025-06-28 UTC*
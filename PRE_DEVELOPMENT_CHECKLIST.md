# 🎄 Christmas Trading - 개발 전 체크리스트

## 📋 Pre-Development Checklist

### 🔧 **1. 원격 서버 환경 준비**

- [ ] **SSH 접속 확인**
  ```bash
  ssh root@31.220.83.213
  # 연결 성공 시: 원격 서버 프롬프트 확인
  ```

- [ ] **Docker 설치 확인**
  ```bash
  docker --version
  docker-compose --version
  # 버전 정보가 출력되어야 함
  ```

- [ ] **시스템 리소스 확인**
  ```bash
  free -h    # 메모리 확인 (최소 2GB 권장)
  df -h      # 디스크 공간 확인 (최소 10GB 권장)
  nproc      # CPU 코어 수 확인
  ```

- [ ] **방화벽 포트 개방**
  ```bash
  ufw allow 80      # HTTP
  ufw allow 443     # HTTPS  
  ufw allow 3000    # Frontend
  ufw allow 8080    # Backend API
  ufw allow 22      # SSH (기본값)
  ufw status        # 설정 확인
  ```

### 🔐 **2. API 키 및 인증 설정**

- [ ] **Supabase 프로젝트 설정**
  - [ ] 새 Supabase 프로젝트 생성
  - [ ] 데이터베이스 URL 및 anon key 확보
  - [ ] JWT secret key 확보
  - [ ] RLS (Row Level Security) 활성화

- [ ] **Binance API 키 발급**
  - [ ] Binance 계정 생성 및 API 키 발급
  - [ ] Spot Trading 권한 활성화
  - [ ] IP 화이트리스트 설정 (31.220.83.213)
  - [ ] 테스트넷 키 별도 발급 (개발용)

- [ ] **Gemini API 키 준비** (선택적)
  - [ ] Gemini API 키 발급
  - [ ] MCP 서비스용 설정

- [ ] **환경 변수 파일 작성**
  ```bash
  # .env.prod 파일 생성
  cp .env .env.prod
  vim .env.prod
  ```

### 🗄️ **3. 데이터베이스 설정**

- [ ] **Supabase 데이터베이스 스키마 생성**
  ```sql
  -- supabase_schema.sql 실행
  -- profiles, trades, portfolio_holdings 테이블 생성
  -- ai_trading_strategies, trading_signals 테이블 생성
  ```

- [ ] **Row Level Security 정책 적용**
  ```sql
  -- 사용자별 데이터 격리 정책
  -- API 접근 권한 설정
  ```

- [ ] **테스트 사용자 계정 생성**
  - [ ] Supabase Auth에서 테스트 계정 생성
  - [ ] 각 구독 티어별 테스트 계정 준비

### 🔗 **4. 외부 서비스 연동 테스트**

- [ ] **Binance API 연결 테스트**
  ```bash
  # API 키 유효성 확인
  curl -H "X-MBX-APIKEY: your_api_key" \
       'https://api.binance.com/api/v3/account'
  ```

- [ ] **Supabase 연결 테스트**
  ```bash
  # REST API 테스트
  curl "https://your-project.supabase.co/rest/v1/profiles" \
       -H "apikey: your_anon_key"
  ```

- [ ] **Redis 설정 확인** (Docker 내부)
  - [ ] Redis 컨테이너 실행 계획 수립
  - [ ] 캐시 정책 설계

### 📁 **5. 프로젝트 구조 검증**

- [ ] **필수 파일 존재 확인**
  ```
  ✅ docker-compose.prod.yml
  ✅ backend/main.py
  ✅ orchestrator/orchestrator.py
  ✅ nginx.prod.conf
  ✅ .env.prod
  ✅ supabase_schema.sql
  ```

- [ ] **디렉토리 구조 확인**
  ```
  christmas-trading/
  ├── backend/          # FastAPI 백엔드
  ├── orchestrator/     # JSON 오케스트레이션
  ├── data/            # JSON 데이터 저장소
  ├── logs/            # 로그 파일
  └── docs/            # 문서
  ```

### 🌐 **6. 네트워크 및 보안 설정**

- [ ] **SSL 인증서 준비** (선택적)
  ```bash
  # Let's Encrypt 설정 (선택적)
  certbot --nginx -d yourdomain.com
  ```

- [ ] **도메인 설정** (선택적)
  - [ ] DNS A 레코드: yourdomain.com → 31.220.83.213
  - [ ] 서브도메인 설정 (api.yourdomain.com)

- [ ] **백업 전략 수립**
  - [ ] 데이터베이스 백업 스크립트
  - [ ] 설정 파일 백업 계획
  - [ ] 복구 절차 문서화

### 📊 **7. 모니터링 및 로깅 설정**

- [ ] **로그 디렉토리 생성**
  ```bash
  mkdir -p logs/
  mkdir -p data/
  ```

- [ ] **로그 로테이션 설정**
  - [ ] logrotate 설정
  - [ ] 최대 로그 파일 크기 제한

- [ ] **모니터링 도구 준비** (선택적)
  - [ ] Prometheus + Grafana 설정
  - [ ] 알림 시스템 구성

### 🧪 **8. 테스트 환경 검증**

- [ ] **로컬 개발 환경 테스트**
  ```bash
  npm run dev
  # 로컬에서 정상 동작 확인
  ```

- [ ] **Docker 빌드 테스트**
  ```bash
  docker-compose -f docker-compose.prod.yml build
  # 모든 이미지 빌드 성공 확인
  ```

- [ ] **환경 변수 검증**
  ```bash
  # 모든 필수 환경 변수 설정 확인
  grep -E "^[^#]" .env.prod
  ```

## ✅ **최종 검증 체크리스트**

### **Critical Path (필수)**
- [ ] SSH 접속 가능
- [ ] Docker/Docker Compose 설치됨
- [ ] 방화벽 포트 개방 완료
- [ ] Supabase 데이터베이스 준비됨
- [ ] Binance API 키 발급됨
- [ ] .env.prod 파일 작성됨

### **Nice to Have (권장)**
- [ ] SSL 인증서 준비
- [ ] 도메인 설정
- [ ] 모니터링 시스템 준비
- [ ] 백업 시스템 구성

## 🚨 **주의사항**

1. **보안**
   - API 키는 절대 Git에 커밋하지 않기
   - .env.prod 파일은 서버에서만 관리
   - 정기적인 보안 업데이트 계획

2. **백업**
   - 설정 파일 백업 필수
   - 데이터베이스 정기 백업
   - 복구 절차 테스트

3. **모니터링**
   - 서버 리소스 모니터링
   - 애플리케이션 로그 모니터링
   - 알림 시스템 설정

## 📞 **지원 및 연락처**

- **기술 문서**: DEPLOYMENT_README.md
- **워크플로우**: DEVELOPMENT_CHECKLIST.md
- **문제 해결**: troubleshooting 섹션 참조

---

**✅ 모든 항목 완료 후**: DEVELOPMENT_CHECKLIST.md로 진행
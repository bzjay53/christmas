# 🎄 Christmas Trading - 원격 서버 배포 가이드

## 📋 배포 아키텍처 개요

### 🏗️ **올바른 원격 서버 아키텍처**

```
[사용자] → [원격 서버: 31.220.83.213] → [Docker 컨테이너 스택]
                     ↓
    ┌─────────────────────────────────────────────────────┐
    │                 Docker Compose                      │
    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
    │  │  Frontend   │ │  Backend    │ │Orchestrator │   │
    │  │ React:3000  │ │FastAPI:8080 │ │  Python     │   │
    │  └─────────────┘ └─────────────┘ └─────────────┘   │
    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
    │  │ PostgreSQL  │ │   Redis     │ │   Nginx     │   │
    │  │   :5432     │ │   :6379     │ │  :80/:443   │   │
    │  └─────────────┘ └─────────────┘ └─────────────┘   │
    └─────────────────────────────────────────────────────┘
                     ↓
         [외부 접속: http://31.220.83.213]
```

### 🔄 **JSON 기반 실제 데이터 흐름**

```
[UI 액션] → [JSON 저장] → [파일 감지] → [오케스트레이션] → [실제 거래]
    ↓             ↓            ↓             ↓            ↓
Frontend    user_actions.json  Watchdog   orchestrator.py  Binance API
   ↓             ↓            ↓             ↓            ↓
WebSocket   market_data.json  inotify    FastAPI       실제 주문
   ↓             ↓            ↓             ↓            ↓
실시간 UI    ai_signals.json   자동실행    Redis Cache   포트폴리오 업데이트
```

## 🚀 원격 서버 배포 단계

### **1단계: 원격 서버 준비**

```bash
# SSH로 원격 서버 접속
ssh root@31.220.83.213

# Docker 및 Docker Compose 설치 확인
docker --version
docker-compose --version

# Git에서 프로젝트 클론
git clone https://github.com/your-repo/christmas-trading.git
cd christmas-trading
```

### **2단계: 환경 설정**

```bash
# 프로덕션 환경 변수 설정
cp .env .env.prod

# .env.prod 편집 (중요!)
vim .env.prod
```

**`.env.prod` 설정 예시:**
```env
# === 프로덕션 설정 ===
NODE_ENV=production
VITE_APP_ENV=production

# === 원격 서버 설정 ===
VITE_BACKEND_URL=http://31.220.83.213:8080
REMOTE_SERVER_IP=31.220.83.213
REMOTE_SERVER_PORT=8080

# === Supabase (원격 클라우드) ===
VITE_SUPABASE_URL=https://qehzzsxzjijfzqkysazc.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_key

# === Binance API (실제 거래) ===
VITE_BINANCE_API_KEY=your_real_api_key
VITE_BINANCE_SECRET_KEY=your_real_secret_key
VITE_BINANCE_TESTNET=false
VITE_ENABLE_MOCK_DATA=false

# === 데이터베이스 ===
POSTGRES_PASSWORD=christmas_secure_2025

# === MCP 설정 ===
GEMINI_API_KEY=your_gemini_key
```

### **3단계: Docker 컨테이너 빌드 및 실행**

```bash
# 프로덕션 환경으로 빌드
docker-compose -f docker-compose.prod.yml build

# 백그라운드에서 실행
docker-compose -f docker-compose.prod.yml up -d

# 실행 상태 확인
docker-compose -f docker-compose.prod.yml ps
```

### **4단계: 서비스 상태 확인**

```bash
# 각 서비스 로그 확인
docker-compose -f docker-compose.prod.yml logs -f christmas-frontend
docker-compose -f docker-compose.prod.yml logs -f christmas-backend
docker-compose -f docker-compose.prod.yml logs -f christmas-orchestrator

# 포트 접근 테스트
curl http://31.220.83.213:3000/health  # Frontend
curl http://31.220.83.213:8080/health  # Backend
curl http://31.220.83.213:80           # Nginx
```

### **5단계: 외부 접속 확인**

```bash
# 방화벽 설정 확인
ufw status
ufw allow 80
ufw allow 443
ufw allow 3000
ufw allow 8080

# 포트 리스닝 확인
netstat -tlnp | grep :80
netstat -tlnp | grep :3000
netstat -tlnp | grep :8080
```

## 📁 폴더 구조 및 파일 배치

```
christmas-trading/
├── 📁 frontend/                    # React 프론트엔드
│   ├── src/
│   ├── public/
│   └── Dockerfile
├── 📁 backend/                     # Python FastAPI 백엔드
│   ├── main.py                     # 메인 API 서버
│   ├── requirements.txt
│   ├── start.sh
│   └── Dockerfile.backend
├── 📁 orchestrator/                # JSON 오케스트레이션
│   ├── orchestrator.py             # 파일 감지 & 자동 실행
│   ├── requirements.txt
│   └── Dockerfile.orchestrator
├── 📁 data/                        # JSON 데이터 저장소
│   ├── trading_signals.json        # AI 트레이딩 신호
│   ├── market_data.json           # 실시간 시장 데이터
│   ├── user_actions.json          # 사용자 액션 큐
│   └── ai_recommendations.json    # AI 추천사항
├── 📁 docs/                        # 문서
│   ├── architecture/
│   ├── deployment/
│   └── workflows/
├── docker-compose.prod.yml         # 프로덕션 Docker 설정
├── nginx.prod.conf                 # Nginx 설정
├── .env.prod                       # 프로덕션 환경변수
└── DEPLOYMENT_README.md            # 이 문서
```

## 🔄 JSON 기반 실제 데이터 흐름 워크플로우

### **1. 사용자 액션 → JSON 저장**

```typescript
// Frontend (사용자가 매수 버튼 클릭)
const handleBuyOrder = async () => {
  const action = {
    type: 'buy_order',
    symbol: 'BTCUSDT',
    quantity: 0.01,
    timestamp: new Date().toISOString()
  };
  
  // 1. JSON 파일에 저장 (더미데이터 아님!)
  await saveToJSON('/data/user_actions.json', action);
  
  // 2. 즉시 UI 업데이트 없음 (JSON → 오케스트레이션 → 실제 실행 대기)
};
```

### **2. 파일 감지 → 자동 실행**

```python
# Orchestrator (orchestrator.py)
class JSONFileHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith('user_actions.json'):
            # 파일 변화 감지 시 자동 실행
            asyncio.create_task(self.process_user_actions())

async def process_user_actions(self):
    # 1. JSON 파일 로드
    actions = load_json('user_actions.json')
    
    # 2. 각 액션을 실제 거래로 변환
    for action in actions:
        if action['status'] == 'pending':
            # 3. 리스크 체크
            if self.risk_check(action):
                # 4. 실제 바이낸스 API 호출
                result = await binance_client.create_order(...)
                # 5. 결과를 다시 JSON에 저장
                action['result'] = result
                action['status'] = 'completed'
    
    # 6. 업데이트된 JSON 저장
    save_json('user_actions.json', actions)
```

### **3. 실제 API 연동 (더미데이터 제거)**

```python
# backend/main.py
@app.post("/api/execute-order")
async def execute_real_order(order_data: Dict):
    # ❌ 더미데이터 사용 금지
    # dummy_result = {"status": "success", "fake": True}
    
    # ✅ 실제 바이낸스 API 호출
    try:
        if BINANCE_API_KEY and BINANCE_SECRET_KEY:
            # 실제 주문 생성
            order = binance_client.create_order(
                symbol=order_data['symbol'],
                side=order_data['side'],
                type='MARKET',
                quantity=order_data['quantity']
            )
            
            # 실제 결과 반환
            return {
                "status": "success",
                "order_id": order['orderId'],
                "executed_qty": order['executedQty'],
                "real_trade": True  # 실제 거래임을 표시
            }
    except Exception as e:
        # 실제 오류 처리
        return {"status": "error", "message": str(e)}
```

## 📋 개발 전 체크리스트

### **🔍 Pre-Development Checklist**

- [ ] **서버 환경 준비**
  - [ ] 원격 서버 SSH 접속 확인 (31.220.83.213)
  - [ ] Docker & Docker Compose 설치 확인
  - [ ] 방화벽 포트 개방 (80, 443, 3000, 8080)
  - [ ] SSL 인증서 준비 (선택적)

- [ ] **API 키 설정**
  - [ ] Supabase 프로젝트 생성 및 키 발급
  - [ ] Binance API 키 발급 (실제 거래용)
  - [ ] Gemini API 키 준비 (MCP용)
  - [ ] 환경변수 파일 (.env.prod) 작성

- [ ] **데이터베이스 설정**
  - [ ] Supabase 데이터베이스 스키마 생성
  - [ ] RLS (Row Level Security) 정책 적용
  - [ ] 테스트 사용자 계정 생성

- [ ] **외부 서비스 연동**
  - [ ] Binance API 연결 테스트
  - [ ] Supabase 연결 테스트
  - [ ] Redis 캐시 설정 확인

## 📋 개발 중 체크리스트

### **🔧 Development Checklist**

- [ ] **JSON 데이터 흐름 검증**
  - [ ] user_actions.json 파일 생성 확인
  - [ ] 파일 감지 시스템 (inotify) 동작 확인
  - [ ] 오케스트레이터 자동 실행 확인
  - [ ] 실제 API 호출 로그 확인

- [ ] **실제 데이터 연동**
  - [ ] 더미데이터 완전 제거 확인
  - [ ] 바이낸스 실시간 데이터 수신 확인
  - [ ] 실제 주문 실행 테스트 (소액)
  - [ ] 포트폴리오 실시간 업데이트 확인

- [ ] **오류 처리 및 복구**
  - [ ] API 연결 실패 시 재시도 로직
  - [ ] JSON 파일 손상 시 복구 메커니즘
  - [ ] WebSocket 연결 끊김 시 재연결
  - [ ] 서비스 재시작 시 상태 복구

- [ ] **성능 및 모니터링**
  - [ ] CPU/메모리 사용량 모니터링
  - [ ] API 응답 시간 측정
  - [ ] 로그 파일 자동 로테이션
  - [ ] 알림 시스템 동작 확인

## 🚀 배포 완료 후 테스트

### **외부 접속 테스트**
```bash
# 웹 브라우저에서 접속
http://31.220.83.213        # Nginx를 통한 접속
http://31.220.83.213:3000   # 직접 프론트엔드 접속
http://31.220.83.213:8080   # 백엔드 API 접속

# API 엔드포인트 테스트
curl http://31.220.83.213:8080/health
curl http://31.220.83.213:8080/api/market-data
```

### **실제 기능 테스트**
1. **로그인 기능**: Supabase 인증 테스트
2. **실시간 데이터**: 바이낸스 시세 업데이트 확인
3. **주문 기능**: 소액 테스트 거래 실행
4. **포트폴리오**: 실제 잔고 반영 확인

## 🔧 문제 해결

### **일반적인 배포 문제**

1. **포트 접근 불가**
   ```bash
   # 방화벽 확인 및 해제
   ufw status
   ufw allow 3000
   ufw allow 8080
   ```

2. **Docker 컨테이너 실행 실패**
   ```bash
   # 로그 확인
   docker-compose -f docker-compose.prod.yml logs
   
   # 컨테이너 재시작
   docker-compose -f docker-compose.prod.yml restart
   ```

3. **API 연결 실패**
   ```bash
   # 환경변수 확인
   docker-compose -f docker-compose.prod.yml exec christmas-backend env | grep BINANCE
   ```

## 📞 지원 및 연락처

- **기술 지원**: Claude Code 세션
- **문서 업데이트**: CLAUDE.md 참조
- **이슈 리포팅**: GitHub Issues

---

**✅ 배포 완료 시**: 모든 서비스가 원격 서버에서 정상 동작하며, 외부에서 웹 브라우저로 접속 가능한 상태
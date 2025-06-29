# 🎄 Christmas Trading - 개발 중 체크리스트

## 📋 Development Checklist (개발 중 체크)

### 🚀 **1. 배포 실행 및 검증**

- [ ] **배포 스크립트 실행**
  ```bash
  ./deploy.sh production
  # 모든 단계가 오류 없이 완료되어야 함
  ```

- [ ] **컨테이너 상태 확인**
  ```bash
  ssh root@31.220.83.213
  cd /root/christmas-trading
  docker-compose -f docker-compose.prod.yml ps
  
  # 예상 출력:
  # christmas-frontend    Up    0.0.0.0:3000->3000/tcp
  # christmas-backend     Up    0.0.0.0:8080->8080/tcp
  # christmas-orchestrator Up
  # christmas-db          Up    5432/tcp
  # christmas-redis       Up    6379/tcp
  ```

- [ ] **외부 접속 테스트**
  ```bash
  # 로컬에서 실행
  curl http://31.220.83.213:3000/health
  curl http://31.220.83.213:8080/health
  curl http://31.220.83.213        # Nginx 프록시
  ```

### 📄 **2. JSON 데이터 흐름 검증**

- [ ] **JSON 파일 생성 확인**
  ```bash
  ssh root@31.220.83.213
  ls -la /var/lib/docker/volumes/christmas-data/_data/
  
  # 예상 파일들:
  # trading_signals.json
  # market_data.json
  # user_actions.json
  # ai_recommendations.json
  ```

- [ ] **파일 감지 시스템 동작 확인**
  ```bash
  # 오케스트레이터 로그 확인
  docker-compose -f docker-compose.prod.yml logs christmas-orchestrator
  
  # 예상 로그: "📁 파일 감시 시작: /app/data"
  ```

- [ ] **JSON 파일 수동 변경 테스트**
  ```bash
  # 테스트용 사용자 액션 추가
  echo '{"actions":[{"type":"test","timestamp":"2025-06-29T10:00:00Z","status":"pending"}]}' > /tmp/test_action.json
  
  # 파일 복사 후 감지 확인
  docker cp /tmp/test_action.json christmas-orchestrator:/app/data/user_actions.json
  
  # 오케스트레이터 로그에서 감지 메시지 확인
  ```

- [ ] **WebSocket 연결 확인**
  ```javascript
  // 브라우저 콘솔에서 테스트
  const ws = new WebSocket('ws://31.220.83.213:8080/ws');
  ws.onopen = () => console.log('WebSocket 연결 성공');
  ws.onmessage = (event) => console.log('메시지 수신:', event.data);
  ```

### 🔄 **3. 실제 데이터 연동 검증**

- [ ] **더미데이터 제거 확인**
  ```bash
  # 코드에서 더미데이터 사용 검색
  grep -r "dummy\|fake\|mock" src/ --exclude-dir=node_modules
  grep -r "더미\|테스트" src/ --exclude-dir=node_modules
  
  # VITE_ENABLE_MOCK_DATA=false 설정 확인
  grep MOCK_DATA .env.prod
  ```

- [ ] **Binance API 실제 연동 확인**
  ```bash
  # 백엔드 로그에서 API 호출 확인
  docker-compose -f docker-compose.prod.yml logs christmas-backend | grep -i binance
  
  # 예상 로그: "✅ Binance API 연결 성공"
  ```

- [ ] **실시간 시장 데이터 수신 확인**
  ```bash
  # market_data.json 파일 내용 실시간 변화 확인
  watch -n 5 'docker exec christmas-backend cat /app/data/market_data.json | jq .timestamp'
  ```

- [ ] **Supabase 연동 확인**
  ```bash
  # 프론트엔드에서 로그인 테스트
  # 브라우저에서 http://31.220.83.213 접속 후 로그인 시도
  
  # 백엔드 로그에서 인증 요청 확인
  docker-compose -f docker-compose.prod.yml logs christmas-backend | grep -i auth
  ```

### 🧪 **4. 실제 거래 기능 테스트**

- [ ] **소액 테스트 거래 준비**
  ```bash
  # Binance 계정에 소액 USDT 잔고 확인 (최소 $10)
  # 테스트넷이 아닌 실제 계정 사용 시 주의!
  ```

- [ ] **Quick Settings 기능 테스트**
  - [ ] $100 주문 버튼 클릭
  - [ ] Stop Loss 슬라이더 조작
  - [ ] Take Profit 슬라이더 조작  
  - [ ] Risk Level 선택
  - [ ] 실제 매수/매도 버튼 클릭

- [ ] **거래 실행 로그 확인**
  ```bash
  # 거래 실행 시 로그 모니터링
  docker-compose -f docker-compose.prod.yml logs -f christmas-backend | grep -i "order\|trade"
  
  # 예상 로그: "Buy order executed: {order_id}"
  ```

- [ ] **JSON 기반 주문 처리 확인**
  ```bash
  # user_actions.json에 주문이 기록되는지 확인
  docker exec christmas-backend cat /app/data/user_actions.json | jq '.actions[-1]'
  
  # 오케스트레이터가 처리했는지 확인
  # status: "pending" → "processed" 변화 확인
  ```

### 🛡️ **5. 보안 및 오류 처리 검증**

- [ ] **API 키 보안 확인**
  ```bash
  # API 키가 로그에 노출되지 않는지 확인
  docker-compose -f docker-compose.prod.yml logs | grep -i "api.*key"
  # 결과가 없어야 함
  
  # 환경 변수에서만 사용되는지 확인
  docker exec christmas-backend env | grep BINANCE | head -c 50
  ```

- [ ] **연결 실패 시 재시도 로직 테스트**
  ```bash
  # 인터넷 연결 일시 차단 시뮬레이션
  # Docker 컨테이너 네트워크 일시 차단 후 복구
  docker network disconnect christmas-network christmas-backend
  sleep 10
  docker network connect christmas-network christmas-backend
  
  # 자동 재연결 로그 확인
  ```

- [ ] **데이터베이스 연결 장애 복구 테스트**
  ```bash
  # PostgreSQL 컨테이너 재시작
  docker-compose -f docker-compose.prod.yml restart christmas-db
  
  # 백엔드의 자동 재연결 확인
  ```

### 📊 **6. 성능 및 모니터링 검증**

- [ ] **시스템 리소스 모니터링**
  ```bash
  # 서버 리소스 사용량 확인
  ssh root@31.220.83.213 'top -bn1 | head -20'
  ssh root@31.220.83.213 'df -h'
  ssh root@31.220.83.213 'free -h'
  ```

- [ ] **컨테이너별 리소스 사용량**
  ```bash
  docker stats --no-stream
  
  # CPU/메모리 사용량이 정상 범위인지 확인
  # Frontend: <100MB RAM, <5% CPU
  # Backend: <200MB RAM, <10% CPU  
  # Orchestrator: <50MB RAM, <5% CPU
  ```

- [ ] **API 응답 시간 측정**
  ```bash
  # 주요 API 엔드포인트 응답 시간 확인
  time curl http://31.220.83.213:8080/api/market-data
  time curl http://31.220.83.213:8080/api/trading-signals
  
  # 응답 시간 < 2초 목표
  ```

- [ ] **로그 파일 크기 및 로테이션 확인**
  ```bash
  # 로그 파일 크기 확인
  docker exec christmas-backend ls -lh /app/logs/
  docker exec christmas-orchestrator ls -lh /app/logs/
  
  # 너무 큰 로그 파일이 있는지 확인 (>100MB 주의)
  ```

### 🔧 **7. 장애 상황 대응 테스트**

- [ ] **개별 서비스 재시작 테스트**
  ```bash
  # 각 서비스를 개별적으로 재시작하며 영향 확인
  docker-compose -f docker-compose.prod.yml restart christmas-frontend
  docker-compose -f docker-compose.prod.yml restart christmas-backend
  docker-compose -f docker-compose.prod.yml restart christmas-orchestrator
  ```

- [ ] **전체 시스템 재시작 테스트**
  ```bash
  # 전체 시스템 재시작 후 자동 복구 확인
  docker-compose -f docker-compose.prod.yml down
  docker-compose -f docker-compose.prod.yml up -d
  
  # 모든 서비스 정상 시작 확인
  ```

- [ ] **데이터 지속성 확인**
  ```bash
  # 재시작 후 JSON 데이터 유지 확인
  docker exec christmas-backend ls -la /app/data/
  
  # 이전 데이터가 유지되는지 확인
  ```

### 📱 **8. 사용자 경험 테스트**

- [ ] **웹 브라우저 접속 테스트**
  - [ ] Chrome에서 http://31.220.83.213 접속
  - [ ] Firefox에서 접속 테스트
  - [ ] 모바일 브라우저에서 접속 테스트

- [ ] **주요 기능 사용자 시나리오**
  - [ ] 회원가입 → 로그인 → 대시보드 확인
  - [ ] 실시간 차트 데이터 확인
  - [ ] 포트폴리오 페이지 확인
  - [ ] Quick Settings로 소액 거래 테스트
  - [ ] 거래 내역 확인

- [ ] **실시간 업데이트 확인**
  - [ ] 페이지를 열어둔 상태에서 실시간 가격 업데이트 확인
  - [ ] WebSocket 연결 상태 확인
  - [ ] 새로고침 없이 데이터 업데이트 확인

### 🎯 **9. 비즈니스 로직 검증**

- [ ] **AI 트레이딩 신호 생성 확인**
  ```bash
  # AI 신호 파일 업데이트 확인
  watch -n 30 'docker exec christmas-backend cat /app/data/ai_recommendations.json | jq .timestamp'
  ```

- [ ] **리스크 관리 시스템 동작 확인**
  - [ ] 과도한 주문 시 거부 메시지
  - [ ] 구독 티어별 제한 확인
  - [ ] Stop Loss 자동 실행 (시뮬레이션)

- [ ] **포트폴리오 실시간 계산 확인**
  - [ ] 거래 후 포트폴리오 자동 업데이트
  - [ ] 손익 계산 정확성 확인
  - [ ] 잔고 반영 확인

## ✅ **최종 검증 체크리스트**

### **Critical (치명적 - 반드시 통과)**
- [ ] 외부에서 웹사이트 접속 가능
- [ ] 로그인/회원가입 기능 정상 동작
- [ ] 실시간 데이터 업데이트 확인
- [ ] JSON 파일 기반 데이터 흐름 동작
- [ ] 소액 실제 거래 성공
- [ ] 오케스트레이션 시스템 정상 동작

### **High (높음 - 중요)**
- [ ] 모든 페이지 정상 렌더링
- [ ] WebSocket 실시간 연결 안정
- [ ] 오류 처리 및 복구 메커니즘 동작
- [ ] 성능 최적화 (응답시간 < 2초)

### **Medium (중간 - 권장)**
- [ ] 모니터링 시스템 동작
- [ ] 로그 시스템 정상 동작
- [ ] 보안 설정 완료

### **Low (낮음 - 선택적)**
- [ ] SSL 인증서 적용
- [ ] 도메인 연결
- [ ] 고급 모니터링 설정

## 🚨 **실패 시 대응 방안**

### **배포 실패**
```bash
# 로그 확인
docker-compose -f docker-compose.prod.yml logs

# 컨테이너 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 재배포
docker-compose -f docker-compose.prod.yml down
./deploy.sh production
```

### **API 연결 실패**
```bash
# 환경 변수 확인
docker exec christmas-backend env | grep -E "(BINANCE|SUPABASE)"

# API 키 유효성 재확인
# .env.prod 파일 수정 후 재배포
```

### **성능 문제**
```bash
# 리소스 사용량 확인
docker stats

# 로그에서 성능 병목 확인
docker-compose -f docker-compose.prod.yml logs | grep -i "slow\|timeout\|error"
```

## 📞 **지원 및 다음 단계**

- **성공 시**: 프로덕션 모니터링 및 사용자 피드백 수집
- **실패 시**: 문제 해결 후 체크리스트 재실행
- **부분 성공**: 우선순위에 따라 단계적 해결

---

**✅ 모든 Critical 항목 통과 시**: 프로덕션 서비스 준비 완료!
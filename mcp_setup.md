# 🎄 Christmas Trading MCP 서버 설정 가이드

## 📋 개요

Christmas Trading 프로젝트를 위한 통합 MCP 서버 시스템입니다. Gemini 2.5 Pro 코드 리뷰와 실시간 사용량 모니터링을 결합한 강력한 개발 지원 도구입니다.

## 🏗️ 시스템 구조

```
Christmas Trading MCP System
├── 🤖 integrated_mcp_server.py      # 통합 MCP 서버 (메인)
├── 📊 christmas_usage_monitor.py    # 사용량 모니터링 전용
├── 🧠 gemini_mcp_server.py         # Gemini 코드 리뷰 전용 (기존)
└── 📈 usage_monitor.db             # SQLite 모니터링 데이터
```

## ⚡ 빠른 설정

### 1. 의존성 설치

```bash
# 필수 패키지 설치
pip install google-generativeai psutil requests sqlite3

# 또는 requirements.txt 업데이트 후
pip install -r requirements.txt
```

### 2. 환경변수 설정

```bash
# .env 파일에 추가
export GEMINI_API_KEY="your_gemini_api_key_here"
export TELEGRAM_BOT_TOKEN="7889451962:AAE3IwomldkE9jXxgmJHWQOLIU-yegU5X2Y"
export TELEGRAM_CHAT_ID="1394057485"
export ALERT_WEBHOOK_URL="https://hooks.slack.com/your/webhook/url"  # 선택사항
```

### 3. MCP 서버 실행

```bash
# 통합 서버 실행 (권장)
python /root/dev/christmas-trading/integrated_mcp_server.py

# 또는 개별 서버 실행
python /root/dev/christmas-trading/christmas_usage_monitor.py
python /root/dev/christmas-trading/gemini_mcp_server.py
```

## 🛠️ Claude Code와 연동

### 1. Claude Code 설정 파일에 추가

```json
{
  "mcpServers": {
    "christmas-trading": {
      "command": "python",
      "args": ["/root/dev/christmas-trading/integrated_mcp_server.py"],
      "env": {
        "GEMINI_API_KEY": "your_api_key",
        "TELEGRAM_BOT_TOKEN": "your_bot_token",
        "TELEGRAM_CHAT_ID": "your_chat_id"
      }
    }
  }
}
```

### 2. 사용 가능한 도구

#### 🤖 Gemini 코드 리뷰 도구
- `gemini_code_review`: 크리스마스 트레이딩 특화 코드 리뷰
- `gemini_migration_analysis`: Supabase → Firebase 마이그레이션 분석

#### 📊 모니터링 도구
- `usage_dashboard`: 통합 사용량 대시보드
- `track_api_usage`: API 사용량 수동 추적
- `integrated_status`: 프로젝트 전체 상태

#### 🔄 마이그레이션 도구
- `migration_planning`: 마이그레이션 계획 수립

## 📊 사용량 모니터링 기능

### 자동 추적 메트릭
- **AI API 사용량**: OpenAI, Gemini, Claude 토큰 사용량
- **Trading API**: KIS API 호출 빈도 및 응답 시간
- **시스템 리소스**: CPU, 메모리, 디스크 사용률
- **데이터베이스**: 연결 수, 쿼리 성능

### 알림 시스템
- **Telegram**: 실시간 알림 (임계치 초과 시)
- **Webhook**: Slack/Discord 연동 (선택사항)
- **로그**: 파일 기반 로깅

### 임계치 기본 설정
```python
알림 임계치:
- OpenAI 토큰 사용량: 80% (경고), 95% (치명적)
- KIS API 호출: 90% (경고)
- 시스템 메모리: 80% (경고)
- 시스템 CPU: 90% (치명적)
```

## 🎯 실제 사용 예시

### 1. 코드 리뷰 실행
```python
# Claude Code에서 실행
await gemini_code_review({
    "code": "your_python_code_here",
    "language": "python",
    "context": "Supabase to Firebase migration",
    "migration_focus": true
})
```

### 2. 사용량 대시보드 확인
```python
# 상세 대시보드 조회
await usage_dashboard({"detailed": true})

# 간단 요약 조회
await usage_dashboard({"detailed": false})
```

### 3. API 사용량 추적
```python
# OpenAI API 호출 추적
await track_api_usage({
    "service": "openai",
    "operation": "chat_completion",
    "tokens_used": 1500,
    "cost": 0.03
})
```

### 4. 프로젝트 상태 확인
```python
# 전체 프로젝트 상태
await integrated_status({"include_alerts": true})
```

## 🔧 고급 설정

### 커스텀 알림 임계치 설정
```python
# 새로운 임계치 추가
await set_alert_threshold({
    "service": "firebase",
    "metric": "api_call",
    "threshold": 85.0,
    "alert_type": "warning"
})
```

### 데이터베이스 백업
```bash
# SQLite 백업
cp usage_monitor.db usage_monitor_backup_$(date +%Y%m%d).db
```

### 로그 관리
```bash
# 로그 파일 위치
tail -f /root/dev/christmas-trading/logs/integrated_mcp.log
tail -f /root/dev/christmas-trading/logs/usage_monitor.log
```

## 🚨 문제 해결

### 1. Gemini API 연결 실패
```bash
# API 키 확인
echo $GEMINI_API_KEY

# 네트워크 연결 테스트
curl -H "Authorization: Bearer $GEMINI_API_KEY" \
     https://generativelanguage.googleapis.com/v1/models
```

### 2. 텔레그램 알림 실패
```bash
# 봇 토큰 확인
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe"

# 채팅 ID 확인
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates"
```

### 3. 데이터베이스 권한 문제
```bash
# SQLite 파일 권한 확인
ls -la usage_monitor.db

# 권한 수정
chmod 666 usage_monitor.db
```

### 4. MCP 서버 연결 문제
```bash
# 서버 실행 상태 확인
ps aux | grep mcp_server

# 포트 사용 확인
netstat -tulpn | grep :8000
```

## 📈 성능 최적화

### 1. 모니터링 간격 조정
```python
# 시스템 리소스 모니터링 간격 (기본: 30초)
await start_monitoring(interval=60)  # 1분으로 변경
```

### 2. 데이터 정리
```sql
-- 30일 이전 데이터 삭제
DELETE FROM usage_metrics 
WHERE timestamp < datetime('now', '-30 days');

-- 알림 히스토리 정리
DELETE FROM alert_history 
WHERE timestamp < datetime('now', '-7 days');
```

### 3. 메모리 사용량 최적화
```python
# 큰 데이터 조회 시 제한 설정
dashboard = await get_usage_dashboard(limit=1000)
```

## 🎯 다음 단계

1. **Firebase 연동 준비**: 마이그레이션 도구 테스트
2. **실시간 대시보드**: 웹 인터페이스 구축
3. **AI 예측 모델**: 사용량 패턴 예측
4. **자동 스케일링**: 리소스 자동 조절

---

## 📞 지원 및 문의

- **로그 파일**: `/root/dev/christmas-trading/logs/`
- **설정 파일**: `/root/dev/christmas-trading/.env`
- **데이터베이스**: `/root/dev/christmas-trading/usage_monitor.db`

**설정 완료 후 Claude Code에서 MCP 도구들을 바로 사용할 수 있습니다!** 🎉
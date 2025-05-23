# 텔레그램 봇 설정 가이드

## 🤖 텔레그램 봇 생성 (3분)

### 1단계: 봇 생성
1. 텔레그램에서 `@BotFather` 검색 후 대화 시작
2. `/newbot` 명령어 입력
3. 봇 이름 입력 (예: Christmas Trading Bot)
4. 봇 사용자명 입력 (예: christmas_trading_bot)
5. **봇 토큰 복사** (예: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)

### 2단계: 채팅 ID 확인
1. 위에서 만든 봇에게 아무 메시지나 전송
2. `@userinfobot`에게 메시지 전송
3. **Chat ID 복사** (예: 123456789)

### 3단계: 환경 변수 설정

**Windows (PowerShell):**
```powershell
$env:TELEGRAM_BOT_TOKEN="여기에_봇_토큰_입력"
$env:TELEGRAM_CHAT_ID="여기에_채팅_ID_입력"
```

**Windows (영구 설정):**
```powershell
[Environment]::SetEnvironmentVariable("TELEGRAM_BOT_TOKEN", "여기에_봇_토큰_입력", "User")
[Environment]::SetEnvironmentVariable("TELEGRAM_CHAT_ID", "여기에_채팅_ID_입력", "User")
```

### 4단계: 테스트
```bash
python test_real_features.py
```

## 🎯 완료 후 받을 수 있는 알림들:

- 🔔 시스템 시작/종료 알림
- 📈 주문 체결 알림 (매수/매도)
- 💰 수익/손실 알림
- ⚠️ 위험 상황 경고
- 📊 일일 성과 요약

## 📱 예시 알림 메시지:

```
🔔 시스템 알림
📅 2025-05-23 22:45:30

🎄 Christmas 트레이딩 봇이 시작되었습니다!
```

```
✅ 주문 FILLED
📅 2025-05-23 22:46:15

🟢 삼성전자
📈 BUY 100주
💰 75,000원
📊 상태: filled
```

```
📈 삼성전자 수익: 150,000원 
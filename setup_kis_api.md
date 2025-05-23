# 한국투자증권 API 설정 가이드

## 🏦 한국투자증권 OpenAPI 신청 (10분)

### 1단계: 계좌 개설
1. [한국투자증권 홈페이지](https://securities.koreainvestment.com) 접속
2. 비대면 계좌 개설 (온라인으로 가능)
3. 모의투자 계좌도 함께 신청

### 2단계: OpenAPI 신청
1. **KIS 개발자센터** 접속: https://apiportal.koreainvestment.com
2. **회원가입** 후 로그인
3. **API 신청** → **국내주식 OpenAPI** 선택
4. **모의투자** 체크 (실전투자는 나중에 별도 신청)
5. **약관 동의** 후 신청

### 3단계: 앱키 발급 (즉시)
신청 승인 후 다음 정보를 받게 됩니다:
- **APP KEY** (앱키)
- **APP SECRET** (앱시크릿)
- **계좌번호** (모의투자용)

## ⚙️ 환경 변수 설정

**Windows PowerShell:**
```powershell
# 한국투자증권 API 설정
$env:KIS_APP_KEY="당신의_앱키"
$env:KIS_APP_SECRET="당신의_앱시크릿"  
$env:KIS_ACCOUNT_NO="당신의_계좌번호"
$env:KIS_MOCK="true"  # 모의투자: true, 실전투자: false

# 텔레그램 설정 (선택사항)
$env:TELEGRAM_BOT_TOKEN="당신의_봇_토큰"
$env:TELEGRAM_CHAT_ID="당신의_채팅_ID"
```

**영구 설정 (재부팅 후에도 유지):**
```powershell
[Environment]::SetEnvironmentVariable("KIS_APP_KEY", "당신의_앱키", "User")
[Environment]::SetEnvironmentVariable("KIS_APP_SECRET", "당신의_앱시크릿", "User")
[Environment]::SetEnvironmentVariable("KIS_ACCOUNT_NO", "당신의_계좌번호", "User")
[Environment]::SetEnvironmentVariable("KIS_MOCK", "true", "User")
```

## 🎯 실전 투자 전환 (선택사항)

⚠️ **주의**: 실전 투자는 실제 돈이 들어갑니다!

### 실전 투자 신청
1. KIS 개발자센터에서 **실전투자 API** 별도 신청
2. 실제 증권계좌에 투자금 입금
3. 환경변수 변경: `$env:KIS_MOCK="false"`

### 안전 설정
- 초기 투자금: 소액 (10-50만원)으로 시작
- 손실 한도: 일일 3% 이하
- 포지션 크기: 총 자산의 10% 이하

## 📊 지원 종목

### 기본 종목 (코드)
- **005930**: 삼성전자
- **000660**: SK하이닉스  
- **035420**: 네이버
- **035720**: 카카오
- **051910**: LG화학

### 커스터마이징
`real_trading_system.py`에서 거래 종목 변경 가능:
```python
'symbols': ['005930', '000660', '035420']  # 원하는 종목 코드로 변경
```

## 🕒 거래 시간

- **정규거래**: 09:00 ~ 15:30
- **동시호가**: 08:00 ~ 09:00 (개장전), 15:30 ~ 16:00 (폐장후)
- **시간외거래**: 16:00 ~ 18:00

## 🚀 실행 방법

```bash
# 1. 필요한 패키지 설치
pip install aiohttp numpy pandas TA-Lib pytz

# 2. 실전 거래 시스템 실행
python real_trading_system.py
```

## 📱 모니터링

### 로그 파일
- `trading.log`: 모든 거래 기록

### 텔레그램 알림 (설정시)
- 시스템 시작/종료
- 매수/매도 신호
- 손익 실시간 알림
- 위험 상황 경고

### 웹 대시보드
```bash
python real_dashboard.py
```
http://localhost:5555 접속하여 실시간 모니터링

## ❗ 주의사항

1. **모의투자로 충분히 테스트** 후 실전 투자
2. **손실 한도 준수** (일일 3%, 총 포지션 10%)
3. **네트워크 안정성** 확인 (Wi-Fi보다 유선 권장)
4. **시장 변동성** 주의 (급락장에서는 수동 개입)
5. **API 호출 한도** 준수 (초당 20회 제한)

## 🆘 문제 해결

### API 연결 실패
- 앱키/시크릿 재확인
- 계좌번호 정확성 확인
- 네트워크 방화벽 설정

### 주문 실패
- 거래 시간 확인
- 계좌 잔고 확인
- 종목 코드 정확성

### 텔레그램 알림 안됨
- 봇 토큰 재확인
- 채팅 ID 재확인
- 봇과 첫 대화 시작 
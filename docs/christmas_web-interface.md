# Christmas 웹 인터페이스 (Web Interface)

**버전:** 0.1.0  
**업데이트:** 2023-11-05

## 개요

Christmas 웹 인터페이스는 트레이딩 시스템의 상태를 모니터링하고 관리할 수 있는 사용자 친화적인 대시보드를 제공합니다. Flask 프레임워크를 기반으로 구현되었으며, 현대적인 반응형 디자인을 통해 모바일 및 데스크톱에서 원활한 경험을 제공합니다.

## 주요 기능

- **실시간 대시보드**: 계좌 정보, 포트폴리오 가치, 시장 상태, 최근 거래 내역 확인
- **포지션 및 주문 관리**: 현재 포지션 및 주문 목록 조회, 필터링, 검색
- **백테스트 실행 및 결과 분석**: 전략 백테스트 설정, 실행, 결과 시각화
- **설정 관리**: API 키, 알림, 위험 관리, 매매 설정 구성

## 기술 스택

- **웹 프레임워크**: Flask 2.3.3
- **템플릿 엔진**: Jinja2
- **스타일링**: Bootstrap 5
- **차트 라이브러리**: Chart.js 3.7.0
- **아이콘**: Font Awesome 6
- **JavaScript 라이브러리**: jQuery, Bootstrap Bundle
- **자산 관리**: Flask-Assets

## 디렉토리 구조

```
app/web/
├── __init__.py            # 패키지 초기화
├── main.py                # 애플리케이션 생성 및 설정
├── run.py                 # 웹 서버 실행 스크립트
├── routes/                # 라우트 정의
│   ├── __init__.py
│   ├── dashboard.py       # 대시보드 라우트
│   ├── backtest.py        # 백테스트 라우트
│   └── settings.py        # 설정 라우트
├── static/                # 정적 파일
│   ├── css/
│   │   └── dashboard.css  # 대시보드 스타일시트
│   └── js/
│       └── dashboard.js   # 대시보드 JavaScript
└── templates/             # 템플릿 파일
    ├── layouts/
    │   └── base.html      # 기본 레이아웃 템플릿
    ├── dashboard/
    │   ├── index.html     # 대시보드 메인 페이지
    │   ├── positions.html # 포지션 페이지
    │   ├── orders.html    # 주문 페이지
    │   └── trades.html    # 거래 내역 페이지
    ├── backtest/
    │   ├── index.html     # 백테스트 메인 페이지
    │   ├── create.html    # 백테스트 생성 페이지
    │   ├── view.html      # 백테스트 결과 페이지
    │   ├── comparison.html # 전략 비교 페이지
    │   └── optimization.html # 전략 최적화 페이지
    ├── settings/
    │   ├── index.html     # 설정 메인 페이지
    │   ├── api_keys.html  # API 키 관리 페이지
    │   ├── notifications.html # 알림 설정 페이지
    │   ├── risk_management.html # 위험 관리 페이지
    │   ├── trading.html   # 매매 설정 페이지
    │   └── system.html    # 시스템 설정 페이지
    └── error/
        ├── 404.html       # 404 오류 페이지
        └── 500.html       # 500 오류 페이지
```

## 라우트 구조

### 대시보드 라우트

```python
Blueprint('dashboard', __name__, url_prefix='/dashboard')
```

| 경로 | 메소드 | 설명 |
|------|--------|------|
| `/` | GET | 대시보드 메인 페이지 |
| `/positions` | GET | 포지션 목록 페이지 |
| `/orders` | GET | 주문 목록 페이지 |
| `/trades` | GET | 거래 내역 페이지 |
| `/pnl-chart-data` | GET | PnL 차트 데이터 API |
| `/portfolio-chart-data` | GET | 포트폴리오 차트 데이터 API |

### 백테스트 라우트

```python
Blueprint('backtest', __name__, url_prefix='/backtest')
```

| 경로 | 메소드 | 설명 |
|------|--------|------|
| `/` | GET | 백테스트 메인 페이지 |
| `/create` | GET/POST | 백테스트 생성 페이지 |
| `/view/<backtest_id>` | GET | 백테스트 결과 조회 |
| `/results/<backtest_id>` | GET | 백테스트 결과 JSON API |
| `/optimization` | GET | 전략 최적화 페이지 |
| `/comparison` | GET | 전략 비교 페이지 |

### 설정 라우트

```python
Blueprint('settings', __name__, url_prefix='/settings')
```

| 경로 | 메소드 | 설명 |
|------|--------|------|
| `/` | GET | 설정 메인 페이지 |
| `/api-keys` | GET | API 키 관리 페이지 |
| `/api-keys/create` | GET/POST | API 키 생성 페이지 |
| `/notifications` | GET | 알림 설정 페이지 |
| `/notifications/save` | POST | 알림 설정 저장 |
| `/risk-management` | GET | 위험 관리 설정 페이지 |
| `/risk-management/save` | POST | 위험 관리 설정 저장 |
| `/trading` | GET | 매매 설정 페이지 |
| `/trading/save` | POST | 매매 설정 저장 |
| `/system` | GET | 시스템 설정 페이지 |

## 사용자 인터페이스

### 대시보드 화면

대시보드 메인 화면은 다음과 같은 주요 구성 요소를 포함합니다:

1. **계좌 정보 카드**: 계좌 잔고, 포트폴리오 가치, 오늘의 수익, 포지션 정보
2. **시장 상태 카드**: 현재 시장 상태, 다음 시장 이벤트, 자동 매매 활성화 여부
3. **자산 배분 카드**: 현금, 주식, 선물 등 자산 배분 비율
4. **일별 수익률 차트**: 설정 가능한 기간(1주, 1개월, 3개월)별 수익률 추이
5. **최근 거래 테이블**: 최근 실행된 거래 내역

### 반응형 디자인

모든 페이지는 다음과 같은 반응형 레이아웃을 따릅니다:

- **데스크톱**: 좌측 사이드바 고정, 넓은 화면에 최적화된 레이아웃
- **태블릿**: 접을 수 있는 사이드바, 컴포넌트 재배치
- **모바일**: 상단 내비게이션 메뉴, 세로 배치 컴포넌트

## API 통합

웹 인터페이스는 다음과 같은 방식으로 백엔드 API와 통합됩니다:

1. **데이터 요청**: API 엔드포인트(`/api/...`)를 통해 데이터 요청
2. **인증**: API 요청 시 사용자 세션 토큰 포함
3. **실시간 업데이트**: 필요한 경우 WebSocket을 통한 실시간 데이터 수신
4. **오류 처리**: API 오류 발생 시 사용자 친화적인 메시지 표시

## 보안 고려사항

1. **CSRF 보호**: 모든 폼에 CSRF 토큰 적용
2. **XSS 방지**: 템플릿 엔진의 자동 이스케이프 기능 활용
3. **입력 검증**: 클라이언트 및 서버 측 모두에서 사용자 입력 검증
4. **세션 관리**: 안전한 세션 쿠키 설정 및 정기적인 갱신

## 성능 최적화

1. **정적 자산 번들링**: CSS/JS 파일 통합 및 압축
2. **지연 로딩**: 필요한 경우 이미지 및 스크립트 지연 로딩
3. **캐싱**: 정적 자산 및 API 응답에 적절한 캐시 헤더 설정
4. **비동기 로딩**: 주요 콘텐츠 로드 후 비동기적으로 추가 데이터 로드

## 개발 가이드라인

1. **코드 스타일**: PEP 8 및 Flask 권장 패턴 준수
2. **템플릿 구성**: 중복을 최소화하기 위해 템플릿 상속 활용
3. **JavaScript 모듈화**: 기능별 분리된 JS 모듈 사용
4. **반응형 디자인**: 모바일 우선 접근 방식 적용

## 배포 방법

Docker Compose를 통해 웹 인터페이스 서비스를 배포할 수 있습니다:

```bash
# 웹 인터페이스만 실행
docker-compose up web

# 전체 시스템 실행
docker-compose up
```

환경 변수:
- `FLASK_APP`: app.web.main
- `FLASK_DEBUG`: True/False
- `FLASK_PORT`: 5000 (기본값)
- `FLASK_HOST`: 0.0.0.0 (기본값)
- `FLASK_SECRET_KEY`: 세션 암호화에 사용되는 비밀 키

## 참조

- [Flask 공식 문서](https://flask.palletsprojects.com/)
- [Bootstrap 5 문서](https://getbootstrap.com/docs/5.0/)
- [Chart.js 문서](https://www.chartjs.org/docs/) 
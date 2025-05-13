# Christmas 프로젝트 문서

<figure markdown>
  ![Christmas 로고](https://via.placeholder.com/150x150.png?text=Christmas){ width="150" }
  <figcaption>초단타 자동 매매 플랫폼</figcaption>
</figure>

## 소개

**Christmas**는 Docker 컨테이너 기반의 초단타(스켈핑) 자동 매매 플랫폼으로, **모든 매수·매도에서 실패 없이 이익을 실현(100% Win-Rate)**하는 것을 목표로 합니다. 데이터 수집·분석·주문 실행 모듈을 마이크로서비스화하고, Vercel 서버리스 웹 UI 및 Python Telegram Bot을 연동하여 실시간 차트·매매 현황·코드 업로드 기능을 제공합니다.

## 주요 특징

- **100% Win-Rate**: 모든 트레이드에서 손실 없이 이익을 보장하는 자동화 전략
- **스켈핑 전략**: RSI(14), MACD(12,26,9), 볼린저 밴드(20σ±2) 기반의 1분 이하 초단타 매매
- **컨테이너화**: Docker 멀티스테이지 빌드로 빌드·런타임 분리, 이미지 크기 최소화
- **서버리스 호스팅**: Vercel Python Functions(Flask/FastAPI)로 백엔드 및 React SPA 배포
- **실시간 알림**: `python-telegram-bot` 라이브러리로 매매 이벤트·오류 알림
- **CI/CD**: GitHub Actions → Docker Hub → Vercel 배포 파이프라인 자동화

## 시작하기

### 필수 조건

- Python 3.10+
- Docker 및 Docker Compose
- Node.js 18+

### 설치

1. 저장소 클론:
   ```bash
   git clone https://github.com/yourusername/christmas.git
   cd christmas
   ```

2. Python 의존성 설치:
   ```bash
   poetry install
   ```

3. Docker 컨테이너 실행:
   ```bash
   docker-compose up -d
   ```

## 프로젝트 구조

```
.
├── app/                     # 주요 애플리케이션 코드
│   ├── auth/                # 인증 모듈
│   ├── ingestion/           # 시장 데이터 수집 (REST, WebSocket)
│   ├── analysis/            # 기술·심리 분석 엔진
│   ├── strategies/          # 스켈핑 전략 구현
│   ├── execution/           # 주문 실행 모듈
│   ├── notification/        # Telegram Bot 연동
│   └── api/                 # FastAPI 라우터 및 서버리스 핸들러
├── config/                  # 환경별 설정 (YAML/JSON)
├── scripts/                 # 운영 스크립트(Docker, DB 마이그레이션)
├── tests/                   # pytest 테스트 케이스
│   ├── unit/
│   └── integration/
├── docs/                    # 프로젝트 문서(.md)
├── docker-compose.yml       # 로컬 개발용 Compose 정의
├── Dockerfile               # 멀티스테이지 이미지 빌드
├── pyproject.toml           # Python 프로젝트 설정
└── README.md                # 프로젝트 개요 및 시작 가이드
```

## 문서 가이드

이 문서 사이트는 Christmas 프로젝트의 다양한 측면을 설명합니다:

- **프로젝트 개요**: 프로젝트 목표, 요구사항, 사용자 플로우
- **아키텍처**: 시스템 구조, 컴포넌트 간 상호작용, 데이터 흐름
- **개발 가이드**: 코드 품질, 테스트, API 참조
- **운영**: 배포, 모니터링, 보안, 성능 최적화
- **RAG 및 리팩토링**: 프로젝트 내 지식 저장소 활용 방법
- **협업**: 팀 작업 절차 및 문서 구조
- **프로젝트 관리**: 일정, 진행 상황, 완료 보고서

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 
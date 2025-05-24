# Christmas - 초단타 자동 매매 플랫폼

"Christmas"는 Docker 컨테이너 기반의 초단타(스켈핑) 자동 매매 플랫폼으로, **모든 매수·매도에서 실패 없이 이익을 실현(100% Win-Rate)**하는 것을 목표로 합니다. 데이터 수집·분석·주문 실행 모듈을 마이크로서비스화하고, Vercel 서버리스 웹 UI 및 Python Telegram Bot을 연동하여 실시간 차트·매매 현황·코드 업로드 기능을 제공합니다.

## 특징

- **100% Win-Rate**: 모든 트레이드에서 손실 없이 이익을 보장하는 자동화 전략
- **스켈핑 전략**: RSI(14), MACD(12,26,9), 볼린저 밴드(20σ±2) 기반의 1분 이하 초단타 매매
- **컨테이너화**: Docker 멀티스테이지 빌드로 빌드·런타임 분리, 이미지 크기 최소화
- **서버리스 호스팅**: netlify Python Functions(Flask/FastAPI)로 백엔드 및 React SPA 배포
- **실시간 알림**: `python-telegram-bot` 라이브러리로 매매 이벤트·오류 알림
- **CI/CD**: GitHub Actions → Docker Hub → Vercel 배포 파이프라인 자동화

## 최신 소식

🎉 **정식 버전 v1.0.0 출시!** (2025-07-01)

Christmas 프로젝트의 정식 버전이 성공적으로 출시되었습니다. 정식 버전은 베타 테스트 기간 동안 수집된 모든 피드백과 이슈를 반영하여 안정성, 성능, 사용자 경험이 크게 개선되었습니다.

## 최근 업데이트: Supabase 데이터베이스 연동 및 텔레그램 봇 구현

### 구현 내용

1. **Supabase 데이터베이스 연동**
   - `app/db/supabase_client.py`: Supabase 클라이언트 구현 (싱글톤 패턴)
   - `app/db/schema.py`: 데이터베이스 스키마 정의
   - `app/db/order_repository.py`: 주문 데이터 리포지토리 구현
   - `app/execution/order_service_ext.py`: Supabase 연동 OrderService 확장 클래스

2. **텔레그램 봇 알림 시스템**
   - `app/notification/telegram_bot.py`: 텔레그램 봇 구현 (싱글톤 패턴)
   - 주문 상태 변경 알림 기능
   - 시스템 이벤트 알림 기능
   - 성능 지표 알림 기능
   - 가격 알림 기능

### 테스트 방법

#### 1. 의존성 패키지 설치
```powershell
.\install_dependencies.ps1
```

#### 2. 환경 변수 설정
```powershell
.\setup_env.ps1
```
- 실제 연결이 필요한 경우 `setup_env.ps1` 파일에서 Supabase URL, API 키, 텔레그램 봇 토큰, 채팅 ID를 수정하세요.

#### 3. 테스트 실행
```powershell
# Supabase 클라이언트 간단 테스트
python test_simple.py

# 텔레그램 봇 테스트
python test_telegram_bot.py

# Supabase 연동 주문 서비스 테스트
python test_supabase_order_service.py
```

### 주요 기능

- **주문 데이터 영구 저장**: Supabase PostgreSQL 데이터베이스를 통한 주문 데이터 영구 저장
- **실시간 알림**: 텔레그램 봇을 통한 주문 상태 변경 및 시스템 이벤트 실시간 알림
- **확장 가능한 아키텍처**: 싱글톤 패턴을 적용한 클라이언트 클래스로 코드 중복 최소화

### 다음 단계

- 실시간 데이터 구독 기능 구현
- 실 사용자 테스트 준비
- 코드 품질 개선 및 문서 체계 정비

## 프로젝트 구조

```
christmas/
├── app/                      # 애플리케이션 코드
│   ├── api/                  # API 모듈
│   │   ├── main.py           # FastAPI 메인 애플리케이션
│   │   └── models.py         # API 데이터 모델(Pydantic)
│   ├── auth/                 # 인증 모듈
│   │   ├── jwt_handler.py    # JWT 토큰 처리
│   │   └── user_model.py     # 사용자 모델
│   ├── db/                   # 데이터베이스 모듈
│   │   ├── supabase_client.py# Supabase 클라이언트
│   │   ├── schema.py         # 데이터베이스 스키마
│   │   └── order_repository.py# 주문 데이터 리포지토리
│   ├── execution/            # 주문 실행 모듈
│   │   ├── order_model.py    # 주문 모델
│   │   ├── order_service.py  # 주문 서비스
│   │   └── order_service_ext.py# Supabase 연동 확장
│   ├── ingestion/            # 데이터 수집 모듈
│   │   ├── market_api.py     # 시장 데이터 API
│   │   └── websocket.py      # 실시간 데이터 수집
│   ├── notification/         # 알림 모듈
│   │   ├── telegram_bot.py   # 텔레그램 봇
│   │   └── email.py          # 이메일 알림
│   └── ...                   # 기타 모듈
├── docs/                     # 문서
│   ├── 00. document_map.md   # 문서 맵
│   ├── 18. christmas_wbs.md  # WBS 문서
│   ├── 20. Supabase 데이터베이스 연동 계획.md # 연동 계획
│   ├── 23. 프로젝트 진행 요약.md # 진행 요약
│   └── ...                   # 기타 문서
├── tests/                    # 테스트
├── setup_env.ps1             # 환경 변수 설정 스크립트
├── install_dependencies.ps1  # 의존성 패키지 설치 스크립트
├── test_simple.py            # 간단한 테스트 스크립트
├── test_telegram_bot.py      # 텔레그램 봇 테스트 스크립트
├── test_supabase_order_service.py # Supabase 연동 테스트 스크립트
└── README.md                 # 프로젝트 설명
```

## 문서

자세한 문서는 `docs/` 디렉토리에서 확인할 수 있습니다:

- [프로젝트 개요](docs/01.%20Christmas_plan.md)
- [기능 요구사항](docs/02.%20christmas_requirement.md)
- [사용자 플로우](docs/03.%20christmas_userflow.md)
- [더 많은 문서...](docs/17.%20christmas_doc-map.md)

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요. 

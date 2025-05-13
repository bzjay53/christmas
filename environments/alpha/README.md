# Christmas 알파 테스트 환경

이 디렉토리는 Christmas 자동 매매 플랫폼의 알파 버전 테스트 환경입니다.

## 현재 상태

**✅ 알파 테스트 환경 준비 완료**

알파 버전 품질 검증이 완료되었으며, 알파 테스트를 위한 모든 준비가 완료되었습니다. 테스터 초대 및 알파 테스트 시작을 기다리고 있습니다.

## 주요 문서

### 품질 검증 및 준비 문서
- [품질 검증 보고서](quality_validation_report.md) - 알파 버전 품질 검증 결과
- [최종 알파 요약](final_alpha_summary.md) - 품질 검증 최종 요약
- [알파 배포 계획](alpha_deployment_plan.md) - 알파 버전 배포 계획
- [알파 릴리스 체크리스트](alpha_release_checklist.md) - 알파 릴리스 준비 체크리스트
- [알파 준비 상태 최종 검증](alpha_readiness_verification.md) - 알파 테스트 준비 최종 검증
- [알파 배포 절차](alpha_deployment_steps.md) - 알파 테스트 환경 배포 절차

### 테스트 계획 문서
- [피드백 수집 계획](feedback_collection_plan.md) - 알파 버전 피드백 수집 계획
- [피드백 설문지 템플릿](feedback_survey_template.md) - 설문지 템플릿
- [테스터 온보딩 가이드](tester_onboarding_guide.md) - 테스터를 위한 안내 문서
- [알파 테스트 실행 계획](alpha_test_execution_plan.md) - 테스트 실행 계획
- [알파 테스터 체크리스트](alpha_tester_checklist.md) - 테스터 참여 체크리스트
- [테스트 시나리오](config/test_scenarios.json) - 테스트 시나리오 정의

### 검증 문서
- [문서 검증](document_validation.md) - 문서 일관성 검증 결과
- [코드 검증](code_validation.md) - 코드 품질 검증 결과
- [기능 검증](functionality_validation.md) - 기능 테스트 결과
- [RAG 구현 워크플로우](rag_implementation_workflow.md) - RAG 시스템 구현 과정

### 설정 파일
- [앱 설정](config/app_config.json) - 애플리케이션 설정
- [사용자 목록](config/users.json) - 테스트 사용자 목록
- [전략 설정](config/strategies.json) - 백테스트 전략 설정
- [모니터링 설정](config/monitoring.json) - 시스템 모니터링 설정

## 환경 구조

```
environments/alpha/
├── config/               # 설정 파일
│   ├── app_config.json   # 애플리케이션 설정
│   ├── users.json        # 사용자 설정
│   ├── strategies.json   # 전략 설정
│   ├── monitoring.json   # 모니터링 설정
│   └── test_scenarios.json # 테스트 시나리오
├── data/                 # 데이터 디렉토리
│   ├── timescale/        # 시계열 데이터베이스 데이터
│   ├── redis/            # Redis 데이터
│   └── weaviate/         # 벡터 데이터베이스 데이터
├── logs/                 # 로그 디렉토리
│   ├── api/              # API 서비스 로그
│   ├── ingestion/        # 데이터 수집 서비스 로그
│   ├── web/              # 웹 인터페이스 로그
│   └── notifications/    # 알림 서비스 로그
├── email_templates/      # 이메일 템플릿
│   ├── tester_invitation.md # 테스터 초대 이메일
│   └── ...
├── verification_scripts/ # 검증 스크립트
│   ├── test_alpha_readiness.py # 알파 환경 준비 상태 검증
│   └── ...
├── docker-compose.yml    # Docker Compose 설정
├── .env                  # 환경 변수 (민감 정보)
└── README.md             # 이 문서
```

## 시작 방법

### 로컬 환경 설정
```bash
# 환경 변수 설정
cp .env.example .env
# 필요한 값 수정

# Docker 컴포즈 실행
docker-compose up -d
```

### 접속 방법
- 웹 인터페이스: http://localhost:5000
- API: http://localhost:8000/docs
- RAG API: http://localhost:8080
- 모니터링: http://localhost:3000

## 다음 단계

1. ✅ 알파 테스트 환경 설정 완료 (2025-05-15)
2. 🔄 테스터 그룹 구성 및 초대 (2025-05-15 ~ 2025-05-19)
3. 📅 알파 테스트 시작 (2025-05-20)
4. 📅 중간 피드백 수집 및 분석 (2025-05-27)
5. 📅 업데이트 배포 (2025-05-30)
6. 📅 최종 피드백 수집 (2025-06-05)
7. 📅 피드백 분석 및 개선 계획 수립 (2025-06-06 ~ 2025-06-15)

## 문의

알파 테스트 환경에 관한 문의: alpha-support@christmas-trading.com

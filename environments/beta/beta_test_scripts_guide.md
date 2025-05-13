# 베타 테스트 스크립트 실행 가이드

이 문서는 Christmas 프로젝트의 베타 테스트를 위한 스크립트 실행 방법을 설명합니다. 테스트 사용자 생성, API 키 발급, 초대 이메일 발송 등의 작업을 포함합니다.

## 사전 준비

베타 테스트 스크립트를 실행하기 전에 다음 요구사항을 확인하세요:

1. Docker와 Docker Compose가 설치되어 있어야 합니다.
2. Beta 환경 설정 파일(`.env`)이 `environments/beta/` 디렉토리에 위치해야 합니다.
3. 베타 테스트 환경이 구성되고 실행 중이어야 합니다.

## 1. 베타 환경 시작하기

```powershell
# 베타 환경 디렉토리로 이동
cd environments/beta

# Docker 컨테이너 실행
docker-compose up -d

# 컨테이너 상태 확인
docker-compose ps
```

모든 서비스가 정상적으로 실행되는지 확인하세요. 특히 API, DB, 웹 서비스가 실행 중이어야 합니다.

## 2. 테스트 사용자 생성

베타 테스트 계획에 따라 두 그룹의 테스트 사용자를 생성합니다:
- 그룹 1: 전문 트레이더 (10명)
- 그룹 2: 일반 사용자 (10명)

```powershell
# API 서비스 컨테이너에서 사용자 생성 스크립트 실행
docker-compose exec api python -m app.scripts.create_test_users

# 생성된 사용자 목록 확인
docker-compose exec api python -m app.scripts.list_users
```

사용자 생성 스크립트는 `environments/beta/beta_test_users.json` 파일에 정의된 사용자 정보를 기반으로 계정을 생성합니다. 이 파일은 다음과 같은 형식으로 되어 있습니다:

```json
{
  "professional_traders": [
    {
      "username": "pro_trader_1",
      "email": "trader1@example.com",
      "full_name": "전문 트레이더 1",
      "group": "professional"
    },
    ...
  ],
  "regular_users": [
    {
      "username": "regular_user_1",
      "email": "user1@example.com",
      "full_name": "일반 사용자 1",
      "group": "regular"
    },
    ...
  ]
}
```

필요한 경우 이 파일을 수정하여 테스트 사용자 정보를 변경할 수 있습니다.

## 3. API 키 생성

각 테스트 사용자를 위한 API 키를 생성합니다:

```powershell
# API 키 생성 스크립트 실행
docker-compose exec api python -m app.scripts.generate_api_keys

# 생성된 API 키 목록 확인
docker-compose exec api python -m app.scripts.list_api_keys
```

생성된 API 키는 `environments/beta/beta_api_keys.json` 파일에 저장됩니다. 이 파일에는 각 사용자의 API 키와 비밀키가 포함되어 있습니다.

## 4. 테스트 초대 이메일 발송

베타 테스터에게 초대 이메일을 발송합니다:

```powershell
# 이메일 발송 스크립트 실행
docker-compose exec api python -m app.scripts.send_beta_invitations
```

이메일 발송 스크립트는 `environments/beta/email_templates/beta_invitation.html` 템플릿을 사용하여 각 테스터에게 개인화된 초대 이메일을 발송합니다.

## 5. API 연결 테스트

한국투자증권 API 연결 및 텔레그램 봇 연결을 테스트합니다:

```powershell
# 한국투자증권 API 연결 테스트
docker-compose exec api python -m app.scripts.test_kis_api

# 텔레그램 봇 연결 테스트
docker-compose exec telegram_bot python -m app.scripts.test_telegram_bot

# 토큰 갱신 테스트
docker-compose exec api python -m app.scripts.test_token_refresh
```

## 6. 모니터링 설정

베타 테스트 모니터링을 위한 대시보드를 설정합니다:

1. Grafana에 접속: `http://localhost:7031`
2. 기본 계정으로 로그인: admin/beta_admin
3. 베타 테스트 대시보드 가져오기: 
   - 좌측 메뉴에서 "+" > "Import" 선택
   - `environments/beta/grafana_dashboards/beta_test_dashboard.json` 업로드

## 7. 피드백 시스템 확인

베타 테스터 피드백 수집 시스템을 확인합니다:

```powershell
# 피드백 시스템 상태 확인
docker-compose exec web python -m app.scripts.check_feedback_system
```

## 문제 해결

스크립트 실행 중 오류가 발생하면 다음 로그를 확인하세요:

```powershell
# API 서비스 로그 확인
docker-compose logs -f api

# 데이터베이스 로그 확인
docker-compose logs -f timescaledb

# 이메일 서비스 로그 확인
docker-compose logs -f mailhog
```

## 참고 문서

- [베타 테스트 계획](beta_test_plan.md)
- [베타 배포 단계](beta_deployment_steps.md)
- [베타 테스트 시나리오](beta_scenarios.json)
- [프로젝트 WBS](../../docs/18.%20christmas_wbs.md) 
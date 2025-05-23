# 베타 테스트 피드백 시스템 및 이슈 대응 시스템 구현 가이드

## 1. 개요

이 문서는 Christmas 프로젝트의 베타 테스트 피드백 시스템과 이슈 대응 시스템을 구현하고 실제 환경에 적용하는 과정을 설명합니다. 두 시스템은 베타 테스트 과정에서 발생하는 피드백과 이슈를 효과적으로 수집하고 대응하기 위해 설계되었습니다.

## 2. 시스템 아키텍처

### 2.1 피드백 시스템 아키텍처

```
[베타 테스터] --> [설문지 URL] --> [피드백 수집 시스템] --> [데이터베이스]
                                        |
                                        v
                                  [텔레그램 알림] --> [개발팀]
```

### 2.2 이슈 대응 시스템 아키텍처

```
[Prometheus] --> [이슈 감지] --> [이슈 대응 시스템] --> [JIRA 이슈 생성]
                                      |
                                      v
                              [알림 채널(텔레그램, 이메일, 전화)]
```

## 3. 구현 과정

### 3.1 설정 파일 구성

두 시스템의 핵심은 JSON 형식의 설정 파일입니다:

1. **feedback_system.json**: 피드백 수집 시스템 설정
   - 설문 URL
   - 텔레그램 봇 설정
   - 데이터베이스 연결 정보
   - 알림 설정

2. **issue_response.json**: 이슈 대응 시스템 설정
   - Prometheus 연결 정보
   - 알림 채널 설정 (텔레그램, 이메일, 전화)
   - 알림 규칙
   - 대응 조치 (JIRA 연동 등)

### 3.2 텔레그램 봇 설정

텔레그램 봇은 두 시스템 모두에서 사용되는 중요한 알림 채널입니다:

1. 봇 생성: BotFather를 통해 생성 (https://web.telegram.org/k/#@christmas_auto_bot)
2. 토큰 획득: `7889451962:AAE3IwomldkE9jXxgmJHWQOLIU-yegU5X2Y`
3. Chat ID 설정: `1394057485`

### 3.3 스크립트 개발

1. **beta_feedback_system_check.py**:
   - 피드백 수집 시스템 상태 점검
   - 설문 URL 접근성 테스트
   - 텔레그램 봇 연결 테스트
   - 데이터베이스 연결 점검

2. **beta_issue_response.py**:
   - Prometheus 쿼리 실행
   - 이슈 감지 및 알림
   - JIRA 이슈 생성
   - 알림 채널 관리

## 4. 설정 파일 업데이트

### 4.1 텔레그램 봇 정보 업데이트

피드백 시스템과 이슈 대응 시스템 모두에서 텔레그램 봇 정보를 업데이트했습니다:

1. **feedback_system.json**:
   ```json
   "telegram_bot": {
     "token": "7889451962:AAE3IwomldkE9jXxgmJHWQOLIU-yegU5X2Y",
     "chat_id": "1394057485"
   }
   ```

2. **issue_response.json**:
   ```json
   "telegram": {
     "enabled": true,
     "token": "7889451962:AAE3IwomldkE9jXxgmJHWQOLIU-yegU5X2Y",
     "chat_id": "1394057485"
   }
   ```

### 4.2 코드 수정

`beta_issue_response.py` 파일에서 발견된 함수 호출 오류를 수정했습니다:
- `send_telegram_notification` → `send_telegram_alert` 메서드로 변경
- 적절한 매개변수 전달 구현

## 5. 테스트 및 검증

### 5.1 피드백 시스템 테스트

피드백 시스템 점검 스크립트를 실행하여 다음을 확인했습니다:
1. 설문 URL이 접근 가능한지 확인
2. 텔레그램 봇이 정상적으로 연결되었는지 확인
3. 텔레그램 메시지 전송 테스트 성공 확인

```bash
python beta_feedback_system_check.py
```

### 5.2 이슈 대응 시스템 테스트

이슈 대응 시스템 테스트를 위해 수동 알림 생성 기능을 활용했습니다:
1. 성능 이슈 관련 테스트 알림 생성
2. 텔레그램을 통한 알림 전송 확인

```bash
python beta_issue_response.py --manual-alert --name "성능 이슈" --description "API 응답 시간이 2초를 초과합니다." --severity P2 --category "성능"
```

## 6. 실제 환경 적용

### 6.1 프로덕션 환경 준비

1. 설정 파일 배포:
   - 텔레그램 봇 토큰 및 chat_id 업데이트
   - 실제 데이터베이스 연결 정보 구성
   - 실제 JIRA 계정 정보 구성

2. 모니터링 서비스 연결:
   - Prometheus 및 Grafana 설정
   - 알림 규칙 활성화

### 6.2 운영 체크리스트

프로덕션 환경 적용 전 최종 체크리스트:
1. 텔레그램 봇 설정 확인
2. 이메일 서버 연결 확인
3. JIRA 연동 테스트
4. Prometheus 쿼리 검증
5. 알림 규칙 최종 검토

## 7. 문제 해결 가이드

### 7.1 텔레그램 연결 문제

텔레그램 봇 연결 실패 시 확인할 사항:
1. 봇 토큰 정확성 확인
2. Chat ID 값 검증
3. 인터넷 연결 확인
4. 텔레그램 API 접근 가능 여부 확인

### 7.2 Prometheus 연결 문제

Prometheus 연결 실패 시 확인할 사항:
1. Prometheus 서버 실행 여부
2. URL 및 포트 설정 확인
3. 방화벽 설정 확인
4. 네트워크 연결 확인

## 8. 향후 개선 계획

1. 이메일 서버 실제 연결 구성
2. JIRA 연동 완료
3. 전화 알림 기능 검증 (Twilio API)
4. 모니터링 대시보드 개선
5. 피드백 분석 자동화 추가

## 9. 참조 문서

- [베타 테스트 진행 상황 보고서](beta_test_progress_report.md)
- [베타 테스트 이슈 대응 계획](../environments/beta/beta_issue_response_plan.md)
- [텔레그램 봇 API 문서](https://core.telegram.org/bots/api)
- [Prometheus 쿼리 문서](https://prometheus.io/docs/prometheus/latest/querying/basics/)

## 변경 이력

- 2025-06-22: 초기 문서 작성
- 2025-06-22: 텔레그램 봇 설정 및 테스트 내용 추가 
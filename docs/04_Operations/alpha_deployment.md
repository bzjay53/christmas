# Christmas 알파 버전 배포 가이드

## 1. 개요

이 문서는 Christmas 자동 매매 플랫폼의 알파 버전 배포 및 테스트 과정을 설명합니다. 알파 버전은 내부 테스터들에게 제공되어 기본 기능과 안정성을 검증하기 위한 목적으로 배포됩니다.

## 2. 사전 요구사항

### 2.1 필수 소프트웨어
- Docker (버전 20.10.0 이상)
- Docker Compose (버전 2.0.0 이상)
- Git

### 2.2 시스템 요구사항
- CPU: 4코어 이상
- 메모리: 8GB 이상
- 디스크: 20GB 이상의 여유 공간
- 네트워크: 안정적인 인터넷 연결

### 2.3 필요한 자격 증명
- 거래소 테스트넷 API 키 (실제 거래는 수행하지 않음)
- OpenAI API 키 (RAG 시스템 테스트용, 선택적)

## 3. 알파 테스트 환경 준비

### 3.1 환경 설정 스크립트 실행

알파 테스트 환경을 자동으로 구성하는 스크립트를 제공합니다:

```bash
# 윈도우
./scripts/setup_alpha_env.sh

# Linux/macOS
bash scripts/setup_alpha_env.sh
```

이 스크립트는 다음 작업을 수행합니다:
- 알파 테스트용 디렉토리 구조 생성
- 환경 설정 파일 (.env) 준비
- Docker Compose 설정 파일 생성
- 필요한 설정 파일 복사

### 3.2 수동 환경 설정 (스크립트 오류 시)

스크립트 실행이 어려운 경우 다음 단계를 수동으로 수행합니다:

1. 환경 디렉토리 생성:
   ```bash
   mkdir -p environments/alpha/{logs,data,config}
   ```

2. 환경 설정 파일 생성:
   ```bash
   # .env 파일 생성
   cat > environments/alpha/.env << EOF
   # Christmas 알파 테스트 환경 설정
   
   # 환경 식별자
   CHRISTMAS_ENV=alpha
   CHRISTMAS_VERSION=0.1.0-alpha.1
   
   # 서비스 포트 설정
   API_PORT=7000
   WEB_PORT=4000
   NGINX_PORT=7080
   PROMETHEUS_PORT=7090
   GRAFANA_PORT=7030
   TIMESCALEDB_PORT=5532
   REDIS_PORT=6479
   
   # 데이터베이스 설정
   DB_USER=christmas_alpha
   DB_PASSWORD=alpha_password
   DB_NAME=christmas_alpha
   
   # 로깅 설정
   LOG_LEVEL=DEBUG
   EOF
   ```

3. Docker Compose 파일 복사 및 수정:
   ```bash
   cp docker-compose.yml environments/alpha/
   # 필요한 설정을 environments/alpha/docker-compose.yml에 수정
   ```

## 4. 알파 테스트 환경 실행

### 4.1 환경 시작

```bash
cd environments/alpha
docker-compose -f docker-compose.alpha.yml up -d
```

### 4.2 서비스 상태 확인

```bash
# 서비스 상태 확인
docker-compose -f docker-compose.alpha.yml ps

# 로그 확인
docker-compose -f docker-compose.alpha.yml logs -f

# 특정 서비스 로그만 확인
docker-compose -f docker-compose.alpha.yml logs -f api
```

### 4.3 API 상태 확인

```bash
# API 헬스체크
curl http://localhost:7000/api/health

# 웹 인터페이스 접속: http://localhost:4000
```

## 5. 알파 테스트 수행

### 5.1 테스트 계획

알파 테스트는 다음 단계로 진행됩니다:

1. **기본 기능 테스트**
   - 사용자 인증 및 관리
   - 시장 데이터 수집
   - 전략 구성 및 실행
   - 모니터링 및 알림

2. **안정성 테스트**
   - 24시간 지속 운영
   - 네트워크 문제 시나리오
   - 외부 API 장애 상황

3. **성능 테스트**
   - 데이터 처리량 측정
   - 반응 시간 측정
   - 리소스 사용량 모니터링

### 5.2 테스트 시나리오

주요 테스트 시나리오는 다음과 같습니다:

1. **계정 관리**
   - 사용자 등록 및 로그인
   - 권한 관리 및 설정

2. **시장 데이터 처리**
   - 실시간 시장 데이터 수신
   - 기술적 지표 계산 정확도

3. **전략 실행**
   - 기본 매매 전략 설정
   - 모의 거래 실행 및 결과 검증

4. **알림 및 리포팅**
   - 이벤트 기반 알림 발송
   - 성과 보고서 생성

### 5.3 테스트 체크리스트

테스트 참가자는 다음 체크리스트를 활용합니다:

```
□ 사용자 가입 및 로그인 성공
□ 거래소 API 키 설정 성공
□ 시장 데이터 수신 확인
□ 기술적 지표 차트 확인
□ 기본 매매 전략 구성
□ 모의 거래 실행
□ 실시간 포트폴리오 모니터링
□ 이메일 알림 수신
□ 모바일 응답성 확인
□ 보고서 생성 및 다운로드
```

## 6. 피드백 수집 및 보고

### 6.1 피드백 수집 방법

내부 테스터의 피드백은 다음 방법으로 수집합니다:

1. **이슈 트래커**
   - GitHub 이슈를 통한 버그 및 개선사항 보고
   - 템플릿을 활용한 상세 보고

2. **피드백 폼**
   - 웹 인터페이스 내 피드백 양식
   - 주간 피드백 설문조사

3. **사용자 인터뷰**
   - 주간 팀 회의에서 경험 공유
   - 주요 기능별 사용성 평가

### 6.2 피드백 분류 및 우선순위 지정

수집된 피드백은 다음과 같이 분류합니다:

1. **버그**
   - 심각도: 치명적, 주요, 경미
   - 재현 가능성: 항상, 간헐적, 희귀

2. **개선 요청**
   - 유형: 기능, 성능, UI/UX
   - 영향: 높음, 중간, 낮음

3. **성능 이슈**
   - 유형: 속도, 안정성, 리소스 사용
   - 영향 범위: 전체 시스템, 특정 모듈

### 6.3 보고서 작성

테스트 완료 후 다음 내용을 포함한 알파 테스트 보고서를 작성합니다:

1. **개요**
   - 테스트 기간 및 참가자
   - 테스트 범위 및 목표

2. **결과 요약**
   - 발견된 버그 수 및 유형
   - 성능 측정 결과
   - 주요 피드백 요약

3. **세부 결과**
   - 발견된 모든 이슈 목록
   - 우선순위별 분류
   - 재현 방법 및 환경 정보

4. **개선 계획**
   - 수정 필요 항목
   - 베타 버전 출시 전 목표
   - 일정 및 담당자 지정

## 7. 알파 테스트 환경 관리

### 7.1 환경 업데이트

새로운 변경사항 적용:

```bash
# 코드베이스 업데이트
git pull

# 환경 재구축
cd environments/alpha
docker-compose -f docker-compose.alpha.yml down
docker-compose -f docker-compose.alpha.yml up -d --build
```

### 7.2 데이터 백업 및 복원

테스트 데이터 백업:

```bash
# 데이터베이스 백업
docker-compose -f docker-compose.alpha.yml exec timescaledb pg_dump -U christmas_alpha -d christmas_alpha > alpha_backup.sql

# 설정 파일 백업
cp .env .env.backup
```

### 7.3 환경 리셋

테스트 환경 초기화:

```bash
# 모든 컨테이너 및 볼륨 삭제
docker-compose -f docker-compose.alpha.yml down -v

# 데이터 디렉토리 정리
rm -rf data/*

# 환경 재시작
docker-compose -f docker-compose.alpha.yml up -d
```

## 8. 알파 테스트 종료 및 베타 준비

### 8.1 종료 절차

알파 테스트 종료 시:

1. 모든 발견된 이슈 문서화
2. 최종 테스트 보고서 작성
3. 베타 버전 준비 계획 수립

### 8.2 베타 버전 준비

베타 버전 준비를 위한 주요 작업:

1. 중요 버그 수정
2. 성능 최적화
3. UI/UX 개선
4. 베타 테스트 환경 구성 계획 
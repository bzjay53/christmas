# Christmas 문제 해결 가이드

이 문서는 Christmas 플랫폼을 사용하면서 발생할 수 있는 일반적인 문제와 해결 방법을 제공합니다.

## 목차

1. [Docker 관련 문제](#docker-관련-문제)
2. [데이터베이스 문제](#데이터베이스-문제)
3. [웹 인터페이스 문제](#웹-인터페이스-문제)
4. [API 연결 문제](#api-연결-문제)
5. [데이터 수집 문제](#데이터-수집-문제)
6. [알림 문제](#알림-문제)
7. [성능 문제](#성능-문제)
8. [로그 확인 방법](#로그-확인-방법)

## Docker 관련 문제

### 컨테이너가 시작되지 않음

**증상**: `docker-compose up` 명령 후 일부 또는 모든 컨테이너가 시작되지 않습니다.

**해결 방법**:

1. Docker 로그 확인:
   ```powershell
   docker-compose logs [서비스명]
   ```

2. 이미 사용 중인 포트 확인:
   ```powershell
   netstat -ano | findstr "5000 5432 6379 8000"
   ```

3. 충돌하는 포트가 있다면 `docker-compose.yml` 파일에서 포트 매핑 변경.

4. 기존 컨테이너 정리:
   ```powershell
   docker-compose down
   docker system prune -a --volumes
   docker-compose up -d
   ```

### 이미지 빌드 실패

**증상**: `docker-compose build` 명령이 실패합니다.

**해결 방법**:

1. 빌드 캐시 무시하고 다시 시도:
   ```powershell
   docker-compose build --no-cache
   ```

2. Dockerfile 내의 오류 확인.

3. 네트워크 문제로 패키지 다운로드가 실패한 경우 네트워크 연결 확인.

4. 디스크 공간 부족 확인:
   ```powershell
   docker system df
   ```

### 컨테이너 간 통신 문제

**증상**: 컨테이너는 실행 중이지만 서로 통신하지 못합니다.

**해결 방법**:

1. 네트워크 확인:
   ```powershell
   docker network ls
   docker network inspect christmas_default
   ```

2. 환경 변수에 올바른 서비스 이름이 설정되어 있는지 확인.

3. 컨테이너 재시작:
   ```powershell
   docker-compose restart
   ```

## 데이터베이스 문제

### 데이터베이스 연결 실패

**증상**: 애플리케이션이 TimescaleDB에 연결하지 못합니다.

**해결 방법**:

1. 데이터베이스 컨테이너 상태 확인:
   ```powershell
   docker-compose ps timescaledb
   ```

2. 데이터베이스 로그 확인:
   ```powershell
   docker-compose logs timescaledb
   ```

3. 데이터베이스 연결 설정 확인:
   ```powershell
   docker-compose exec api python -c "from app.core.config import settings; print(settings.DB_HOST, settings.DB_PORT)"
   ```

4. 데이터베이스 컨테이너에 직접 연결 시도:
   ```powershell
   docker-compose exec timescaledb psql -U christmas -d christmas
   ```

### 데이터 마이그레이션 실패

**증상**: 데이터베이스 스키마 마이그레이션이 실패합니다.

**해결 방법**:

1. 마이그레이션 로그 확인.

2. 수동으로 마이그레이션 실행:
   ```powershell
   docker-compose exec api python -m app.db.migrations
   ```

3. 데이터베이스 버전 호환성 확인.

4. 마지막 성공한 마이그레이션으로 롤백:
   ```powershell
   docker-compose exec api python -m app.db.migrations --downgrade 1
   ```

## 웹 인터페이스 문제

### 웹 페이지가 로드되지 않음

**증상**: 웹 인터페이스가 브라우저에 로드되지 않습니다.

**해결 방법**:

1. 웹 서비스 상태 확인:
   ```powershell
   docker-compose ps web
   ```

2. 웹 서비스 로그 확인:
   ```powershell
   docker-compose logs web
   ```

3. 네트워크 연결 확인:
   ```powershell
   curl http://localhost:5000
   ```

4. 브라우저 캐시 및 쿠키 지우기.

5. 다른 브라우저로 시도.

### 로그인 문제

**증상**: 로그인이 되지 않거나 세션이 유지되지 않습니다.

**해결 방법**:

1. 쿠키 설정 확인.

2. Redis 세션 저장소 확인:
   ```powershell
   docker-compose exec redis redis-cli keys "*session*"
   ```

3. 브라우저의 개발자 도구에서 네트워크 요청 분석.

4. 세션 관련 로그 확인:
   ```powershell
   docker-compose logs web | findstr "session"
   ```

### UI 요소가 제대로 표시되지 않음

**증상**: 대시보드 또는 기타 UI 요소가 깨져서 표시됩니다.

**해결 방법**:

1. 브라우저 캐시 지우기.

2. 개발자 도구의 콘솔에서 JavaScript 오류 확인.

3. 정적 파일 경로 확인:
   ```powershell
   docker-compose exec web ls -la /app/app/web/static
   ```

4. 최신 브라우저 사용 확인.

## API 연결 문제

### API 응답 없음

**증상**: API 요청에 응답이 없거나 타임아웃이 발생합니다.

**해결 방법**:

1. API 서비스 상태 확인:
   ```powershell
   docker-compose ps api
   ```

2. API 로그 확인:
   ```powershell
   docker-compose logs api
   ```

3. API 엔드포인트 직접 테스트:
   ```powershell
   curl http://localhost:8000/api/health
   ```

4. API 서비스 재시작:
   ```powershell
   docker-compose restart api
   ```

### 인증 오류

**증상**: API 요청이 401 또는 403 오류를 반환합니다.

**해결 방법**:

1. API 키 또는 토큰 유효성 확인.

2. 권한 설정 확인.

3. 토큰 만료 확인 및 갱신.

4. 인증 헤더 형식 확인.

## 데이터 수집 문제

### 시장 데이터가 수집되지 않음

**증상**: 실시간 또는 히스토리컬 시장 데이터가 수집되지 않습니다.

**해결 방법**:

1. 데이터 수집 서비스 상태 확인:
   ```powershell
   docker-compose ps ingestion
   ```

2. 데이터 수집 로그 확인:
   ```powershell
   docker-compose logs ingestion
   ```

3. API 키 및 연결 설정 확인.

4. 거래소 API 상태 확인(공식 상태 페이지 참조).

5. 수동으로 데이터 수집 테스트:
   ```powershell
   docker-compose exec ingestion python -m app.ingestion.test_api
   ```

### 웹소켓 연결 문제

**증상**: 실시간 데이터 스트림이 중단되거나 연결되지 않습니다.

**해결 방법**:

1. 웹소켓 로그 확인:
   ```powershell
   docker-compose logs ingestion | findstr "websocket"
   ```

2. 네트워크 방화벽 설정 확인(웹소켓 연결 허용).

3. 수동으로 웹소켓 연결 테스트:
   ```powershell
   docker-compose exec ingestion python -m app.ingestion.test_websocket
   ```

4. 재연결 로직 확인.

## 알림 문제

### 텔레그램 알림이 오지 않음

**증상**: 거래 알림이 텔레그램에 전송되지 않습니다.

**해결 방법**:

1. 텔레그램 봇 서비스 상태 확인:
   ```powershell
   docker-compose ps telegram_bot
   ```

2. 텔레그램 봇 로그 확인:
   ```powershell
   docker-compose logs telegram_bot
   ```

3. 텔레그램 봇 토큰 및 채팅 ID 확인.

4. 텔레그램 API 연결 테스트:
   ```powershell
   docker-compose exec telegram_bot python -c "from app.notification.telegram import test_connection; test_connection()"
   ```

5. 보안 설정 및 방화벽 확인.

### 알림 설정 문제

**증상**: 알림 규칙이 제대로 작동하지 않습니다.

**해결 방법**:

1. 알림 설정 확인.

2. 알림 로그 확인:
   ```powershell
   docker-compose logs | findstr "notification"
   ```

3. 알림 트리거 조건 및 필터 확인.

4. Redis 큐 상태 확인:
   ```powershell
   docker-compose exec redis redis-cli llen notification_queue
   ```

## 성능 문제

### 시스템이 느리게 동작함

**증상**: 웹 인터페이스 또는 API 응답이 느립니다.

**해결 방법**:

1. 리소스 사용량 모니터링:
   ```powershell
   docker stats
   ```

2. 데이터베이스 성능 확인:
   ```powershell
   docker-compose exec timescaledb psql -U christmas -d christmas -c "SELECT * FROM pg_stat_activity;"
   ```

3. 로그에서 성능 병목 확인.

4. 불필요한 서비스 중지:
   ```powershell
   docker-compose stop [서비스명]
   ```

5. 하드웨어 리소스 증가 검토.

### 메모리 사용량 과다

**증상**: 컨테이너가 메모리 부족으로 종료됩니다.

**해결 방법**:

1. 메모리 사용량 확인:
   ```powershell
   docker stats
   ```

2. 메모리 제한 증가(docker-compose.yml 수정).

3. 메모리 누수 확인:
   ```powershell
   docker-compose logs | findstr "memory"
   ```

4. 애플리케이션 코드 점검(Python 프로파일링).

## 로그 확인 방법

### 전체 로그 확인

모든 서비스의 로그를 확인하려면:

```powershell
docker-compose logs
```

### 특정 서비스 로그 확인

특정 서비스의 로그만 확인하려면:

```powershell
docker-compose logs [서비스명]
```

### 실시간 로그 추적

로그를 실시간으로 추적하려면:

```powershell
docker-compose logs -f [서비스명]
```

### 특정 키워드 검색

로그에서 특정 키워드를 검색하려면:

```powershell
docker-compose logs | findstr "error"
```

### 로그 수준 변경

로깅 수준을 변경하려면 환경 변수를 수정하세요:

```powershell
# .env 파일 수정
CHRISTMAS_LOG_LEVEL=debug
```

수정 후 서비스 재시작:

```powershell
docker-compose restart
``` 
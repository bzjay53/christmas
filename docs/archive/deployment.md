# Christmas 프로젝트 배포 가이드

## 1. 개요

이 문서는 Christmas 자동 매매 플랫폼의 배포 방법을 설명합니다. Christmas는 Docker 기반으로 구성되어 있어 모든 환경에서 일관된 배포가 가능합니다.

## 2. 사전 요구사항

### 2.1 필수 소프트웨어
- [Docker](https://www.docker.com/get-started) (버전 20.10.0 이상)
- [Docker Compose](https://docs.docker.com/compose/install/) (버전 2.0.0 이상)
- Git

### 2.2 시스템 요구사항
- CPU: 4코어 이상 권장
- 메모리: 8GB 이상 권장
- 디스크: 20GB 이상의 여유 공간
- 네트워크: 안정적인 인터넷 연결

### 2.3 필요한 자격 증명
- 거래소 API 키 및 시크릿
- OpenAI API 키 (RAG 시스템 사용 시)

## 3. Docker 기반 배포

### 3.1 프로젝트 클론
```bash
# 저장소 복제
git clone https://github.com/your-username/christmas.git
cd christmas
```

### 3.2 환경 설정
`.env` 파일을 생성하여 필요한 환경 변수를 설정합니다:

```
# API 키
EXCHANGE_API_KEY=your_exchange_api_key
EXCHANGE_API_SECRET=your_exchange_api_secret
OPENAI_API_KEY=your_openai_api_key

# 데이터베이스 설정
DB_USER=christmas
DB_PASSWORD=secure_password
DB_NAME=christmas_db

# 로깅 설정
LOG_LEVEL=INFO
```

### 3.3 배포 구성 선택

Christmas는 다양한 배포 구성을 제공합니다:

#### 3.3.1 기본 배포
모든 핵심 서비스를 포함한 기본 배포:

```bash
docker-compose up -d
```

#### 3.3.2 프로덕션 배포
최적화된 성능과 보안을 위한 프로덕션 배포:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### 3.3.3 RAG 시스템 배포
문서 검색 및 질의응답 기능을 위한 RAG 시스템 배포:

```bash
docker-compose -f docker-compose.rag.yml up -d
```

#### 3.3.4 테스트 환경 배포
테스트 및 개발을 위한 배포:

```bash
docker-compose -f docker-compose.test.yml up -d
```

### 3.4 실행 중인 서비스 확인
```bash
docker-compose ps
```

## 4. 개별 서비스 배포

특정 서비스만 배포해야 하는 경우:

### 4.1 데이터베이스만 배포
```bash
docker-compose up -d timescaledb redis
```

### 4.2 API 서버만 배포
```bash
docker-compose up -d api
```

### 4.3 웹 인터페이스만 배포
```bash
docker-compose up -d web
```

### 4.4 RAG 시스템만 배포
```bash
docker-compose -f docker-compose.rag.yml up -d weaviate rag-api rag-web
```

## 5. 컨테이너 관리

### 5.1 로그 확인
```bash
# 모든 서비스의 로그 확인
docker-compose logs

# 특정 서비스의 로그 확인
docker-compose logs api

# 실시간 로그 확인
docker-compose logs -f
```

### 5.2 서비스 재시작
```bash
# 모든 서비스 재시작
docker-compose restart

# 특정 서비스 재시작
docker-compose restart api
```

### 5.3 서비스 중지
```bash
# 모든 서비스 중지
docker-compose stop

# 특정 서비스 중지
docker-compose stop api
```

### 5.4 서비스 제거
```bash
# 컨테이너 중지 및 제거
docker-compose down

# 볼륨 포함 모두 제거
docker-compose down -v
```

## 6. 데이터 관리

### 6.1 데이터 백업
```bash
# 데이터베이스 백업
docker exec -t christmas-timescaledb-1 pg_dump -U christmas christmas_db > backup/christmas_db_$(date +%Y%m%d).sql

# Redis 백업
docker exec -t christmas-redis-1 redis-cli SAVE
```

### 6.2 데이터 복원
```bash
# 데이터베이스 복원
cat backup/christmas_db_20240101.sql | docker exec -i christmas-timescaledb-1 psql -U christmas christmas_db
```

## 7. 업그레이드

### 7.1 코드 업데이트
```bash
git pull
```

### 7.2 컨테이너 재빌드 및 재시작
```bash
docker-compose build
docker-compose up -d
```

## 8. 문제 해결

### 8.1 컨테이너 접속
```bash
# API 컨테이너 접속
docker exec -it christmas-api-1 bash

# 데이터베이스 컨테이너 접속
docker exec -it christmas-timescaledb-1 bash
```

### 8.2 데이터베이스 접속
```bash
docker exec -it christmas-timescaledb-1 psql -U christmas christmas_db
```

### 8.3 일반적인 문제 해결
1. **컨테이너가 시작되지 않는 경우**
   - 로그 확인: `docker-compose logs [service_name]`
   - 환경 변수 확인: `.env` 파일의 변수가 올바르게 설정되었는지 확인
   - 포트 충돌: 이미 사용 중인 포트가 있는지 확인

2. **데이터베이스 연결 오류**
   - 데이터베이스가 실행 중인지 확인: `docker-compose ps`
   - 자격 증명 확인: `.env` 파일의 DB_USER, DB_PASSWORD 확인

3. **메모리 부족 오류**
   - Docker 메모리 제한 확인 및 조정
   - 불필요한 컨테이너 중지

## 9. 프로덕션 환경 고려사항

### 9.1 스케일링
필요에 따라 특정 서비스의 인스턴스 수를 늘릴 수 있습니다:
```bash
docker-compose -f docker-compose.prod.yml up -d --scale api=3
```

### 9.2 모니터링
- Prometheus 및 Grafana를 사용한 모니터링 설정
- 알림 설정
- 로그 집계 설정

### 9.3 보안
- 네트워크 보안 설정
- 컨테이너 보안 강화
- 정기적인 보안 업데이트

## 10. 참고 자료
- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
- [TimescaleDB 문서](https://docs.timescale.com/)
- [Weaviate 문서](https://weaviate.io/developers/weaviate) 
# Christmas 알파 환경 배포 절차

이 문서는 Christmas 초단타 자동 매매 플랫폼의 알파 테스트 환경을 배포하는 절차를 설명합니다. 모든 단계를 순서대로 진행하여 성공적인 알파 테스트 환경을 구축하세요.

## 사전 준비 사항

### 필요한 소프트웨어
- Git
- Docker & Docker Compose
- Python 3.10+

### 계정 및 인증 정보
- 소스 코드 리포지토리 접근 권한
- 이미지 레지스트리 접근 권한
- 필요한: API 키 및 토큰(OpenAI API 키 등)

## 배포 단계

### 1. 리포지토리 클론
```bash
git clone https://github.com/christmas-trading/christmas.git
cd christmas
```

### 2. 알파 브랜치 체크아웃
```bash
git checkout alpha
```

### 3. 환경 설정
1. 환경 변수 파일 생성:
```bash
cp environments/alpha/.env.example environments/alpha/.env
```

2. 환경 변수 편집:
```bash
# 환경 설정 파일을 열고 필요한 값을 수정
vi environments/alpha/.env
```

주요 설정 항목:
- 데이터베이스 접속 정보
- API 키 및 토큰
- 로깅 레벨
- 모의 거래 설정

### 4. 디렉토리 구조 준비
```bash
mkdir -p environments/alpha/logs/api
mkdir -p environments/alpha/logs/ingestion
mkdir -p environments/alpha/logs/web
mkdir -p environments/alpha/logs/notifications
mkdir -p environments/alpha/data/timescale
mkdir -p environments/alpha/data/redis
mkdir -p environments/alpha/data/weaviate
```

### 5. 구성 파일 검증
```bash
python environments/alpha/verification_scripts/test_alpha_readiness.py
```

모든 검증이 통과하면 다음 단계로 진행합니다.

### 6. Docker 이미지 빌드
```bash
cd environments/alpha
docker-compose build
```

### 7. Docker 컨테이너 실행
```bash
docker-compose up -d
```

### 8. 초기 데이터 로드
```bash
docker-compose exec api python -m app.scripts.load_initial_data
```

### 9. RAG 시스템 색인 생성
```bash
docker-compose exec api python -m app.scripts.rag_indexer --directory /app/docs --extensions md
```

### 10. 상태 확인
```bash
docker-compose ps
```

모든 서비스가 정상적으로 실행 중인지 확인합니다.

### 11. 로그 확인
```bash
docker-compose logs -f api
```

오류가 없는지 확인합니다.

## 테스트 사용자 설정

### 1. 테스트 사용자 생성
```bash
docker-compose exec api python -m app.scripts.create_test_users
```

### 2. 테스트 계정 정보 확인
```bash
docker-compose exec api python -m app.scripts.list_test_users
```

## 모니터링 설정

### 1. 그라파나 대시보드 접근
- URL: http://localhost:3000
- ID: admin
- 초기 비밀번호: admin

### 2. 프로메테우스 설정 확인
- URL: http://localhost:9090

## 테스트 환경 확인

### 1. 웹 인터페이스 접근
- URL: http://localhost:5000

### 2. API 서버 접근
- URL: http://localhost:8000/docs

### 3. RAG 시스템 접근
- URL: http://localhost:8080

## 트러블슈팅

### 데이터베이스 연결 문제
```bash
docker-compose logs timescaledb
```

### API 서버 문제
```bash
docker-compose logs api
```

### RAG 시스템 문제
```bash
docker-compose logs weaviate
```

## 배포 롤백 절차

문제 발생 시 다음 절차에 따라 롤백합니다:

### 1. 현재 상태 저장
```bash
docker-compose down
```

### 2. 이전 버전으로 체크아웃
```bash
git checkout alpha-stable
```

### 3. 서비스 재시작
```bash
docker-compose up -d
```

## 테스트 종료 후 정리 절차

### 1. 데이터 백업
```bash
docker-compose exec timescaledb pg_dump -U christmas -d christmas > christmas_alpha_backup.sql
```

### 2. 컨테이너 종료
```bash
docker-compose down
```

### 3. 볼륨 정리 (선택 사항)
```bash
docker-compose down -v
```

## 담당자 연락처

- 배포 관리자: devops@christmas-trading.com
- 긴급 연락처: 010-1234-5678 
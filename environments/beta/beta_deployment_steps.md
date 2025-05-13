# Christmas 베타 환경 배포 단계

## 1. 사전 준비

### 1.1 필수 소프트웨어 설치
- Docker Desktop
- Docker Compose
- Git
- PowerShell 5.1 이상

### 1.2 프로젝트 소스 코드 준비
```powershell
# 저장소 클론
git clone https://github.com/bzjay53/christmas.git
cd christmas

# 베타 브랜치로 전환
git checkout beta
```

### 1.3 필수 API 키 및 계정 정보 확인
다음 API 키와 계정 정보가 준비되었는지 확인합니다:

- 한국투자증권 모의계좌 API 키
  - APP KEY
  - APP SECRET
  - 계좌번호

- 한국투자증권 실전계좌 API 키
  - APP KEY
  - APP SECRET
  - 계좌번호
  
- 텔레그램 봇 토큰
  - TELEGRAM_BOT_TOKEN
  
- GitHub 계정 정보
  - 사용자명: bzjay53
  - Personal Access Token (필요시)

```powershell
# API 키 환경 변수 확인
if (-not (Test-Path -Path "secrets")) {
    New-Item -Path "secrets" -ItemType Directory -Force
}

# API 키 템플릿 파일 생성
@"
# 한국투자증권 모의계좌
KIS_MOCK_APP_KEY=your_mock_app_key
KIS_MOCK_APP_SECRET=your_mock_app_secret
KIS_MOCK_ACCOUNT=your_mock_account

# 한국투자증권 실전계좌
KIS_REAL_APP_KEY=your_real_app_key
KIS_REAL_APP_SECRET=your_real_app_secret
KIS_REAL_ACCOUNT=your_real_account

# 텔레그램 봇
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
"@ | Out-File -Encoding utf8 "secrets/api_keys_template.txt"

Write-Host "API 키 템플릿 파일이 생성되었습니다. secrets/api_keys_template.txt 파일을 참고하여 실제 값을 입력해주세요."
```

## 2. 환경 설정

### 2.1 베타 환경 변수 파일 생성
```powershell
# 베타 환경 변수 파일 생성
.\create_beta_env.ps1
```

### 2.2 환경 변수 설정 확인
```powershell
# 생성된 환경 변수 파일 확인
Get-Content environments/beta/.env
```

### 2.3 API 키 설정
```powershell
# .env 파일 편집하여 실제 API 키 입력
$envPath = "environments/beta/.env"
$envContent = Get-Content $envPath -Raw

# 한국투자증권 모의계좌 API 설정
$envContent = $envContent -replace "KIS_MOCK_APP_KEY=your_mock_app_key", "KIS_MOCK_APP_KEY=실제_모의계좌_앱키"
$envContent = $envContent -replace "KIS_MOCK_APP_SECRET=your_mock_app_secret", "KIS_MOCK_APP_SECRET=실제_모의계좌_앱시크릿"
$envContent = $envContent -replace "KIS_MOCK_ACCOUNT=your_mock_account", "KIS_MOCK_ACCOUNT=실제_모의계좌_계좌번호"

# 한국투자증권 실전계좌 API 설정 (사용 시)
$envContent = $envContent -replace "KIS_REAL_APP_KEY=your_real_app_key", "KIS_REAL_APP_KEY=실제_실전계좌_앱키"
$envContent = $envContent -replace "KIS_REAL_APP_SECRET=your_real_app_secret", "KIS_REAL_APP_SECRET=실제_실전계좌_앱시크릿"
$envContent = $envContent -replace "KIS_REAL_ACCOUNT=your_real_account", "KIS_REAL_ACCOUNT=실제_실전계좌_계좌번호"

# 텔레그램 봇 토큰 설정
$envContent = $envContent -replace "TELEGRAM_BOT_TOKEN=beta_test_token", "TELEGRAM_BOT_TOKEN=실제_텔레그램_봇_토큰"

# 수정된 내용 저장
[System.IO.File]::WriteAllText($envPath, $envContent, [System.Text.Encoding]::UTF8)

Write-Host "API 키가 업데이트되었습니다."
```

### 2.4 디렉토리 구조 준비
```powershell
# 로그 디렉토리 생성
New-Item -Path "logs/api" -ItemType Directory -Force
New-Item -Path "logs/web" -ItemType Directory -Force
New-Item -Path "logs/ingestion" -ItemType Directory -Force
New-Item -Path "logs/notification" -ItemType Directory -Force

# Prometheus 설정 디렉토리 생성
New-Item -Path "config/prometheus/beta" -ItemType Directory -Force
New-Item -Path "config/grafana/beta" -ItemType Directory -Force
New-Item -Path "config/logstash/beta" -ItemType Directory -Force
```

## 3. 설정 파일 준비

### 3.1 Prometheus 설정
```powershell
# Prometheus 설정 파일 복사
Copy-Item config/prometheus/prometheus.yml config/prometheus/beta/prometheus.yml
```

### 3.2 Grafana 대시보드 설정
```powershell
# Grafana 대시보드 파일 복사
Copy-Item -Recurse config/grafana/* config/grafana/beta/
```

### 3.3 Logstash 파이프라인 설정
```powershell
# Logstash 파이프라인 설정 파일 작성
@"
input {
  file {
    path => "/logs/**/*.log"
    start_position => "beginning"
    sincedb_path => "/dev/null"
  }
}

filter {
  grok {
    match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} - %{LOGLEVEL:log_level} - %{GREEDYDATA:log_message}" }
  }
  
  date {
    match => [ "timestamp", "ISO8601" ]
    target => "@timestamp"
  }
  
  mutate {
    add_field => { "environment" => "beta" }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "christmas-logs-%{+YYYY.MM.dd}"
  }
}
"@ | Out-File -Encoding utf8 "config/logstash/beta/christmas.conf"
```

## 4. 이미지 빌드 및 컨테이너 실행

### 4.1 Docker 이미지 빌드
```powershell
# 베타 환경으로 이동
cd environments/beta

# Docker 네트워크 생성
docker network create christmas-beta-network

# Docker 이미지 빌드
docker-compose build
```

### 4.2 컨테이너 실행
```powershell
# Docker 컨테이너 실행
docker-compose up -d
```

### 4.3 컨테이너 상태 확인
```powershell
# 실행 중인 컨테이너 확인
docker-compose ps

# 각 서비스 로그 확인
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f ingestion
```

## 5. 초기 설정 및 검증

### 5.1 데이터베이스 마이그레이션
```powershell
# 데이터베이스 마이그레이션 실행
docker-compose exec api python -m app.db.migrate
```

### 5.2 샘플 데이터 로드
```powershell
# 테스트 데이터 로드
docker-compose exec api python -m app.scripts.load_sample_data
```

### 5.3 서비스 헬스 체크
```powershell
# 각 서비스 상태 확인
Invoke-WebRequest -Uri "http://localhost:7001/health" | Select-Object StatusCode, StatusDescription
Invoke-WebRequest -Uri "http://localhost:4001/health" | Select-Object StatusCode, StatusDescription
```

## 6. 모니터링 설정

### 6.1 Grafana 초기 설정
1. 브라우저에서 `http://localhost:7031` 접속
2. 기본 계정으로 로그인 (admin/beta_admin)
3. Prometheus 데이터 소스 설정 확인
4. 사전 구성된 대시보드 로드 확인

### 6.2 Kibana 초기 설정
1. 브라우저에서 `http://localhost:5601` 접속
2. 인덱스 패턴 설정: `christmas-logs-*`
3. 로그 탐색 페이지에서 로그 확인

### 6.3 Jaeger 추적 확인
1. 브라우저에서 `http://localhost:16686` 접속
2. 서비스별 트레이스 확인

## 7. 테스트 계정 설정

### 7.1 테스트 사용자 생성
```powershell
# 테스트 사용자 생성 스크립트 실행
docker-compose exec api python -m app.scripts.create_test_users
```

### 7.2 API 키 생성
```powershell
# 테스트용 API 키 생성
docker-compose exec api python -m app.scripts.generate_api_keys
```

## 8. Vercel 배포 설정 (웹 인터페이스)

### 8.1 Vercel CLI 설치 및 로그인
```powershell
# Vercel CLI 설치
npm install -g vercel

# Vercel 로그인
vercel login
```

### 8.2 환경 변수 설정
```powershell
# 환경 변수 설정
vercel env add API_URL
# 프롬프트에서 입력: https://api.christmas.example.com
```

### 8.3 프로젝트 배포
```powershell
# 베타 환경으로 배포
vercel --prod
```

## 9. 시스템 검증

### 9.1 기능 검증
- 사용자 인증 테스트
- 전략 설정 및 백테스팅 테스트
- 실시간 데이터 조회 테스트
- 알림 기능 테스트

### 9.2 외부 API 연결 테스트
```powershell
# 한국투자증권 API 연결 테스트
docker-compose exec api python -m app.scripts.test_kis_api

# 텔레그램 봇 연결 테스트
docker-compose exec telegram_bot python -m app.scripts.test_telegram_bot
```

### 9.3 API 인증 갱신 테스트
```powershell
# 토큰 갱신 기능 테스트
docker-compose exec api python -m app.scripts.test_token_refresh
```

### 9.4 성능 검증
```powershell
# 부하 테스트 실행
python -m tests.performance.test_load
```

### 9.5 모니터링 확인
- Grafana 대시보드 확인
- Prometheus 메트릭 확인
- Jaeger 트레이스 확인
- ELK 스택에서 로그 확인

### 9.6 한국투자증권 API 모니터링 설정
1. Grafana에서 한국투자증권 API 대시보드 설정
   - API 호출 횟수
   - 응답 시간
   - 오류율
   - 일일 API 호출 한도 추적

2. 알림 설정
   - API 호출 한도 80% 도달 시 알림
   - 토큰 만료 1시간 전 알림
   - 연속 API 오류 발생 시 알림

## 10. 베타 테스터 초대

### 10.1 테스터 계정 및 접근 정보 이메일 발송
```powershell
# 테스터 초대 이메일 발송 스크립트 실행
python -m app.scripts.send_beta_invitations
```

### 10.2 베타 테스트 기간 설정
- 베타 테스트 시작: 2025-06-05
- 베타 테스트 종료: 2025-06-30

## 11. 문제 해결

### 11.1 일반적인 문제
- Docker 컨테이너 재시작: `docker-compose restart [서비스명]`
- 로그 확인: `docker-compose logs -f [서비스명]`
- 컨테이너 쉘 접속: `docker-compose exec [서비스명] bash`

### 11.2 데이터베이스 문제
- DB 연결 확인: `docker-compose exec timescaledb psql -U christmas_beta -d christmas_beta`
- DB 백업: `docker-compose exec timescaledb pg_dump -U christmas_beta christmas_beta > backup.sql`

### 11.3 로깅 및 모니터링 문제
- Prometheus 상태 확인: `http://localhost:7091/-/healthy`
- Elasticsearch 상태 확인: `http://localhost:9200/_cluster/health`

## 12. 롤백 절차

### 12.1 컨테이너 롤백
```powershell
# 이전 버전으로 롤백
git checkout beta-v0.2.0-beta.0
docker-compose down
docker-compose build
docker-compose up -d
```

### 12.2 데이터베이스 롤백
```powershell
# 백업에서 복원
docker-compose exec timescaledb psql -U christmas_beta -d christmas_beta -f /backup/backup.sql
```

## 13. 베타 테스트 후 정식 버전 준비

### 13.1 피드백 수집 및 분석
```powershell
# 피드백 요약 보고서 생성
python -m app.scripts.generate_feedback_report
```

### 13.2 개선 사항 반영
- 우선순위가 높은 이슈 해결
- 성능 최적화 적용
- UI/UX 개선 반영

### 13.3 안정화 및 정식 버전 준비
- 최종 테스트 실행
- 문서 업데이트
- 출시 노트 작성

---

문제 발생 시 연락처:
- 기술 지원: tech-support@christmas.example.com
- 긴급 연락처: 010-1234-5678 
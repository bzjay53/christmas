# Christmas 설치 가이드

이 문서는 Christmas 트레이딩 플랫폼의 설치 및 설정 과정을 안내합니다.

## 목차

1. [요구 사항](#요구-사항)
2. [Docker로 설치](#docker로-설치)
3. [수동 설치](#수동-설치)
4. [환경 설정](#환경-설정)
5. [초기 설정](#초기-설정)
6. [시스템 검증](#시스템-검증)
7. [문제 해결](#문제-해결)

## 요구 사항

### 하드웨어 요구 사항
- CPU: 최소 4코어 (권장 8코어 이상)
- RAM: 최소 8GB (권장 16GB 이상)
- 디스크: 최소 100GB SSD
- 네트워크: 안정적인 인터넷 연결 (최소 10Mbps)

### 소프트웨어 요구 사항
- Docker Engine: 20.10.x 이상
- Docker Compose: 2.0 이상
- 또는 Python 3.10 이상 (수동 설치 시)
- PostgreSQL 14 이상 (수동 설치 시)
- Redis 7.0 이상 (수동 설치 시)

## Docker로 설치

Docker는 Christmas 플랫폼을 쉽게 설치하고 실행할 수 있는 가장 권장되는 방법입니다.

### 1. Docker 설치

#### Linux (Ubuntu/Debian)
```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Docker 서비스 시작 및 자동 시작 설정
sudo systemctl start docker
sudo systemctl enable docker
```

#### Windows
1. [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)를 다운로드하고 설치합니다.
2. 설치 중 WSL 2 백엔드 사용을 권장합니다.
3. 설치 후 Docker Desktop을 실행합니다.

#### macOS
1. [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)을 다운로드하고 설치합니다.
2. 설치 후 Docker Desktop을 실행합니다.

### 2. Christmas 다운로드

```bash
# 저장소 클론
git clone https://github.com/christmas/trading-platform.git
cd trading-platform
```

### 3. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집
# 필요한 환경 변수 설정
```

주요 환경 변수:
```
# 기본 설정
CHRISTMAS_ENV=production
CHRISTMAS_DEBUG=false
CHRISTMAS_LOG_LEVEL=info

# 데이터베이스 설정
CHRISTMAS_DB_HOST=timescaledb
CHRISTMAS_DB_PORT=5432
CHRISTMAS_DB_USER=christmas
CHRISTMAS_DB_PASSWORD=secure_password
CHRISTMAS_DB_NAME=christmas

# Redis 설정
CHRISTMAS_REDIS_HOST=redis
CHRISTMAS_REDIS_PORT=6379

# API 설정
CHRISTMAS_API_SECRET_KEY=your_secure_secret_key
CHRISTMAS_API_RATE_LIMIT=1200
```

### 4. Docker Compose로 실행

```bash
# 개발 환경에서 실행
docker-compose -f docker-compose.dev.yml up -d

# 프로덕션 환경에서 실행
docker-compose -f docker-compose.prod.yml up -d
```

Docker Compose는 다음 서비스를 시작합니다:
- `api`: Christmas API 서비스
- `worker`: 백그라운드 작업자
- `scheduler`: 주기적 작업 스케줄러
- `timescaledb`: 시계열 데이터베이스
- `redis`: 캐싱 및 메시지 브로커
- `web`: 웹 인터페이스
- `nginx`: 웹 프록시 및 로드 밸런서

## 수동 설치

수동 설치는 Docker를 사용할 수 없는 환경이나 세밀한 구성이 필요한 경우에 사용합니다.

### 1. 의존성 설치

#### TimescaleDB 설치
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y gnupg postgresql-common apt-transport-https lsb-release
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh

# TimescaleDB 저장소 추가
echo "deb https://packagecloud.io/timescale/timescaledb/$(lsb_release -is | awk '{print tolower($0)}')/ $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/timescaledb.list
wget --quiet -O - https://packagecloud.io/timescale/timescaledb/gpgkey | sudo apt-key add -

# TimescaleDB와 PostgreSQL 설치
sudo apt-get update
sudo apt-get install -y timescaledb-2-postgresql-14

# TimescaleDB 설정
sudo timescaledb-tune --yes
sudo systemctl restart postgresql
```

#### Redis 설치
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y redis-server

# Redis 설정
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 2. Python 환경 설정

```bash
# 필요한 패키지 설치
sudo apt-get update
sudo apt-get install -y python3.10 python3.10-venv python3.10-dev build-essential wget

# TA-Lib 설치 (기술적 분석 라이브러리)
wget http://prdownloads.sourceforge.net/ta-lib/ta-lib-0.4.0-src.tar.gz
tar -xzf ta-lib-0.4.0-src.tar.gz
cd ta-lib/
./configure --prefix=/usr
make
sudo make install
cd ..
rm -rf ta-lib ta-lib-0.4.0-src.tar.gz

# 가상 환경 생성 및 활성화
python3.10 -m venv venv
source venv/bin/activate

# 의존성 설치
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. 데이터베이스 설정

```bash
# PostgreSQL 사용자 및 데이터베이스 생성
sudo -u postgres psql -c "CREATE USER christmas WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "CREATE DATABASE christmas OWNER christmas;"

# TimescaleDB 확장 설치
sudo -u postgres psql -d christmas -c "CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"

# 데이터베이스 마이그레이션
cd /path/to/christmas
source venv/bin/activate
python -m app.db.migrations
```

## 환경 설정

### 설정 파일

Christmas는 계층적 설정 방식을 사용합니다. 다음과 같은 우선순위로 설정을 로드합니다:

1. 명령행 인수
2. 환경 변수
3. .env 파일
4. 기본 설정 파일 (config/settings.py)

주요 설정 파일:

- `config/settings.py`: 기본 설정
- `config/dev_settings.py`: 개발 환경 설정
- `config/prod_settings.py`: 프로덕션 환경 설정
- `.env`: 환경별 설정

### 로깅 설정

로깅 수준은 다음과 같이 설정할 수 있습니다:

```bash
# 환경 변수
export CHRISTMAS_LOG_LEVEL=debug  # debug, info, warning, error, critical 중 선택

# .env 파일
CHRISTMAS_LOG_LEVEL=debug
```

로그 파일은 기본적으로 `logs/` 디렉토리에 저장됩니다.

### 보안 설정

프로덕션 환경에서는 다음 보안 설정을 적용하세요:

1. 강력한 API 시크릿 키 생성: 최소 32자 이상
2. 데이터베이스 보안: 강력한 비밀번호 및 네트워크 접근 제한
3. Redis 보안: 비밀번호 설정 및 네트워크 접근 제한
4. TLS/SSL 설정: 모든 외부 통신에 HTTPS 적용

## 초기 설정

### 관리자 계정 생성

```bash
# Docker 환경
docker-compose exec api python -m app.scripts.create_admin

# 수동 설치 환경
source venv/bin/activate
python -m app.scripts.create_admin
```

### 초기 데이터 로드

```bash
# Docker 환경
docker-compose exec api python -m app.scripts.load_initial_data

# 수동 설치 환경
source venv/bin/activate
python -m app.scripts.load_initial_data
```

## 시스템 검증

설치가 완료된 후 시스템을 검증하기 위한 단계:

### 1. 서비스 상태 확인

```bash
# Docker 환경
docker-compose ps

# 수동 설치 환경
systemctl status postgresql
systemctl status redis-server
systemctl status christmas-api  # 서비스 설정 필요
```

### 2. 건강 상태 확인

```bash
# API 건강 상태 엔드포인트 요청
curl http://localhost:8000/api/v1/health

# 예상 응답
{
  "status": "OK",
  "version": "1.0.0",
  "db_connection": "OK",
  "redis_connection": "OK",
  "uptime": "0d 1h 23m 45s"
}
```

### 3. 로그 확인

```bash
# Docker 환경
docker-compose logs api

# 수동 설치 환경
tail -f logs/christmas.log
```

## 문제 해결

### 일반적인 문제

#### 데이터베이스 연결 실패
- 데이터베이스 서비스가 실행 중인지 확인
- 호스트, 포트, 사용자, 비밀번호 설정 확인
- 데이터베이스 로그 확인

#### Redis 연결 실패
- Redis 서비스가 실행 중인지 확인
- 호스트, 포트 설정 확인
- Redis 로그 확인

#### API 서비스 시작 실패
- 환경 변수 설정 확인
- 로그 파일 확인
- 의존성 설치 확인

### 문제 해결 명령

#### Docker 로그 확인
```bash
docker-compose logs service_name
```

#### 컨테이너 상태 확인
```bash
docker-compose ps
```

#### 설정 검증
```bash
docker-compose config
```

## 다음 단계

설치가 완료되었다면 다음 문서를 참조하여 Christmas 플랫폼을 사용하세요:

- [기능별 사용법](usage_guide.md)
- [문제 해결 가이드](troubleshooting.md)
- [FAQ](faq.md)
- [API 문서](../api/openapi-spec.yaml)

도움이 필요하거나 문제가 발생하면 [GitHub 이슈](https://github.com/christmas/trading-platform/issues)를 제출하거나 [지원 이메일](mailto:support@christmas-trading.com)로 문의하세요. 
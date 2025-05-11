#!/bin/bash
# Christmas 프로젝트 - 알파 테스트 환경 설정 스크립트

set -e # 오류 발생 시 스크립트 중단

# 로깅 설정
LOG_FILE="logs/setup_alpha_env_$(date +%Y%m%d_%H%M%S).log"
mkdir -p logs

# 로그 함수
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

# 배너 출력
echo "====================================================="
echo "   Christmas 프로젝트 - 알파 테스트 환경 설정        "
echo "====================================================="
echo ""

# 필요한 디렉토리 생성
log "알파 테스트 환경용 디렉토리 구조 생성 중..."
ENV_DIR="environments/alpha"

if [ -d "$ENV_DIR" ]; then
    log "경고: 알파 환경 디렉토리가 이미 존재합니다: $ENV_DIR"
    read -p "기존 환경을 덮어쓰시겠습니까? (y/n): " OVERWRITE
    if [ "$OVERWRITE" != "y" ]; then
        log "설정 중단. 기존 환경을 유지합니다."
        exit 0
    fi
    log "기존 환경을 덮어씁니다."
    # 기존 컨테이너 중지 및 삭제
    if [ -f "$ENV_DIR/docker-compose.yml" ]; then
        log "기존 컨테이너 정리 중..."
        cd "$ENV_DIR" && docker-compose down --remove-orphans
        cd -
    fi
else
    mkdir -p "$ENV_DIR"
    log "알파 환경 디렉토리 생성됨: $ENV_DIR"
fi

# 필요한 하위 디렉토리 생성
mkdir -p "$ENV_DIR/logs"
mkdir -p "$ENV_DIR/data"
mkdir -p "$ENV_DIR/config"

# 환경 설정 파일 생성
log "알파 테스트 환경 설정 파일 생성 중..."
cat > "$ENV_DIR/.env" << EOF
# Christmas 알파 테스트 환경 설정
# 생성 일시: $(date)

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
WEAVIATE_PORT=7800

# 데이터베이스 설정
DB_USER=christmas_alpha
DB_PASSWORD=alpha_password
DB_NAME=christmas_alpha

# 로깅 설정
LOG_LEVEL=DEBUG
EOF

log "환경 설정 파일 생성됨: $ENV_DIR/.env"

# Docker Compose 파일 복사 및 수정
log "Docker Compose 파일 준비 중..."
cp docker-compose.yml "$ENV_DIR/docker-compose.yml"

# 내부 테스트용 API 및 웹 컨테이너 실행을 위한 docker-compose.alpha.yml 생성
cat > "$ENV_DIR/docker-compose.alpha.yml" << EOF
version: '3.8'

services:
  api:
    build:
      context: ../..
      dockerfile: Dockerfile
    ports:
      - "\${API_PORT}:8000"
    environment:
      - CHRISTMAS_ENV=\${CHRISTMAS_ENV}
      - CHRISTMAS_VERSION=\${CHRISTMAS_VERSION}
      - DB_HOST=timescaledb
      - DB_PORT=5432
      - DB_USER=\${DB_USER}
      - DB_PASSWORD=\${DB_PASSWORD}
      - DB_NAME=\${DB_NAME}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - LOG_LEVEL=\${LOG_LEVEL}
    volumes:
      - ../../app:/app/app
      - ./logs:/app/logs
    depends_on:
      - timescaledb
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s

  web:
    build:
      context: ../..
      dockerfile: Dockerfile
    ports:
      - "\${WEB_PORT}:5000"
    environment:
      - CHRISTMAS_ENV=\${CHRISTMAS_ENV}
      - CHRISTMAS_VERSION=\${CHRISTMAS_VERSION}
      - API_URL=http://api:8000
      - LOG_LEVEL=\${LOG_LEVEL}
    volumes:
      - ../../app/web:/app/app/web
      - ./logs:/app/logs
    depends_on:
      - api
    restart: unless-stopped
    command: python -m flask --app app.web.main run --host=0.0.0.0 --port=5000

  timescaledb:
    image: timescale/timescaledb:latest-pg14
    ports:
      - "\${TIMESCALEDB_PORT}:5432"
    environment:
      - POSTGRES_USER=\${DB_USER}
      - POSTGRES_PASSWORD=\${DB_PASSWORD}
      - POSTGRES_DB=\${DB_NAME}
    volumes:
      - ./data/timescaledb:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER} -d \${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  redis:
    image: redis:alpine
    ports:
      - "\${REDIS_PORT}:6379"
    volumes:
      - ./data/redis:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # RAG 시스템 (선택적)
  weaviate:
    image: semitechnologies/weaviate:1.24.5
    ports:
      - "\${WEAVIATE_PORT}:8080"
    restart: unless-stopped
    environment:
      QUERY_DEFAULTS_LIMIT: 25
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'
      PERSISTENCE_DATA_PATH: '/var/lib/weaviate'
      DEFAULT_VECTORIZER_MODULE: 'text2vec-openai'
      ENABLE_MODULES: 'text2vec-openai'
      OPENAI_APIKEY: \${OPENAI_API_KEY:-}
      CLUSTER_HOSTNAME: 'node1'
    volumes:
      - ./data/weaviate:/var/lib/weaviate
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/v1/.well-known/ready"]
      interval: 10s
      timeout: 5s
      retries: 5

  # 모니터링 도구 (선택적)
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "\${PROMETHEUS_PORT}:9090"
    volumes:
      - ../../config/prometheus:/etc/prometheus
      - ./data/prometheus:/prometheus
    restart: unless-stopped
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "\${GRAFANA_PORT}:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=alpha_admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - ./data/grafana:/var/lib/grafana
      - ../../config/grafana:/etc/grafana/provisioning
    depends_on:
      - prometheus
    restart: unless-stopped
EOF

log "알파 테스트용 Docker Compose 파일 생성됨: $ENV_DIR/docker-compose.alpha.yml"

# 설정 파일 복사
log "설정 파일 복사 중..."
cp -r config/* "$ENV_DIR/config/"

# README 파일 생성
cat > "$ENV_DIR/README.md" << EOF
# Christmas 알파 테스트 환경

이 디렉토리는 Christmas 자동 매매 플랫폼 알파 버전 테스트 환경입니다.

## 시작 방법

1. 환경 시작:
   \`\`\`bash
   docker-compose -f docker-compose.alpha.yml up -d
   \`\`\`

2. 서비스 상태 확인:
   \`\`\`bash
   docker-compose -f docker-compose.alpha.yml ps
   \`\`\`

3. 로그 확인:
   \`\`\`bash
   docker-compose -f docker-compose.alpha.yml logs -f
   \`\`\`

## 접속 정보

- API 서버: http://localhost:${API_PORT}
- 웹 인터페이스: http://localhost:${WEB_PORT}
- Grafana: http://localhost:${GRAFANA_PORT} (계정: admin/alpha_admin)
- Prometheus: http://localhost:${PROMETHEUS_PORT}

## 데이터베이스 접속

\`\`\`bash
docker-compose -f docker-compose.alpha.yml exec timescaledb psql -U christmas_alpha -d christmas_alpha
\`\`\`

## 환경 중지

\`\`\`bash
docker-compose -f docker-compose.alpha.yml down
\`\`\`
EOF

log "README 파일 생성됨: $ENV_DIR/README.md"

# 마무리 메시지
log "알파 테스트 환경 설정 완료!"
echo ""
echo "알파 테스트 환경이 성공적으로 설정되었습니다."
echo "환경을 시작하려면 다음 명령을 실행하세요:"
echo "  cd environments/alpha"
echo "  docker-compose -f docker-compose.alpha.yml up -d"
echo ""
echo "자세한 안내는 environments/alpha/README.md 파일을 참조하세요."

exit 0 
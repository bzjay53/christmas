#!/bin/bash
# Christmas 프로젝트 - 블루/그린 배포 스크립트

set -e # 오류 발생 시 스크립트 중단

# 로깅 설정
LOG_FILE="logs/deploy_$(date +%Y%m%d_%H%M%S).log"
mkdir -p logs

# 로그 함수
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

# 배포 환경 변수 로드
if [ -f "deploy.env" ]; then
    source deploy.env
    log "환경 변수 로드 완료: CHRISTMAS_ENV=$CHRISTMAS_ENV, DEPLOY_TARGET=$DEPLOY_TARGET, DEPLOY_VERSION=$DEPLOY_VERSION"
else
    log "에러: deploy.env 파일이 존재하지 않음"
    exit 1
fi

# 기본값 설정
CHRISTMAS_ENV=${CHRISTMAS_ENV:-production}
DEPLOY_TARGET=${DEPLOY_TARGET:-blue}
DEPLOY_VERSION=${DEPLOY_VERSION:-latest}
COMPOSE_FILE="docker-compose.prod.yml"

# 대상 디렉토리 설정
TARGET_DIR="environments/${CHRISTMAS_ENV}/${DEPLOY_TARGET}"
log "배포 대상 디렉토리: $TARGET_DIR"

# 대상 디렉토리 생성
mkdir -p "$TARGET_DIR"

# 현재 디렉토리에서 필요한 파일 복사
log "배포 파일 준비 중..."
cp "$COMPOSE_FILE" "$TARGET_DIR/"
cp -r config "$TARGET_DIR/"
mkdir -p "$TARGET_DIR/logs"

# .env 파일 생성
cat > "$TARGET_DIR/.env" << EOF
# Christmas 자동 생성 환경 설정 파일 - $(date)
# 환경: $CHRISTMAS_ENV
# 대상: $DEPLOY_TARGET
# 버전: $DEPLOY_VERSION

CHRISTMAS_ENV=$CHRISTMAS_ENV
CHRISTMAS_INSTANCE=$DEPLOY_TARGET
CHRISTMAS_VERSION=$DEPLOY_VERSION

# 서비스 포트 설정 (블루/그린 분리)
EOF

# 블루/그린 환경에 따라 다른 포트 할당
if [ "$DEPLOY_TARGET" = "blue" ]; then
    cat >> "$TARGET_DIR/.env" << EOF
API_PORT=8001
WEB_PORT=5001
NGINX_PORT=8081
PROMETHEUS_PORT=9091
GRAFANA_PORT=3001
EOF
else
    cat >> "$TARGET_DIR/.env" << EOF
API_PORT=8002
WEB_PORT=5002
NGINX_PORT=8082
PROMETHEUS_PORT=9092
GRAFANA_PORT=3002
EOF
fi

# 기존 .env 파일에서 민감한 정보 복사
if [ -f ".env" ]; then
    log "기존 .env 파일에서 민감한 정보 복사"
    grep -E "PASSWORD|SECRET|KEY|TOKEN" .env >> "$TARGET_DIR/.env" || true
fi

# 디렉토리 이동
cd "$TARGET_DIR"

# 컨테이너 중지 및 삭제
log "기존 컨테이너 정리 중..."
docker-compose -f "$COMPOSE_FILE" down --remove-orphans || true

# 이미지 풀
log "최신 이미지 다운로드 중..."
docker-compose -f "$COMPOSE_FILE" pull

# 컨테이너 시작
log "새 컨테이너 시작 중..."
docker-compose -f "$COMPOSE_FILE" up -d

# 배포 상태 확인
log "배포 상태 확인 중..."
sleep 10 # 컨테이너 시작 대기

# 서비스 헬스 체크
API_PORT=$(grep API_PORT .env | cut -d= -f2)
HEALTH_CHECK_URL="http://localhost:$API_PORT/api/health"

log "헬스 체크 URL: $HEALTH_CHECK_URL"
RETRY_COUNT=0
MAX_RETRIES=10
RETRY_DELAY=5

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        log "서비스 헬스 체크 성공!"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        log "서비스 아직 준비되지 않음 (상태: $HTTP_STATUS). 재시도 $RETRY_COUNT/$MAX_RETRIES..."
        sleep $RETRY_DELAY
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    log "에러: 서비스 헬스 체크 실패"
    exit 1
fi

# 배포 정보 기록
DEPLOY_INFO_FILE="../current_deploy_info.json"
cat > "$DEPLOY_INFO_FILE" << EOF
{
    "environment": "$CHRISTMAS_ENV",
    "target": "$DEPLOY_TARGET",
    "version": "$DEPLOY_VERSION",
    "deployed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "deployed_by": "$USER"
}
EOF

log "배포 완료: $CHRISTMAS_ENV/$DEPLOY_TARGET ($DEPLOY_VERSION)"
exit 0 
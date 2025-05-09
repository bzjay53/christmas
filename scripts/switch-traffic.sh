#!/bin/bash
# Christmas 프로젝트 - 트래픽 전환 스크립트

set -e # 오류 발생 시 스크립트 중단

# 로깅 설정
LOG_FILE="logs/switch_$(date +%Y%m%d_%H%M%S).log"
mkdir -p logs

# 로그 함수
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

# 매개변수 확인
if [ $# -ne 1 ]; then
    log "사용법: $0 <target_environment> (blue 또는 green)"
    exit 1
fi

# 대상 환경 설정
TARGET_ENV=$1
ENVIRONMENT="production" # 기본값은 production

# 대상 환경 검증
if [ "$TARGET_ENV" != "blue" ] && [ "$TARGET_ENV" != "green" ]; then
    log "에러: 유효하지 않은 대상 환경 ($TARGET_ENV). 'blue' 또는 'green'이어야 합니다."
    exit 1
fi

# 배포 정보 확인
DEPLOY_INFO_FILE="environments/$ENVIRONMENT/$TARGET_ENV/current_deploy_info.json"
if [ ! -f "$DEPLOY_INFO_FILE" ]; then
    log "에러: 배포 정보 파일이 존재하지 않음: $DEPLOY_INFO_FILE"
    exit 1
fi

# 현재 활성 환경 확인
ACTIVE_ENV_FILE="environments/$ENVIRONMENT/active_environment"
if [ -f "$ACTIVE_ENV_FILE" ]; then
    ACTIVE_ENV=$(cat "$ACTIVE_ENV_FILE")
    log "현재 활성 환경: $ACTIVE_ENV"
else
    ACTIVE_ENV="unknown"
    log "경고: 활성 환경 정보가 없음. 새로 생성됩니다."
fi

# 동일 환경 확인
if [ "$ACTIVE_ENV" = "$TARGET_ENV" ]; then
    log "경고: 대상 환경이 이미 활성화됨: $TARGET_ENV"
    exit 0
fi

# Nginx 설정 파일 경로
NGINX_CONFIG_DIR="/etc/nginx/conf.d"
NGINX_CONFIG_FILE="$NGINX_CONFIG_DIR/christmas.conf"

# Nginx 설정 백업
if [ -f "$NGINX_CONFIG_FILE" ]; then
    BACKUP_FILE="${NGINX_CONFIG_FILE}.bak.$(date +%Y%m%d%H%M%S)"
    cp "$NGINX_CONFIG_FILE" "$BACKUP_FILE"
    log "Nginx 설정 백업 생성: $BACKUP_FILE"
fi

# 대상 환경의 포트 정보 추출
TARGET_DIR="environments/$ENVIRONMENT/$TARGET_ENV"
TARGET_ENV_FILE="$TARGET_DIR/.env"

if [ ! -f "$TARGET_ENV_FILE" ]; then
    log "에러: 대상 환경 변수 파일이 존재하지 않음: $TARGET_ENV_FILE"
    exit 1
fi

# 포트 정보 추출
API_PORT=$(grep API_PORT "$TARGET_ENV_FILE" | cut -d= -f2)
WEB_PORT=$(grep WEB_PORT "$TARGET_ENV_FILE" | cut -d= -f2)
NGINX_PORT=$(grep NGINX_PORT "$TARGET_ENV_FILE" | cut -d= -f2)

log "대상 환경 포트: API=$API_PORT, WEB=$WEB_PORT, NGINX=$NGINX_PORT"

# Nginx 설정 파일 생성
cat > "$NGINX_CONFIG_FILE" << EOF
# Christmas 프로젝트 Nginx 설정
# 환경: $ENVIRONMENT
# 활성화 인스턴스: $TARGET_ENV
# 생성 일시: $(date)

upstream christmas_api {
    server localhost:$API_PORT;
}

upstream christmas_web {
    server localhost:$WEB_PORT;
}

server {
    listen 80;
    server_name _;
    
    access_log /var/log/nginx/christmas_access.log;
    error_log /var/log/nginx/christmas_error.log;
    
    # API 요청 처리
    location /api/ {
        proxy_pass http://christmas_api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        
        # 헬스 체크를 위한 특별 헤더
        proxy_set_header X-Christmas-Instance $TARGET_ENV;
    }
    
    # 웹 요청 처리
    location / {
        proxy_pass http://christmas_web;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        
        # 헬스 체크를 위한 특별 헤더
        proxy_set_header X-Christmas-Instance $TARGET_ENV;
    }
}
EOF

log "Nginx 설정 생성 완료"

# Nginx 설정 검증
nginx -t
if [ $? -ne 0 ]; then
    log "에러: Nginx 설정이 유효하지 않음"
    
    # 백업에서 복원
    if [ -f "$BACKUP_FILE" ]; then
        log "백업에서 Nginx 설정 복원 중..."
        cp "$BACKUP_FILE" "$NGINX_CONFIG_FILE"
        systemctl reload nginx
    fi
    
    exit 1
fi

# Nginx 재시작
log "Nginx 설정 적용 중..."
systemctl reload nginx

# 활성 환경 정보 업데이트
echo "$TARGET_ENV" > "$ACTIVE_ENV_FILE"
log "활성 환경 업데이트: $TARGET_ENV"

# 필요한 경우 이전 환경 종료
if [ "$ACTIVE_ENV" != "unknown" ] && [ "$ACTIVE_ENV" != "$TARGET_ENV" ]; then
    log "이전 환경($ACTIVE_ENV)을 유지 관리 모드로 전환..."
    # 여기서는 종료하지 않고 유지 - 롤백을 위해
fi

log "트래픽 전환 성공: $ACTIVE_ENV -> $TARGET_ENV"
exit 0 
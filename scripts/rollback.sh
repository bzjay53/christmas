#!/bin/bash
# Christmas 프로젝트 - 롤백 스크립트

set -e # 오류 발생 시 스크립트 중단

# 로깅 설정
LOG_FILE="logs/rollback_$(date +%Y%m%d_%H%M%S).log"
mkdir -p logs

# 로그 함수
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

# 매개변수 확인
if [ $# -ne 1 ]; then
    log "사용법: $0 <environment> (예: production)"
    exit 1
fi

# 환경 설정
ENVIRONMENT=$1

# 환경 검증
if [ ! -d "environments/$ENVIRONMENT" ]; then
    log "에러: 유효하지 않은 환경 ($ENVIRONMENT). 디렉토리가 존재하지 않습니다."
    exit 1
fi

# 현재 활성 환경 확인
ACTIVE_ENV_FILE="environments/$ENVIRONMENT/active_environment"
if [ ! -f "$ACTIVE_ENV_FILE" ]; then
    log "에러: 활성 환경 파일이 존재하지 않음: $ACTIVE_ENV_FILE"
    exit 1
fi

ACTIVE_ENV=$(cat "$ACTIVE_ENV_FILE")
log "현재 활성 환경: $ACTIVE_ENV"

# 이전 배포 정보 확인
PREV_DEPLOY_FILE="environments/$ENVIRONMENT/previous_deploy"
if [ ! -f "$PREV_DEPLOY_FILE" ]; then
    log "에러: 이전 배포 정보 파일이 존재하지 않음: $PREV_DEPLOY_FILE"
    exit 1
fi

PREV_ENV=$(cat "$PREV_DEPLOY_FILE")
log "이전 배포 환경: $PREV_ENV"

# 동일 환경 확인
if [ "$ACTIVE_ENV" = "$PREV_ENV" ]; then
    log "경고: 롤백 대상이 현재 활성화된 환경과 동일함: $PREV_ENV"
    exit 0
fi

# 롤백 대상 환경 디렉토리 확인
ROLLBACK_DIR="environments/$ENVIRONMENT/$PREV_ENV"
if [ ! -d "$ROLLBACK_DIR" ]; then
    log "에러: 롤백 대상 환경 디렉토리가 존재하지 않음: $ROLLBACK_DIR"
    exit 1
fi

log "롤백 시작: $ACTIVE_ENV -> $PREV_ENV"

# 롤백 전 확인
read -p "정말로 $ENVIRONMENT 환경을 $PREV_ENV로 롤백하시겠습니까? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    log "롤백 취소됨"
    exit 0
fi

# 트래픽 전환 스크립트 호출
log "트래픽 전환 스크립트 실행 중..."
./switch-traffic.sh "$PREV_ENV"

# 롤백 결과 확인
if [ $? -ne 0 ]; then
    log "에러: 트래픽 전환 실패"
    exit 1
fi

# 롤백 정보 업데이트
echo "$ACTIVE_ENV" > "$PREV_DEPLOY_FILE"
log "롤백 완료: $ACTIVE_ENV -> $PREV_ENV"

# 알림 전송 (필요한 경우)
# (여기에 알림 로직을 추가할 수 있음)

exit 0 
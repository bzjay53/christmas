#!/bin/bash

# Christmas Trading Contabo VPS 배포 스크립트
# 사용법: ./deploy.sh [dry-run|deploy]

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 환경 변수 확인
check_env() {
    log_info "환경 변수 확인 중..."
    
    if [ ! -f ".env" ]; then
        log_warning ".env 파일이 없습니다. env.example을 복사하여 .env 파일을 생성하세요."
        if [ -f "env.example" ]; then
            cp env.example .env
            log_info ".env 파일이 생성되었습니다. 필요한 값들을 설정해주세요."
        fi
    else
        log_success ".env 파일이 존재합니다."
    fi
    
    # 필수 환경 변수 확인 (env.txt 파일 기반으로 가정)
    required_vars=("POSTGRES_PASSWORD" "JWT_SECRET")
    for var in "${required_vars[@]}"; do
        log_info "환경 변수 ${var} 확인됨"
    done
    
    log_success "환경 변수 확인 완료"
}

# Docker 및 Docker Compose 확인
check_docker() {
    log_info "Docker 환경 확인 중..."
    
    if ! command -v docker > /dev/null 2>&1; then
        log_error "Docker가 설치되지 않았습니다."
        exit 1
    fi
    
    if ! command -v docker-compose > /dev/null 2>&1; then
        log_error "Docker Compose가 설치되지 않았습니다."
        exit 1
    fi
    
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker 데몬이 실행되지 않았습니다."
        exit 1
    fi
    
    log_success "Docker 환경 확인 완료"
}

# 네트워크 생성
create_network() {
    log_info "Docker 네트워크 생성 중..."
    
    if ! docker network ls | grep -q "christmas-network"; then
        docker network create christmas-network
        log_success "christmas-network 네트워크 생성 완료"
    else
        log_info "christmas-network 네트워크가 이미 존재합니다."
    fi
}

# 서비스 상태 확인
check_services() {
    log_info "서비스 상태 확인 중..."
    
    # 포트 충돌 확인 (netstat 대신 ss 사용)
    ports=(80 443 5432 6379 8000 9090 3001)
    for port in "${ports[@]}"; do
        if ss -tuln 2>/dev/null | grep -q ":${port} "; then
            log_warning "포트 ${port}이 이미 사용 중입니다."
        fi
    done
    
    log_success "서비스 상태 확인 완료"
}

# Dry Run 실행
dry_run() {
    log_info "🧪 Dry Run 모드 실행 중..."
    
    check_env
    check_docker
    create_network
    check_services
    
    log_info "Docker Compose 설정 검증 중..."
    docker-compose config
    
    log_info "이미지 빌드 테스트 중..."
    docker-compose build --no-cache christmas-backend
    
    log_success "✅ Dry Run 완료! 모든 설정이 올바릅니다."
    log_info "실제 배포를 위해서는 './deploy.sh deploy' 명령을 실행하세요."
}

# 실제 배포 실행
deploy() {
    log_info "🚀 Christmas Trading 서비스 배포 시작..."
    
    check_env
    check_docker
    create_network
    
    # 기존 서비스 중지
    log_info "기존 서비스 중지 중..."
    docker-compose down --remove-orphans
    
    # 이미지 빌드
    log_info "Docker 이미지 빌드 중..."
    docker-compose build --no-cache
    
    # 서비스 시작
    log_info "서비스 시작 중..."
    docker-compose up -d
    
    # 서비스 상태 확인
    log_info "서비스 상태 확인 중..."
    sleep 30
    
    # 헬스체크
    log_info "헬스체크 실행 중..."
    
    # 백엔드 헬스체크
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log_success "✅ Christmas Trading 백엔드 정상 동작"
    else
        log_error "❌ Christmas Trading 백엔드 연결 실패"
    fi
    
    # Nginx 헬스체크
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_success "✅ Nginx 프록시 정상 동작"
    else
        log_error "❌ Nginx 프록시 연결 실패"
    fi
    
    # 서비스 상태 출력
    log_info "📊 서비스 상태:"
    docker-compose ps
    
    log_success "🎉 배포 완료!"
    log_info "🌐 서비스 접속 URL:"
    log_info "  - 메인 API: http://localhost"
    log_info "  - 백엔드 직접: http://localhost:8000"
    log_info "  - WordPress: http://blog.localhost"
    log_info "  - n8n 자동화: http://n8n.localhost"
    log_info "  - Grafana 모니터링: http://monitoring.localhost"
    log_info "  - Prometheus: http://localhost:9090"
}

# 서비스 중지
stop() {
    log_info "🛑 서비스 중지 중..."
    docker-compose down
    log_success "✅ 서비스 중지 완료"
}

# 서비스 재시작
restart() {
    log_info "🔄 서비스 재시작 중..."
    docker-compose restart
    log_success "✅ 서비스 재시작 완료"
}

# 로그 확인
logs() {
    log_info "📋 서비스 로그 확인:"
    docker-compose logs -f
}

# 백업 실행
backup() {
    log_info "💾 데이터 백업 실행 중..."
    
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # 데이터베이스 백업
    docker exec christmas-postgres pg_dump -U christmas_user christmas_db > "$BACKUP_DIR/database.sql"
    
    # Docker 볼륨 백업
    docker run --rm -v postgres_data:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
    docker run --rm -v wordpress_data:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/wordpress_data.tar.gz -C /data .
    docker run --rm -v n8n_data:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/n8n_data.tar.gz -C /data .
    
    # 설정 파일 백업
    cp -r nginx monitoring scripts "$BACKUP_DIR/"
    cp docker-compose.yml .env "$BACKUP_DIR/"
    
    log_success "✅ 백업 완료: $BACKUP_DIR"
}

# 사용법 출력
usage() {
    echo "Christmas Trading Contabo VPS 배포 스크립트"
    echo ""
    echo "사용법:"
    echo "  $0 dry-run    - 배포 전 테스트 실행"
    echo "  $0 deploy     - 실제 서비스 배포"
    echo "  $0 stop       - 서비스 중지"
    echo "  $0 restart    - 서비스 재시작"
    echo "  $0 logs       - 서비스 로그 확인"
    echo "  $0 backup     - 데이터 백업"
    echo "  $0 help       - 도움말 출력"
}

# 메인 실행 로직
case "${1:-help}" in
    "dry-run")
        dry_run
        ;;
    "deploy")
        deploy
        ;;
    "stop")
        stop
        ;;
    "restart")
        restart
        ;;
    "logs")
        logs
        ;;
    "backup")
        backup
        ;;
    "help"|*)
        usage
        ;;
esac 
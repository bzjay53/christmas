#!/bin/bash

# Christmas Trading Contabo 서버 배포 스크립트
# 사용법: ./deploy-to-contabo.sh [dry-run|deploy|stop|restart|logs|backup]

set -e

# 서버 정보
SERVER_IP="31.220.83.213"
SERVER_USER="christmas"
PROJECT_DIR="/home/christmas/christmas-trading"

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

# SSH 연결 테스트
test_ssh_connection() {
    log_info "SSH 연결 테스트 중..."
    
    if ssh -o ConnectTimeout=10 ${SERVER_USER}@${SERVER_IP} "echo 'SSH 연결 성공'" > /dev/null 2>&1; then
        log_success "SSH 연결 성공"
    else
        log_error "SSH 연결 실패. 서버 접속을 확인해주세요."
        exit 1
    fi
}

# 서버 환경 확인
check_server_environment() {
    log_info "서버 환경 확인 중..."
    
    ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
        echo "=== 서버 정보 ==="
        uname -a
        echo ""
        
        echo "=== Docker 버전 ==="
        docker --version
        docker-compose --version
        echo ""
        
        echo "=== 시스템 리소스 ==="
        free -h
        df -h
        echo ""
        
        echo "=== Docker 서비스 상태 ==="
        systemctl is-active docker
EOF
    
    log_success "서버 환경 확인 완료"
}

# 프로젝트 파일 업로드
upload_project_files() {
    log_info "프로젝트 파일 업로드 중..."
    
    # 서버에 프로젝트 디렉토리 생성
    ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ${PROJECT_DIR}"
    
    # 필요한 파일들 업로드
    log_info "Docker 설정 파일 업로드 중..."
    scp docker-compose.yml ${SERVER_USER}@${SERVER_IP}:${PROJECT_DIR}/
    scp env.example ${SERVER_USER}@${SERVER_IP}:${PROJECT_DIR}/
    scp deploy.sh ${SERVER_USER}@${SERVER_IP}:${PROJECT_DIR}/
    
    # 백엔드 소스 코드 업로드
    log_info "백엔드 소스 코드 업로드 중..."
    scp -r backend/ ${SERVER_USER}@${SERVER_IP}:${PROJECT_DIR}/
    
    # 설정 파일들 업로드
    log_info "설정 파일 업로드 중..."
    scp -r nginx/ ${SERVER_USER}@${SERVER_IP}:${PROJECT_DIR}/
    scp -r monitoring/ ${SERVER_USER}@${SERVER_IP}:${PROJECT_DIR}/
    scp -r scripts/ ${SERVER_USER}@${SERVER_IP}:${PROJECT_DIR}/
    
    log_success "프로젝트 파일 업로드 완료"
}

# 서버 환경 설정
setup_server_environment() {
    log_info "서버 환경 설정 중..."
    
    ssh ${SERVER_USER}@${SERVER_IP} << EOF
        cd ${PROJECT_DIR}
        
        # 환경 변수 파일 설정
        if [ ! -f .env ]; then
            cp env.example .env
            echo "환경 변수 파일 생성됨"
        fi
        
        # 필요한 디렉토리 생성
        mkdir -p nginx/ssl nginx/logs monitoring/grafana
        chmod 755 nginx/ssl nginx/logs monitoring/grafana
        
        # Docker 네트워크 생성
        docker network create christmas-network 2>/dev/null || echo "네트워크가 이미 존재합니다"
        
        # 스크립트 실행 권한 부여
        chmod +x deploy.sh
        
        echo "서버 환경 설정 완료"
EOF
    
    log_success "서버 환경 설정 완료"
}

# Dry Run 실행
dry_run() {
    log_info "🧪 Dry Run 모드 실행 중..."
    
    test_ssh_connection
    check_server_environment
    upload_project_files
    setup_server_environment
    
    log_info "서버에서 Docker Compose 설정 검증 중..."
    ssh ${SERVER_USER}@${SERVER_IP} << EOF
        cd ${PROJECT_DIR}
        docker-compose config
        echo ""
        echo "백엔드 이미지 빌드 테스트 중..."
        docker-compose build christmas-backend
EOF
    
    log_success "✅ Dry Run 완료! 모든 설정이 올바릅니다."
    log_info "실제 배포를 위해서는 './deploy-to-contabo.sh deploy' 명령을 실행하세요."
}

# 실제 배포 실행
deploy() {
    log_info "🚀 Christmas Trading 서버 배포 시작..."
    
    test_ssh_connection
    upload_project_files
    setup_server_environment
    
    log_info "서버에서 서비스 배포 중..."
    ssh ${SERVER_USER}@${SERVER_IP} << EOF
        cd ${PROJECT_DIR}
        
        # 기존 서비스 중지
        echo "기존 서비스 중지 중..."
        docker-compose down --remove-orphans 2>/dev/null || true
        
        # 이미지 빌드
        echo "Docker 이미지 빌드 중..."
        docker-compose build --no-cache
        
        # 단계별 서비스 시작
        echo "데이터베이스 서비스 시작 중..."
        docker-compose up -d postgres redis
        
        echo "30초 대기 중..."
        sleep 30
        
        echo "백엔드 서비스 시작 중..."
        docker-compose up -d christmas-backend
        
        echo "웹 서비스 시작 중..."
        docker-compose up -d wordpress n8n
        
        echo "프록시 및 모니터링 서비스 시작 중..."
        docker-compose up -d nginx prometheus grafana
        
        echo "서비스 상태 확인 중..."
        sleep 10
        docker-compose ps
EOF
    
    # 헬스체크 실행
    log_info "헬스체크 실행 중..."
    sleep 30
    
    if curl -f http://${SERVER_IP}/health > /dev/null 2>&1; then
        log_success "✅ Nginx 프록시 정상 동작"
    else
        log_warning "⚠️ Nginx 프록시 연결 확인 필요"
    fi
    
    if curl -f http://${SERVER_IP}:8000/health > /dev/null 2>&1; then
        log_success "✅ Christmas Trading 백엔드 정상 동작"
    else
        log_warning "⚠️ 백엔드 서비스 연결 확인 필요"
    fi
    
    log_success "🎉 배포 완료!"
    log_info "🌐 서비스 접속 URL:"
    log_info "  - 메인 API: http://${SERVER_IP}/"
    log_info "  - 백엔드 직접: http://${SERVER_IP}:8000/"
    log_info "  - WordPress: http://blog.${SERVER_IP}/"
    log_info "  - n8n 자동화: http://n8n.${SERVER_IP}/"
    log_info "  - Grafana 모니터링: http://monitoring.${SERVER_IP}/"
    log_info "  - Prometheus: http://${SERVER_IP}:9090/"
}

# 서비스 중지
stop() {
    log_info "🛑 서버 서비스 중지 중..."
    
    ssh ${SERVER_USER}@${SERVER_IP} << EOF
        cd ${PROJECT_DIR}
        docker-compose down
EOF
    
    log_success "✅ 서비스 중지 완료"
}

# 서비스 재시작
restart() {
    log_info "🔄 서버 서비스 재시작 중..."
    
    ssh ${SERVER_USER}@${SERVER_IP} << EOF
        cd ${PROJECT_DIR}
        docker-compose restart
EOF
    
    log_success "✅ 서비스 재시작 완료"
}

# 로그 확인
logs() {
    log_info "📋 서버 서비스 로그 확인:"
    
    ssh ${SERVER_USER}@${SERVER_IP} << EOF
        cd ${PROJECT_DIR}
        docker-compose logs -f
EOF
}

# 백업 실행
backup() {
    log_info "💾 서버 데이터 백업 실행 중..."
    
    ssh ${SERVER_USER}@${SERVER_IP} << EOF
        cd ${PROJECT_DIR}
        
        BACKUP_DIR="./backups/\$(date +%Y%m%d_%H%M%S)"
        mkdir -p "\$BACKUP_DIR"
        
        # 데이터베이스 백업
        docker exec christmas-postgres pg_dump -U christmas_user christmas_db > "\$BACKUP_DIR/database.sql"
        
        # Docker 볼륨 백업
        docker run --rm -v postgres_data:/data -v "\$(pwd)/\$BACKUP_DIR":/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
        docker run --rm -v wordpress_data:/data -v "\$(pwd)/\$BACKUP_DIR":/backup alpine tar czf /backup/wordpress_data.tar.gz -C /data .
        docker run --rm -v n8n_data:/data -v "\$(pwd)/\$BACKUP_DIR":/backup alpine tar czf /backup/n8n_data.tar.gz -C /data .
        
        # 설정 파일 백업
        cp -r nginx monitoring scripts "\$BACKUP_DIR/"
        cp docker-compose.yml .env "\$BACKUP_DIR/"
        
        echo "백업 완료: \$BACKUP_DIR"
EOF
    
    log_success "✅ 백업 완료"
}

# 사용법 출력
usage() {
    echo "Christmas Trading Contabo 서버 배포 스크립트"
    echo ""
    echo "사용법:"
    echo "  $0 dry-run    - 배포 전 테스트 실행"
    echo "  $0 deploy     - 실제 서버 배포"
    echo "  $0 stop       - 서비스 중지"
    echo "  $0 restart    - 서비스 재시작"
    echo "  $0 logs       - 서비스 로그 확인"
    echo "  $0 backup     - 데이터 백업"
    echo "  $0 help       - 도움말 출력"
    echo ""
    echo "서버 정보:"
    echo "  - IP: ${SERVER_IP}"
    echo "  - 사용자: ${SERVER_USER}"
    echo "  - 프로젝트 경로: ${PROJECT_DIR}"
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
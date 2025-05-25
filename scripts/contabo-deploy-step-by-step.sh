#!/bin/bash

# Christmas Trading Contabo 서버 단계별 배포 스크립트
# 서버에서 직접 실행: bash contabo-deploy-step-by-step.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 단계별 실행 함수
step_1_environment_check() {
    log_info "🔍 1단계: 서버 환경 확인"
    
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
    
    log_success "✅ 1단계 완료: 환경 확인"
}

step_2_project_setup() {
    log_info "📁 2단계: 프로젝트 설정"
    
    # 프로젝트 디렉토리 생성
    PROJECT_DIR="/home/christmas/christmas-trading"
    mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR
    
    # 기존 파일이 있다면 백업
    if [ -d ".git" ]; then
        log_warning "기존 프로젝트 발견. 백업 중..."
        mv christmas-trading christmas-trading-backup-$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
    fi
    
    # GitHub에서 클론
    log_info "GitHub에서 최신 코드 클론 중..."
    git clone https://github.com/bzjay53/christmas.git .
    
    log_success "✅ 2단계 완료: 프로젝트 설정"
}

step_3_environment_variables() {
    log_info "⚙️ 3단계: 환경 변수 설정"
    
    # .env 파일 생성
    if [ ! -f .env ]; then
        cp env.example .env
        log_info ".env 파일 생성됨"
    else
        log_info ".env 파일이 이미 존재합니다"
    fi
    
    # 환경 변수 확인
    log_info "환경 변수 확인 중..."
    if grep -q "POSTGRES_PASSWORD" .env; then
        log_success "POSTGRES_PASSWORD 설정됨"
    fi
    
    if grep -q "JWT_SECRET" .env; then
        log_success "JWT_SECRET 설정됨"
    fi
    
    log_success "✅ 3단계 완료: 환경 변수 설정"
}

step_4_docker_setup() {
    log_info "🐳 4단계: Docker 환경 설정"
    
    # 필요한 디렉토리 생성
    mkdir -p nginx/ssl nginx/logs monitoring/grafana
    chmod 755 nginx/ssl nginx/logs monitoring/grafana
    
    # Docker 네트워크 생성
    docker network create christmas-network 2>/dev/null || log_info "네트워크가 이미 존재합니다"
    
    # Docker Compose 설정 검증
    log_info "Docker Compose 설정 검증 중..."
    docker-compose config > /dev/null
    
    log_success "✅ 4단계 완료: Docker 환경 설정"
}

step_5_build_images() {
    log_info "🔨 5단계: Docker 이미지 빌드"
    
    # 기존 컨테이너 정리
    log_info "기존 컨테이너 정리 중..."
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # 이미지 빌드
    log_info "백엔드 이미지 빌드 중..."
    docker-compose build --no-cache christmas-backend
    
    log_success "✅ 5단계 완료: 이미지 빌드"
}

step_6_start_services() {
    log_info "🚀 6단계: 서비스 시작"
    
    # 데이터베이스 서비스 먼저 시작
    log_info "데이터베이스 서비스 시작 중..."
    docker-compose up -d postgres redis
    
    # 30초 대기
    log_info "데이터베이스 초기화 대기 중... (30초)"
    sleep 30
    
    # 백엔드 서비스 시작
    log_info "백엔드 서비스 시작 중..."
    docker-compose up -d christmas-backend
    
    # 웹 서비스 시작
    log_info "웹 서비스 시작 중..."
    docker-compose up -d wordpress n8n
    
    # 프록시 및 모니터링 시작
    log_info "프록시 및 모니터링 서비스 시작 중..."
    docker-compose up -d nginx prometheus grafana
    
    log_success "✅ 6단계 완료: 서비스 시작"
}

step_7_health_check() {
    log_info "🏥 7단계: 헬스체크"
    
    # 서비스 상태 확인
    log_info "서비스 상태 확인 중..."
    docker-compose ps
    
    # 10초 대기 후 헬스체크
    log_info "헬스체크 준비 중... (10초 대기)"
    sleep 10
    
    # 백엔드 헬스체크
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log_success "✅ 백엔드 서비스 정상"
    else
        log_warning "⚠️ 백엔드 서비스 확인 필요"
    fi
    
    # Nginx 헬스체크
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_success "✅ Nginx 프록시 정상"
    else
        log_warning "⚠️ Nginx 프록시 확인 필요"
    fi
    
    log_success "✅ 7단계 완료: 헬스체크"
}

step_8_final_verification() {
    log_info "🎯 8단계: 최종 검증"
    
    # 외부 접속 테스트
    SERVER_IP="31.220.83.213"
    
    log_info "외부 접속 테스트 중..."
    if curl -f http://$SERVER_IP/health > /dev/null 2>&1; then
        log_success "✅ 외부에서 접속 가능"
    else
        log_warning "⚠️ 외부 접속 확인 필요"
    fi
    
    # 서비스 URL 출력
    log_success "🎉 배포 완료!"
    echo ""
    log_info "🌐 서비스 접속 URL:"
    log_info "  - 메인 API: http://$SERVER_IP/"
    log_info "  - 백엔드 직접: http://$SERVER_IP:8000/"
    log_info "  - WordPress: http://blog.$SERVER_IP/"
    log_info "  - n8n 자동화: http://n8n.$SERVER_IP/"
    log_info "  - Grafana 모니터링: http://monitoring.$SERVER_IP/"
    log_info "  - Prometheus: http://$SERVER_IP:9090/"
    
    log_success "✅ 8단계 완료: 최종 검증"
}

# 메인 실행 함수
main() {
    log_info "🎄 Christmas Trading Contabo 서버 배포 시작"
    echo "서버 IP: 31.220.83.213"
    echo "배포 시간: $(date)"
    echo ""
    
    step_1_environment_check
    echo ""
    
    step_2_project_setup
    echo ""
    
    step_3_environment_variables
    echo ""
    
    step_4_docker_setup
    echo ""
    
    step_5_build_images
    echo ""
    
    step_6_start_services
    echo ""
    
    step_7_health_check
    echo ""
    
    step_8_final_verification
    echo ""
    
    log_success "🎉 전체 배포 프로세스 완료!"
}

# 스크립트 실행
main 
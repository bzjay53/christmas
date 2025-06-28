#!/bin/bash
# Christmas Trading - Docker Management Script
# Docker 서비스 관리를 위한 통합 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로고 출력
print_logo() {
    echo -e "${GREEN}"
    echo "🎄 Christmas Trading - Docker Management"
    echo "========================================="
    echo -e "${NC}"
}

# 도움말 출력
print_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start          - 서비스 시작 (프로덕션 모드)"
    echo "  dev            - 개발 모드로 시작"
    echo "  stop           - 서비스 중지"
    echo "  restart        - 서비스 재시작"
    echo "  logs           - 로그 확인"
    echo "  status         - 서비스 상태 확인"
    echo "  build          - Docker 이미지 빌드"
    echo "  clean          - 컨테이너 및 이미지 정리"
    echo "  backup         - 데이터 백업"
    echo "  restore        - 데이터 복원"
    echo "  setup          - 초기 설정"
    echo "  health         - 헬스체크"
    echo ""
    echo "Options:"
    echo "  --proxy        - Nginx 프록시 포함"
    echo "  --no-build     - 빌드 없이 시작"
    echo "  --force        - 강제 실행"
    echo ""
    echo "Examples:"
    echo "  $0 start                    # 프로덕션 모드 시작"
    echo "  $0 dev                      # 개발 모드 시작"
    echo "  $0 start --proxy            # 프록시 포함하여 시작"
    echo "  $0 logs christmas-trading   # 특정 서비스 로그"
    echo "  $0 backup                   # 데이터 백업"
}

# 환경 변수 확인
check_environment() {
    echo -e "${BLUE}🔍 환경 설정 확인 중...${NC}"
    
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  .env 파일이 없습니다. .env.docker를 복사합니다.${NC}"
        cp .env.docker .env
    fi
    
    # 필수 환경 변수 확인
    if ! grep -q "VITE_SUPABASE_URL" .env; then
        echo -e "${RED}❌ VITE_SUPABASE_URL이 설정되지 않았습니다.${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ 환경 설정 확인 완료${NC}"
}

# Docker 설치 확인
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker가 설치되지 않았습니다.${NC}"
        echo "Docker를 설치해주세요: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose가 설치되지 않았습니다.${NC}"
        echo "Docker Compose를 설치해주세요."
        exit 1
    fi
    
    # Docker 데몬 실행 확인
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker 데몬이 실행되지 않고 있습니다.${NC}"
        echo "Docker를 시작해주세요."
        exit 1
    fi
}

# 서비스 시작
start_services() {
    local profile=""
    local build_flag="--build"
    
    # 옵션 처리
    while [[ $# -gt 0 ]]; do
        case $1 in
            --proxy)
                profile="--profile proxy"
                shift
                ;;
            --no-build)
                build_flag=""
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    echo -e "${BLUE}🚀 Christmas Trading 서비스 시작 중...${NC}"
    docker-compose $profile up -d $build_flag
    
    echo -e "${GREEN}✅ 서비스가 시작되었습니다!${NC}"
    echo ""
    echo "접속 URL:"
    echo "  - 메인 애플리케이션: http://localhost:3000"
    if [[ $profile == *"proxy"* ]]; then
        echo "  - Nginx 프록시: http://localhost:80"
    fi
    echo "  - Task Master MCP: http://localhost:8001"
    echo "  - Memory Bank MCP: http://localhost:8002"
    echo "  - Gemini MCP: http://localhost:8003"
}

# 개발 모드 시작
start_dev() {
    echo -e "${BLUE}🔧 개발 모드로 시작 중...${NC}"
    docker-compose --profile development up -d --build
    
    echo -e "${GREEN}✅ 개발 서비스가 시작되었습니다!${NC}"
    echo ""
    echo "개발 접속 URL:"
    echo "  - Vite Dev Server: http://localhost:5173"
    echo "  - Hot Reload 활성화됨"
}

# 서비스 중지
stop_services() {
    echo -e "${BLUE}🛑 서비스 중지 중...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ 서비스가 중지되었습니다.${NC}"
}

# 서비스 재시작
restart_services() {
    echo -e "${BLUE}🔄 서비스 재시작 중...${NC}"
    docker-compose restart
    echo -e "${GREEN}✅ 서비스가 재시작되었습니다.${NC}"
}

# 로그 확인
show_logs() {
    local service="$1"
    if [ -z "$service" ]; then
        echo -e "${BLUE}📋 모든 서비스 로그:${NC}"
        docker-compose logs -f
    else
        echo -e "${BLUE}📋 $service 로그:${NC}"
        docker-compose logs -f "$service"
    fi
}

# 서비스 상태 확인
check_status() {
    echo -e "${BLUE}📊 서비스 상태:${NC}"
    docker-compose ps
    
    echo -e "\n${BLUE}💾 볼륨 정보:${NC}"
    docker volume ls | grep christmas
    
    echo -e "\n${BLUE}🌐 네트워크 정보:${NC}"
    docker network ls | grep christmas
}

# 이미지 빌드
build_images() {
    echo -e "${BLUE}🔨 Docker 이미지 빌드 중...${NC}"
    docker-compose build --no-cache
    echo -e "${GREEN}✅ 이미지 빌드 완료${NC}"
}

# 정리
clean_up() {
    local force="$1"
    
    if [ "$force" != "--force" ]; then
        echo -e "${YELLOW}⚠️  이 작업은 모든 컨테이너, 이미지, 볼륨을 삭제합니다.${NC}"
        read -p "계속하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "취소되었습니다."
            return
        fi
    fi
    
    echo -e "${BLUE}🧹 정리 중...${NC}"
    
    # 컨테이너 중지 및 삭제
    docker-compose down -v --remove-orphans
    
    # 이미지 삭제
    docker images | grep christmas | awk '{print $3}' | xargs -r docker rmi -f
    
    # 사용하지 않는 리소스 정리
    docker system prune -f
    
    echo -e "${GREEN}✅ 정리 완료${NC}"
}

# 데이터 백업
backup_data() {
    local backup_dir="./backups/$(date +%Y%m%d_%H%M%S)"
    
    echo -e "${BLUE}💾 데이터 백업 중...${NC}"
    mkdir -p "$backup_dir"
    
    # 볼륨 데이터 백업
    docker run --rm -v christmas-data:/data -v "$(pwd)/$backup_dir":/backup alpine \
        tar czf /backup/christmas-data.tar.gz -C /data .
    
    # 설정 파일 백업
    cp .env "$backup_dir/"
    cp docker-compose.yml "$backup_dir/"
    
    echo -e "${GREEN}✅ 백업 완료: $backup_dir${NC}"
}

# 데이터 복원
restore_data() {
    local backup_dir="$1"
    
    if [ -z "$backup_dir" ] || [ ! -d "$backup_dir" ]; then
        echo -e "${RED}❌ 백업 디렉토리를 지정해주세요.${NC}"
        echo "Usage: $0 restore [backup_directory]"
        return 1
    fi
    
    echo -e "${BLUE}📁 데이터 복원 중...${NC}"
    
    # 볼륨 데이터 복원
    if [ -f "$backup_dir/christmas-data.tar.gz" ]; then
        docker run --rm -v christmas-data:/data -v "$(pwd)/$backup_dir":/backup alpine \
            tar xzf /backup/christmas-data.tar.gz -C /data
    fi
    
    echo -e "${GREEN}✅ 복원 완료${NC}"
}

# 초기 설정
setup_project() {
    echo -e "${BLUE}⚙️  초기 설정 중...${NC}"
    
    # 환경 파일 설정
    if [ ! -f ".env" ]; then
        cp .env.docker .env
        echo -e "${YELLOW}📝 .env 파일을 생성했습니다. API 키를 설정해주세요.${NC}"
    fi
    
    # 디렉토리 생성
    mkdir -p logs data backups
    
    # 이미지 빌드
    docker-compose build
    
    echo -e "${GREEN}✅ 초기 설정 완료${NC}"
    echo ""
    echo "다음 단계:"
    echo "1. .env 파일에서 API 키 설정"
    echo "2. ./docker-manage.sh start 로 서비스 시작"
}

# 헬스체크
health_check() {
    echo -e "${BLUE}🏥 헬스체크 실행 중...${NC}"
    
    # 컨테이너 상태 확인
    if docker-compose ps | grep -q "Up"; then
        echo -e "${GREEN}✅ 컨테이너가 실행 중입니다.${NC}"
    else
        echo -e "${RED}❌ 컨테이너가 실행되지 않고 있습니다.${NC}"
        return 1
    fi
    
    # HTTP 엔드포인트 확인
    if curl -f http://localhost:3000/health &> /dev/null; then
        echo -e "${GREEN}✅ 메인 애플리케이션이 정상 응답합니다.${NC}"
    else
        echo -e "${YELLOW}⚠️  메인 애플리케이션이 응답하지 않습니다.${NC}"
    fi
    
    # MCP 서비스 확인
    for port in 8001 8002 8003; do
        if curl -f http://localhost:$port &> /dev/null; then
            echo -e "${GREEN}✅ 포트 $port 서비스가 정상입니다.${NC}"
        else
            echo -e "${YELLOW}⚠️  포트 $port 서비스에 문제가 있습니다.${NC}"
        fi
    done
}

# 메인 로직
main() {
    print_logo
    
    # Docker 확인
    check_docker
    
    # 명령어 처리
    case "${1:-help}" in
        start)
            check_environment
            shift
            start_services "$@"
            ;;
        dev|development)
            check_environment
            start_dev
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            show_logs "$2"
            ;;
        status|ps)
            check_status
            ;;
        build)
            build_images
            ;;
        clean)
            clean_up "$2"
            ;;
        backup)
            backup_data
            ;;
        restore)
            restore_data "$2"
            ;;
        setup)
            setup_project
            ;;
        health)
            health_check
            ;;
        help|--help|-h)
            print_help
            ;;
        *)
            echo -e "${RED}❌ 알 수 없는 명령어: $1${NC}"
            print_help
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@"
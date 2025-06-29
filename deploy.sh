#!/bin/bash
# Christmas Trading - 원격 서버 배포 스크립트
# 사용법: ./deploy.sh [환경]

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 환경 설정
ENVIRONMENT=${1:-production}
REMOTE_SERVER="31.220.83.213"
REMOTE_USER="root"
PROJECT_DIR="/root/christmas-trading"

echo -e "${BLUE}🎄 Christmas Trading 배포 시작${NC}"
echo -e "${YELLOW}환경: ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}서버: ${REMOTE_SERVER}${NC}"

# 1단계: 로컬 환경 검증
echo -e "\n${BLUE}1️⃣ 로컬 환경 검증 중...${NC}"

if [ ! -f ".env.prod" ]; then
    echo -e "${RED}❌ .env.prod 파일이 없습니다!${NC}"
    echo "   다음 명령으로 생성하세요: cp .env .env.prod"
    exit 1
fi

if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ docker-compose.prod.yml 파일이 없습니다!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 로컬 환경 검증 완료${NC}"

# 2단계: 코드 푸시
echo -e "\n${BLUE}2️⃣ Git 커밋 및 푸시 중...${NC}"

# 변경사항이 있는지 확인
if [ -n "$(git status --porcelain)" ]; then
    echo "변경사항을 커밋합니다..."
    git add .
    git commit -m "Deploy to production server - $(date +'%Y-%m-%d %H:%M:%S')" || true
fi

git push origin main
echo -e "${GREEN}✅ Git 푸시 완료${NC}"

# 3단계: 원격 서버 배포
echo -e "\n${BLUE}3️⃣ 원격 서버 배포 중...${NC}"

ssh ${REMOTE_USER}@${REMOTE_SERVER} << 'ENDSSH'
set -e

echo "🔄 원격 서버에서 배포 시작..."

# 프로젝트 디렉토리로 이동
cd /root/christmas-trading || {
    echo "❌ 프로젝트 디렉토리가 없습니다. 먼저 git clone을 실행하세요."
    exit 1
}

# 최신 코드 가져오기
echo "📥 최신 코드 다운로드 중..."
git pull origin main

# 환경 변수 파일 확인
if [ ! -f ".env.prod" ]; then
    echo "⚠️ .env.prod 파일이 없습니다. .env를 복사합니다."
    cp .env .env.prod
fi

# 기존 컨테이너 정리
echo "🧹 기존 컨테이너 정리 중..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# 이미지 빌드
echo "🔨 Docker 이미지 빌드 중..."
docker-compose -f docker-compose.prod.yml build --no-cache

# 서비스 시작
echo "🚀 서비스 시작 중..."
docker-compose -f docker-compose.prod.yml up -d

# 서비스 상태 확인
echo "⏳ 서비스 상태 확인 중..."
sleep 10

# 헬스체크
echo "💊 헬스체크 실행 중..."
for i in {1..30}; do
    if curl -f http://localhost:3000/health >/dev/null 2>&1; then
        echo "✅ Frontend 헬스체크 성공"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Frontend 헬스체크 실패"
        exit 1
    fi
    sleep 2
done

for i in {1..30}; do
    if curl -f http://localhost:8080/health >/dev/null 2>&1; then
        echo "✅ Backend 헬스체크 성공"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend 헬스체크 실패"
        exit 1
    fi
    sleep 2
done

# 실행 중인 컨테이너 확인
echo "📋 실행 중인 서비스:"
docker-compose -f docker-compose.prod.yml ps

echo "🎉 배포 완료!"
echo "🌐 접속 URL: http://31.220.83.213"
echo "📊 Backend API: http://31.220.83.213:8080"

ENDSSH

# 4단계: 외부 접속 테스트
echo -e "\n${BLUE}4️⃣ 외부 접속 테스트 중...${NC}"

echo "프론트엔드 테스트 중..."
if curl -f http://${REMOTE_SERVER}:3000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 프론트엔드 접속 성공${NC}"
else
    echo -e "${RED}❌ 프론트엔드 접속 실패${NC}"
fi

echo "백엔드 API 테스트 중..."
if curl -f http://${REMOTE_SERVER}:8080/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 백엔드 API 접속 성공${NC}"
else
    echo -e "${RED}❌ 백엔드 API 접속 실패${NC}"
fi

# 5단계: 배포 완료 요약
echo -e "\n${GREEN}🎉 배포 완료!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📱 서비스 접속 정보:${NC}"
echo -e "   🌐 웹사이트: ${GREEN}http://${REMOTE_SERVER}${NC}"
echo -e "   🔧 프론트엔드: ${GREEN}http://${REMOTE_SERVER}:3000${NC}"
echo -e "   🚀 백엔드 API: ${GREEN}http://${REMOTE_SERVER}:8080${NC}"
echo -e "   📚 API 문서: ${GREEN}http://${REMOTE_SERVER}:8080/api/docs${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}📋 다음 단계:${NC}"
echo "1. 웹 브라우저에서 http://${REMOTE_SERVER} 접속 테스트"
echo "2. 로그인 기능 테스트 (Supabase 연동 확인)"
echo "3. 실시간 데이터 확인 (Binance API 연동)"
echo "4. 소액 테스트 거래 실행"

echo -e "\n${YELLOW}🔧 문제 해결:${NC}"
echo "- 로그 확인: ssh ${REMOTE_USER}@${REMOTE_SERVER} 'docker-compose -f ${PROJECT_DIR}/docker-compose.prod.yml logs'"
echo "- 서비스 재시작: ssh ${REMOTE_USER}@${REMOTE_SERVER} 'cd ${PROJECT_DIR} && docker-compose -f docker-compose.prod.yml restart'"
echo "- 서비스 중지: ssh ${REMOTE_USER}@${REMOTE_SERVER} 'cd ${PROJECT_DIR} && docker-compose -f docker-compose.prod.yml down'"
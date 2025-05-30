#!/bin/bash
# Christmas Trading 백엔드 수정 스크립트
# 31.220.83.213 서버에서 실행

echo "🎄 Christmas Trading 백엔드 수정 시작..."

# 1. 충돌 컨테이너 제거
echo "1️⃣ 기존 컨테이너 정리..."
docker rm -f christmas-backend
docker rm -f $(docker ps -aq --filter "name=christmas") 2>/dev/null

# 2. Git 상태 정리
echo "2️⃣ Git 상태 정리..."
cd ~/christmas-trading
git stash push -m "로컬 변경사항 백업 $(date)"
git reset --hard HEAD
git pull origin main

# 3. Docker 환경 정리
echo "3️⃣ Docker 환경 정리..."
docker-compose down --remove-orphans
docker network prune -f

# 4. 백엔드 재시작
echo "4️⃣ 백엔드 재시작..."
docker-compose up -d --build --force-recreate

# 5. 상태 확인
echo "5️⃣ 상태 확인..."
sleep 10
docker ps | grep christmas
echo ""
echo "🔍 백엔드 로그 확인:"
docker logs christmas-backend --tail 20
echo ""
echo "🌐 헬스체크 테스트:"
curl -s localhost:8000/health || echo "❌ 헬스체크 실패"
echo ""
echo "✅ 백엔드 수정 완료!" 
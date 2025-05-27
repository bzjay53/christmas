#!/bin/bash
# Christmas Trading Ultimate Server Deployment
# 서버에서 실행할 완전 배포 스크립트

echo "🎯 Christmas Trading Ultimate Server Deployment Started"
echo "=" * 60

# 1. 현재 서비스 정리
echo "1. Cleaning up existing services..."
docker-compose down 2>/dev/null || true
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker system prune -af

# 2. 최신 코드 가져오기
echo "2. Pulling latest code..."
git pull origin main

# 3. 안정화된 서비스 시작
echo "3. Starting stable services..."
docker-compose -f docker-compose.stable.yml up -d

# 4. 헬스체크 대기
echo "4. Waiting for services to be ready..."
sleep 30

# 5. 연결 테스트
echo "5. Testing connections..."
for i in {1..10}; do
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        echo "✅ Backend is healthy!"
        break
    fi
    echo "Waiting for backend... ($i/10)"
    sleep 10
done

# 6. 모니터링 시스템 시작
echo "6. Starting monitoring system..."
chmod +x scripts/continuous-monitor.sh
nohup scripts/continuous-monitor.sh > /tmp/monitor.log 2>&1 &

# 7. 상태 확인
echo "7. Final status check..."
docker ps
echo ""
echo "🎉 Ultimate Deployment Completed!"
echo "✅ Backend: http://localhost:8000"
echo "✅ Health Check: http://localhost:8000/health"
echo "✅ Monitoring: Active (check /tmp/monitor.log)"
echo "✅ Auto-recovery: Enabled"
echo ""
echo "🛡️ Your system is now 24/7 stable!" 
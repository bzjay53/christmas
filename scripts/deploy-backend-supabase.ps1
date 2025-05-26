# Christmas Trading Backend Supabase 배포 스크립트
# PowerShell 스크립트

Write-Host "🎄 Christmas Trading Backend Supabase 배포 시작..." -ForegroundColor Green

# 1. 기존 컨테이너 제거 (Dry Run)
Write-Host "📋 Dry Run: 기존 컨테이너 제거 확인..." -ForegroundColor Yellow
ssh root@31.220.83.213 "docker ps -a | grep christmas-backend"

# 2. Docker 이미지 재빌드 (Dry Run)
Write-Host "📋 Dry Run: Docker 이미지 빌드 확인..." -ForegroundColor Yellow
ssh root@31.220.83.213 "cd /root/christmas-trading/backend && ls -la"

# 실제 배포 함수
function Deploy-Backend {
    Write-Host "🚀 실제 배포 시작..." -ForegroundColor Green
    
    # 1. 기존 컨테이너 제거
    Write-Host "🗑️ 기존 컨테이너 제거..." -ForegroundColor Yellow
    ssh root@31.220.83.213 "docker rm -f christmas-backend-supabase 2>/dev/null || echo 'No container to remove'"
    
    # 2. Docker 이미지 재빌드
    Write-Host "🔨 Docker 이미지 재빌드..." -ForegroundColor Yellow
    ssh root@31.220.83.213 "cd /root/christmas-trading/backend && docker build -t christmas-backend-supabase ."
    
    # 3. 새 컨테이너 시작
    Write-Host "🚀 새 컨테이너 시작..." -ForegroundColor Yellow
    ssh root@31.220.83.213 "docker run -d --name christmas-backend-supabase --network christmas-trading_christmas-network -e NODE_ENV=production -e PORT=8000 -e SUPABASE_URL=https://qehzzsxzjijfzqkysazc.supabase.co -e SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHp6c3h6amlqZnpxa3lzYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTgxMTQsImV4cCI6MjA2MzYzNDExNH0.zjrrUaVajb9fV1NRwzA_RMy3-r3Lpww9Uen-cZYXDuE -e JWT_SECRET=christmas-trading-jwt-secret-key-2024-very-long-and-secure christmas-backend-supabase npm start"
    
    # 4. 컨테이너 상태 확인
    Write-Host "📊 컨테이너 상태 확인..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    ssh root@31.220.83.213 "docker ps | grep christmas-backend"
    
    # 5. 로그 확인
    Write-Host "📝 컨테이너 로그 확인..." -ForegroundColor Yellow
    ssh root@31.220.83.213 "docker logs christmas-backend-supabase --tail 20"
    
    # 6. 헬스 체크
    Write-Host "🏥 헬스 체크..." -ForegroundColor Yellow
    ssh root@31.220.83.213 "curl -s http://localhost:8000/health || echo 'Health check failed'"
}

# 사용자 확인
$confirm = Read-Host "Dry Run 결과를 확인했습니다. 실제 배포를 진행하시겠습니까? (y/N)"
if ($confirm -eq "y" -or $confirm -eq "Y") {
    Deploy-Backend
    Write-Host "✅ 배포 완료!" -ForegroundColor Green
} else {
    Write-Host "❌ 배포가 취소되었습니다." -ForegroundColor Red
} 
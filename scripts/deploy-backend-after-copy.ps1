# Christmas Trading Backend 배포 스크립트 (파일 복사 완료 후)
# 2025-05-26

Write-Host "=== Christmas Trading Backend 재배포 시작 ===" -ForegroundColor Green

# 1. 서버 연결 및 상태 확인
Write-Host "1. 서버 상태 확인 중..." -ForegroundColor Yellow
ssh root@31.220.83.213 "cd /root/christmas-trading/backend ; echo '=== Routes 파일 확인 ===' ; ls -la routes/ ; echo '=== 현재 컨테이너 상태 ===' ; docker ps -a | grep christmas-backend"

# 2. 기존 컨테이너 정리
Write-Host "2. 기존 컨테이너 정리 중..." -ForegroundColor Yellow
ssh root@31.220.83.213 "docker stop christmas-backend-production 2>/dev/null ; docker rm christmas-backend-production 2>/dev/null ; echo 'Container cleanup completed'"

# 3. Docker 이미지 재빌드
Write-Host "3. Docker 이미지 재빌드 중..." -ForegroundColor Yellow
ssh root@31.220.83.213 "cd /root/christmas-trading/backend ; docker build -t christmas-backend-production . --no-cache"

# 4. 새 컨테이너 시작
Write-Host "4. 새 컨테이너 시작 중..." -ForegroundColor Yellow
ssh root@31.220.83.213 "cd /root/christmas-trading ; docker run -d --name christmas-backend-production --network christmas-trading_christmas-network --env-file .env.docker christmas-backend-production npm start"

# 5. 컨테이너 상태 확인 (30초 대기)
Write-Host "5. 컨테이너 상태 확인 중 (30초 대기)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
ssh root@31.220.83.213 "echo '=== 컨테이너 상태 ===' ; docker ps -a | grep christmas-backend-production ; echo '=== 컨테이너 로그 ===' ; docker logs christmas-backend-production --tail 20"

# 6. nginx 상태 확인 및 재시작
Write-Host "6. nginx 상태 확인 및 재시작..." -ForegroundColor Yellow
ssh root@31.220.83.213 "docker restart christmas-nginx ; sleep 5 ; docker ps | grep nginx"

# 7. API 엔드포인트 테스트
Write-Host "7. API 엔드포인트 테스트 중..." -ForegroundColor Yellow
ssh root@31.220.83.213 "curl -s -o /dev/null -w '%{http_code}' http://localhost/api/health || echo 'Health check failed'"

Write-Host "=== 배포 완료 ===" -ForegroundColor Green
Write-Host "다음 단계: Supabase 테이블 생성 및 로그인 테스트" -ForegroundColor Cyan 
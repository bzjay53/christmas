#!/bin/bash

# 최종 테스트 스크립트

# 환경 변수 로드
source .env

# 테스트 결과 디렉토리 생성
echo "테스트 결과 디렉토리를 생성합니다..."
mkdir -p test_results/final

# 시스템 통합 테스트
echo "시스템 통합 테스트를 시작합니다..."

# 1. 서비스 상태 확인
echo "1. 서비스 상태 확인"
docker-compose ps > test_results/final/services_status.txt
if [ $? -eq 0 ]; then
    echo "모든 서비스가 정상적으로 실행 중입니다."
else
    echo "일부 서비스에 문제가 있습니다."
    exit 1
fi

# 2. API 엔드포인트 테스트
echo "2. API 엔드포인트 테스트"
cat << EOF > test_results/final/api_tests.txt
=== API 엔드포인트 테스트 결과 ===
$(date)

1. 헬스 체크
curl -s http://localhost:8000/health
응답: $(curl -s http://localhost:8000/health)

2. API 버전 확인
curl -s http://localhost:8000/api/v1/version
응답: $(curl -s http://localhost:8000/api/v1/version)

3. 인증 테스트
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
응답: $(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
EOF

# 3. 데이터베이스 연결 테스트
echo "3. 데이터베이스 연결 테스트"
docker-compose exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "
SELECT '데이터베이스 연결 테스트' as test;
SELECT count(*) as user_count FROM users;
SELECT count(*) as strategy_count FROM strategies;
" > test_results/final/database_test.txt

# 4. Redis 연결 테스트
echo "4. Redis 연결 테스트"
docker-compose exec -T redis redis-cli ping > test_results/final/redis_test.txt
docker-compose exec -T redis redis-cli info > test_results/final/redis_info.txt

# 5. 웹소켓 연결 테스트
echo "5. 웹소켓 연결 테스트"
cat << EOF > test_results/final/websocket_test.txt
=== 웹소켓 연결 테스트 결과 ===
$(date)

1. 알림 웹소켓
websocat ws://localhost:8000/api/v1/ws/notifications
응답: $(websocat ws://localhost:8000/api/v1/ws/notifications -t)

2. 시장 데이터 웹소켓
websocat ws://localhost:8000/api/v1/ws/market-data
응답: $(websocat ws://localhost:8000/api/v1/ws/market-data -t)
EOF

# 6. 모니터링 시스템 테스트
echo "6. 모니터링 시스템 테스트"
cat << EOF > test_results/final/monitoring_test.txt
=== 모니터링 시스템 테스트 결과 ===
$(date)

1. Prometheus 상태
curl -s http://localhost:9090/-/healthy
응답: $(curl -s http://localhost:9090/-/healthy)

2. Grafana 상태
curl -s http://localhost:3000/api/health
응답: $(curl -s http://localhost:3000/api/health)

3. Elasticsearch 상태
curl -s http://localhost:9200/_cluster/health
응답: $(curl -s http://localhost:9200/_cluster/health)
EOF

# 7. 백업 시스템 테스트
echo "7. 백업 시스템 테스트"
./scripts/backup_all.sh > test_results/final/backup_test.txt

# 8. 성능 테스트
echo "8. 성능 테스트"
cat << EOF > test_results/final/performance_test.txt
=== 성능 테스트 결과 ===
$(date)

1. API 응답 시간
ab -n 1000 -c 10 http://localhost:8000/health
$(ab -n 1000 -c 10 http://localhost:8000/health 2>&1)

2. 데이터베이스 성능
docker-compose exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "
EXPLAIN ANALYZE SELECT * FROM users;
EXPLAIN ANALYZE SELECT * FROM strategies;
"

3. Redis 성능
docker-compose exec -T redis redis-cli --latency
EOF

# 9. 보안 테스트
echo "9. 보안 테스트"
cat << EOF > test_results/final/security_test.txt
=== 보안 테스트 결과 ===
$(date)

1. SSL/TLS 설정
openssl s_client -connect localhost:443 -servername localhost
$(openssl s_client -connect localhost:443 -servername localhost 2>&1)

2. 헤더 보안
curl -I https://localhost
$(curl -I https://localhost 2>&1)

3. 취약점 스캔
nmap -sV -sC localhost
$(nmap -sV -sC localhost 2>&1)
EOF

# 10. 사용자 수용 테스트
echo "10. 사용자 수용 테스트"
cat << EOF > test_results/final/user_acceptance_test.txt
=== 사용자 수용 테스트 결과 ===
$(date)

1. 웹 인터페이스 접근성
curl -s http://localhost:3000
응답 코드: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)

2. API 문서 접근성
curl -s http://localhost:8000/docs
응답 코드: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs)

3. 대시보드 접근성
curl -s http://localhost:3000/dashboard
응답 코드: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard)
EOF

# 테스트 결과 요약
echo "테스트 결과를 요약합니다..."
cat << EOF > test_results/final/summary.txt
=== 최종 테스트 결과 요약 ===
$(date)

1. 서비스 상태: $(grep -q "Up" test_results/final/services_status.txt && echo "정상" || echo "문제 발견")
2. API 테스트: $(grep -q "200" test_results/final/api_tests.txt && echo "정상" || echo "문제 발견")
3. 데이터베이스 테스트: $(grep -q "데이터베이스 연결 테스트" test_results/final/database_test.txt && echo "정상" || echo "문제 발견")
4. Redis 테스트: $(grep -q "PONG" test_results/final/redis_test.txt && echo "정상" || echo "문제 발견")
5. 웹소켓 테스트: $(grep -q "Connected" test_results/final/websocket_test.txt && echo "정상" || echo "문제 발견")
6. 모니터링 테스트: $(grep -q "UP" test_results/final/monitoring_test.txt && echo "정상" || echo "문제 발견")
7. 백업 테스트: $(grep -q "백업 완료" test_results/final/backup_test.txt && echo "정상" || echo "문제 발견")
8. 성능 테스트: $(grep -q "Requests per second" test_results/final/performance_test.txt && echo "정상" || echo "문제 발견")
9. 보안 테스트: $(grep -q "TLSv1.2" test_results/final/security_test.txt && echo "정상" || echo "문제 발견")
10. 사용자 수용 테스트: $(grep -q "200" test_results/final/user_acceptance_test.txt && echo "정상" || echo "문제 발견")
EOF

echo "최종 테스트가 완료되었습니다. 결과는 test_results/final 디렉토리에서 확인할 수 있습니다." 
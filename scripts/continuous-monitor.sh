#!/bin/bash
# Christmas Trading 24/7 Continuous Monitoring System
# 2025-05-27 - PM AI Assistant

echo "🔍 Christmas Trading 24/7 Monitoring System Started"
echo "Monitoring backend server: http://backend:8000"
echo "Auto-recovery enabled with intelligent restart logic"
echo "=" * 60

# 설정 변수
HEALTH_URL="http://backend:8000/health"
CHECK_INTERVAL=60  # 1분마다 체크
MAX_FAILURES=3     # 3번 실패 시 재시작
RESTART_COOLDOWN=300  # 5분 재시작 쿨다운
LOG_FILE="/tmp/christmas-monitor.log"

# 카운터 초기화
failure_count=0
last_restart=0

# 로그 함수
log_message() {
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "$timestamp - $1" | tee -a "$LOG_FILE"
}

# 헬스체크 함수
check_health() {
    response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null)
    return $response
}

# 메모리 사용량 체크
check_memory() {
    memory_usage=$(docker stats --no-stream --format "{{.MemPerc}}" christmas-backend-stable 2>/dev/null | sed 's/%//')
    if [ ! -z "$memory_usage" ] && [ $(echo "$memory_usage > 80" | bc -l) -eq 1 ]; then
        log_message "⚠️ High memory usage detected: ${memory_usage}%"
        return 1
    fi
    return 0
}

# 디스크 공간 체크
check_disk() {
    disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 85 ]; then
        log_message "⚠️ High disk usage detected: ${disk_usage}%"
        # 로그 파일 정리
        docker system prune -f >/dev/null 2>&1
        return 1
    fi
    return 0
}

# 스마트 재시작 함수
smart_restart() {
    current_time=$(date +%s)
    time_since_restart=$((current_time - last_restart))
    
    if [ $time_since_restart -lt $RESTART_COOLDOWN ]; then
        log_message "🚫 Restart cooldown active. Waiting..."
        return 1
    fi
    
    log_message "🔄 Performing smart restart..."
    
    # 1. 현재 상태 백업
    docker logs christmas-backend-stable --tail 100 > "/tmp/crash-log-$(date +%s).log" 2>&1
    
    # 2. 그레이스풀 셧다운 시도
    docker stop christmas-backend-stable >/dev/null 2>&1
    sleep 10
    
    # 3. 강제 종료 (필요시)
    docker kill christmas-backend-stable >/dev/null 2>&1
    
    # 4. 컨테이너 정리
    docker rm christmas-backend-stable >/dev/null 2>&1
    
    # 5. 시스템 정리
    docker system prune -f >/dev/null 2>&1
    
    # 6. 새 컨테이너 시작
    cd /root/christmas-trading
    docker-compose -f docker-compose.stable.yml up -d backend
    
    last_restart=$current_time
    failure_count=0
    
    log_message "✅ Smart restart completed"
    return 0
}

# 알림 발송 함수 (향후 텔레그램 연동)
send_alert() {
    local message="$1"
    log_message "🚨 ALERT: $message"
    # TODO: 텔레그램 봇 알림 구현
}

# 메인 모니터링 루프
log_message "🚀 Starting continuous monitoring..."

while true; do
    # 헬스체크 수행
    check_health
    health_status=$?
    
    if [ $health_status -eq 200 ]; then
        if [ $failure_count -gt 0 ]; then
            log_message "✅ Backend recovered (HTTP 200)"
            failure_count=0
        else
            log_message "✅ Backend healthy (HTTP 200)"
        fi
        
        # 추가 시스템 체크
        check_memory
        check_disk
        
    else
        failure_count=$((failure_count + 1))
        log_message "❌ Backend unhealthy (HTTP $health_status) - Failure count: $failure_count"
        
        if [ $failure_count -ge $MAX_FAILURES ]; then
            log_message "🚨 Maximum failures reached. Initiating smart restart..."
            send_alert "Backend service failed $MAX_FAILURES times. Auto-restart initiated."
            
            if smart_restart; then
                log_message "🔄 Restart successful. Resuming monitoring..."
            else
                log_message "❌ Restart failed. Manual intervention required."
                send_alert "Auto-restart failed. Manual intervention required."
            fi
        fi
    fi
    
    # 상태 요약 (매 10분마다)
    if [ $(($(date +%s) % 600)) -eq 0 ]; then
        container_status=$(docker ps --filter "name=christmas-backend-stable" --format "{{.Status}}")
        log_message "📊 Status Summary - Container: $container_status, Failures: $failure_count"
    fi
    
    sleep $CHECK_INTERVAL
done 
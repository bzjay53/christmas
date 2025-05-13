#!/bin/bash

# 환경 변수 설정
SERVICE_NAME=${SERVICE_NAME:-"unknown"}
API_PORT=${FLASK_PORT:-${PORT:-8000}}
API_HOST=${FLASK_HOST:-"0.0.0.0"}
HEALTH_ENDPOINT=${HEALTH_ENDPOINT:-"/health"}
API_TIMEOUT=${API_TIMEOUT:-5}

# API 서비스 상태 확인
if [[ "$SERVICE_NAME" == "api" || "$SERVICE_NAME" == "web" ]]; then
    # API 또는 웹 서비스인 경우 HTTP 요청으로 확인
    HEALTH_URL="http://${API_HOST}:${API_PORT}${HEALTH_ENDPOINT}"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $API_TIMEOUT $HEALTH_URL)
    
    if [[ "$RESPONSE" == "200" ]]; then
        echo "Service $SERVICE_NAME is healthy (HTTP 200)"
        exit 0
    else
        echo "Service $SERVICE_NAME is unhealthy (HTTP $RESPONSE)"
        exit 1
    fi
else
    # 그 외 서비스는 프로세스 검사
    if pgrep -f "python -m app.$SERVICE_NAME" > /dev/null; then
        echo "Service $SERVICE_NAME is running"
        
        # 메모리 사용량 체크 (선택적)
        MEM_USAGE=$(ps -o rss= -p $(pgrep -f "python -m app.$SERVICE_NAME" | head -1))
        MEM_LIMIT=1000000 # 1GB 제한
        
        if [[ $MEM_USAGE -gt $MEM_LIMIT ]]; then
            echo "Service $SERVICE_NAME memory usage is too high: ${MEM_USAGE}KB"
            exit 1
        fi
        
        exit 0
    else
        echo "Service $SERVICE_NAME is not running"
        exit 1
    fi
fi 
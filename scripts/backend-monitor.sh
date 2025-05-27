#!/bin/bash
# Auto-generated monitoring script for Christmas Trading Backend

echo "?뵇 Christmas Trading Backend Health Monitor"
echo "Starting continuous monitoring..."

while true; do
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Health check
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo "$timestamp - ??Backend healthy (HTTP 200)"
    else
        echo "$timestamp - ??Backend unhealthy (HTTP $response)"
        
        # Attempt restart
        echo "$timestamp - ?봽 Attempting automatic restart..."
        docker-compose restart backend
        sleep 30
        
        # Verify restart
        response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null)
        if [ "$response" = "200" ]; then
            echo "$timestamp - ??Restart successful"
        else
            echo "$timestamp - ??Restart failed - Manual intervention required"
        fi
    fi
    
    sleep 300  # Check every 5 minutes
done

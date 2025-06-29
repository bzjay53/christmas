#!/bin/bash
# Christmas Trading Backend 시작 스크립트

echo "🎄 Christmas Trading Backend 시작 중..."

# 환경 변수 확인
echo "Environment: $ENV"
echo "Data Path: $JSON_DATA_PATH"

# 디렉토리 생성
mkdir -p /app/data /app/logs

# Python 서버 실행
echo "🚀 FastAPI 서버 시작..."
python main.py
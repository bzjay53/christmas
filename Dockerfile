# Christmas Trading - Multi-stage Docker Build
# Frontend + MCP 서비스들을 위한 최적화된 컨테이너

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Package files 복사 및 의존성 설치
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY eslint.config.js ./

# Dependencies 설치 (캐시 최적화)
RUN npm ci --only=production && npm cache clean --force

# 소스 코드 복사
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# TypeScript 빌드
RUN npm run build

# Stage 2: Python 환경 (MCP 서비스용)
FROM python:3.11-slim AS python-base

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
RUN pip install --no-cache-dir \
    aiohttp \
    asyncio \
    sqlite3 \
    logging \
    datetime \
    hashlib \
    dataclasses

# MCP 관련 의존성 (선택적)
RUN pip install --no-cache-dir \
    uvloop \
    aiosqlite || echo "Optional dependencies not available"

# Stage 3: Production Runtime
FROM node:18-alpine AS production

# 시스템 패키지 설치
RUN apk add --no-cache \
    python3 \
    py3-pip \
    sqlite \
    curl \
    bash

# Python 의존성 설치
RUN pip3 install --no-cache-dir \
    aiohttp \
    asyncio

# 작업 디렉토리 설정
WORKDIR /app

# 환경 변수 설정
ENV NODE_ENV=production
ENV VITE_APP_ENV=docker
ENV PYTHONUNBUFFERED=1

# Node.js 운영 의존성만 설치
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 빌드된 Frontend 복사
COPY --from=frontend-builder /app/dist ./dist

# 정적 서버를 위한 serve 설치
RUN npm install -g serve

# 프로젝트 파일들 복사
COPY src/ ./src/
COPY public/ ./public/
COPY docs/ ./docs/
COPY vercel.json ./
COPY .env.example ./

# MCP 서비스 파일들 복사
COPY gemini_mcp_server.py ./
COPY task-master-integration.py ./
COPY memory-bank-integration.py ./
COPY mcp-config.json ./

# 로그 디렉토리 생성
RUN mkdir -p logs

# 데이터베이스 디렉토리 생성 및 권한 설정
RUN mkdir -p data && chmod 755 data

# 포트 설정
EXPOSE 3000 8001 8002 8003

# 헬스체크 설정
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# 시작 스크립트 생성
RUN cat > start.sh << 'EOF'
#!/bin/bash
set -e

echo "🎄 Christmas Trading Docker Container Starting..."

# 환경 변수 검증
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "⚠️  VITE_SUPABASE_URL not set, using mock data mode"
    export VITE_ENABLE_MOCK_DATA=true
fi

# 데이터베이스 디렉토리 권한 확인
chmod 755 /app/data
chmod 644 /app/.env.example 2>/dev/null || true

# MCP 서비스들을 백그라운드에서 시작
echo "🔧 Starting MCP Services..."

# Task Master MCP (포트 8001)
python3 task-master-integration.py > logs/task-master.log 2>&1 &
TASK_MASTER_PID=$!

# Memory Bank MCP (포트 8002)  
python3 memory-bank-integration.py > logs/memory-bank.log 2>&1 &
MEMORY_BANK_PID=$!

# Gemini MCP (포트 8003)
if [ -n "$GEMINI_API_KEY" ]; then
    echo "🤖 Starting Gemini MCP with API key..."
    python3 gemini_mcp_server.py > logs/gemini-mcp.log 2>&1 &
    GEMINI_PID=$!
else
    echo "⚠️  GEMINI_API_KEY not set, skipping Gemini MCP"
fi

# 잠시 대기 (MCP 서비스 초기화)
sleep 3

echo "🚀 Starting Frontend Server..."
# Frontend 서버 시작 (포트 3000)
serve -s dist -l 3000

# Cleanup function
cleanup() {
    echo "🛑 Shutting down services..."
    kill $TASK_MASTER_PID $MEMORY_BANK_PID 2>/dev/null || true
    [ -n "$GEMINI_PID" ] && kill $GEMINI_PID 2>/dev/null || true
    wait
}

# 신호 처리
trap cleanup SIGTERM SIGINT

# 프로세스 대기
wait
EOF

RUN chmod +x start.sh

# 시작 명령
CMD ["./start.sh"]
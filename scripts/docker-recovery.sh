#!/bin/bash
# Christmas Trading Docker 복구 스크립트
# 2025-05-26 PM AI Assistant

echo "🎄 Christmas Trading Docker 복구 시작..."
echo "📅 실행 시간: $(date)"

# 작업 디렉토리로 이동
cd /root/christmas-trading/backend

echo ""
echo "🔍 1단계: 현재 상태 진단"
echo "=================================================="
echo "📊 현재 실행 중인 컨테이너:"
docker ps

echo ""
echo "📊 모든 컨테이너 (중지된 것 포함):"
docker ps -a | grep christmas

echo ""
echo "🧹 2단계: 컨테이너 정리"
echo "=================================================="
echo "🗑️ 충돌 컨테이너 강제 제거..."
docker rm -f christmas-backend 2>/dev/null || echo "christmas-backend 컨테이너가 없습니다."

echo "🗑️ 모든 Christmas 관련 컨테이너 정리..."
docker rm -f $(docker ps -aq --filter "name=christmas") 2>/dev/null || echo "Christmas 관련 컨테이너가 없습니다."

echo "🗑️ 중지된 컨테이너 정리..."
docker container prune -f

echo "🗑️ 사용하지 않는 이미지 정리..."
docker image prune -f

echo "🗑️ 네트워크 정리..."
docker network prune -f

echo ""
echo "🔧 3단계: 환경변수 확인"
echo "=================================================="
echo "📁 .env 파일 존재 확인:"
ls -la .env

echo ""
echo "🔍 중요 환경변수 확인 (민감정보 제외):"
grep -E '^(NODE_ENV|PORT|SUPABASE_URL)=' .env 2>/dev/null || echo "환경변수 파일을 읽을 수 없습니다."

echo ""
echo "⚠️  확인 필요한 환경변수들:"
echo "   - SUPABASE_SERVICE_KEY (현재: placeholder 값)"
echo "   - KIS_API_KEY (docker-compose에서 요구)"
echo "   - KIS_API_SECRET (docker-compose에서 요구)"
echo "   - OPENAI_API_KEY (docker-compose에서 요구)"

echo ""
echo "🚀 4단계: 서비스 재시작"
echo "=================================================="
echo "📁 현재 디렉토리: $(pwd)"
echo "📄 docker-compose.yml 파일 확인:"
ls -la docker-compose.yml

echo ""
echo "🔄 Docker Compose 서비스 재시작 (강제 재생성)..."
docker-compose up -d --build --force-recreate

echo ""
echo "⏳ 10초 대기 (서비스 시작 시간)..."
sleep 10

echo ""
echo "✅ 5단계: 서비스 검증"
echo "=================================================="
echo "📊 컨테이너 상태 확인:"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo ""
echo "🏥 백엔드 Health Check:"
curl -f http://localhost:8000/health 2>/dev/null && echo "✅ Health check 성공!" || echo "❌ Health check 실패"

echo ""
echo "📋 백엔드 로그 확인 (최근 10줄):"
docker logs christmas-backend --tail=10 2>/dev/null || echo "❌ 백엔드 컨테이너 로그를 가져올 수 없습니다."

echo ""
echo "🌐 외부 접근 테스트:"
curl -f http://31.220.83.213:8000/health 2>/dev/null && echo "✅ 외부 접근 성공!" || echo "❌ 외부 접근 실패"

echo ""
echo "🎉 Docker 복구 스크립트 완료!"
echo "=================================================="
echo "📊 최종 상태:"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep christmas

echo ""
echo "📞 다음 단계:"
echo "1. 환경변수가 올바르게 설정되었는지 확인"
echo "2. 백엔드 서비스가 정상 작동하는지 확인"
echo "3. 프론트엔드에서 '백엔드 연결됨' 상태 확인"
echo "4. PM에게 결과 보고"

echo ""
echo "🔧 문제가 지속되면 다음을 확인하세요:"
echo "   - SUPABASE_SERVICE_KEY가 실제 값으로 설정되었는지"
echo "   - KIS_API_KEY, KIS_API_SECRET, OPENAI_API_KEY 설정"
echo "   - 방화벽 설정 (포트 8000)"
echo "   - Docker 로그: docker logs christmas-backend" 
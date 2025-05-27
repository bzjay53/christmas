#!/bin/bash
# Christmas Trading 영구 환경변수 설정 스크립트
# 더 이상 .env 파일에 의존하지 않는 구조적 해결책

echo "🔧 Christmas Trading 영구 환경변수 설정 시작"
echo "=" * 60

# 환경변수 파일 경로
ENV_FILE="/etc/environment"
BASHRC_FILE="$HOME/.bashrc"

echo "📋 현재 설정된 환경변수 확인..."
echo "SUPABASE_URL: ${SUPABASE_URL:-'❌ 미설정'}"
echo "SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:-'❌ 미설정'}"
echo "SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY:-'❌ 미설정'}"

# 사용자에게 Supabase 정보 입력 요청
echo ""
echo "🔑 Supabase 환경변수를 설정합니다."
echo "Supabase Dashboard (https://supabase.com/dashboard)에서 다음 정보를 복사해주세요:"
echo ""

# SUPABASE_URL 설정
if [ -z "$SUPABASE_URL" ]; then
    echo "📝 SUPABASE_URL을 입력하세요 (예: https://qehzzsxzjijfzqkysazc.supabase.co):"
    read -r SUPABASE_URL_INPUT
    if [ -n "$SUPABASE_URL_INPUT" ]; then
        echo "export SUPABASE_URL=\"$SUPABASE_URL_INPUT\"" >> "$BASHRC_FILE"
        echo "SUPABASE_URL=\"$SUPABASE_URL_INPUT\"" >> "$ENV_FILE"
        export SUPABASE_URL="$SUPABASE_URL_INPUT"
        echo "✅ SUPABASE_URL 설정 완료"
    fi
fi

# SUPABASE_ANON_KEY 설정
if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "📝 SUPABASE_ANON_KEY를 입력하세요 (Settings → API → anon public):"
    read -r SUPABASE_ANON_KEY_INPUT
    if [ -n "$SUPABASE_ANON_KEY_INPUT" ]; then
        echo "export SUPABASE_ANON_KEY=\"$SUPABASE_ANON_KEY_INPUT\"" >> "$BASHRC_FILE"
        echo "SUPABASE_ANON_KEY=\"$SUPABASE_ANON_KEY_INPUT\"" >> "$ENV_FILE"
        export SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY_INPUT"
        echo "✅ SUPABASE_ANON_KEY 설정 완료"
    fi
fi

# SUPABASE_SERVICE_KEY 설정 (가장 중요!)
if [ -z "$SUPABASE_SERVICE_KEY" ] || [ "$SUPABASE_SERVICE_KEY" = "your-supabase-service-role-key" ]; then
    echo "📝 SUPABASE_SERVICE_KEY를 입력하세요 (Settings → API → service_role secret):"
    echo "⚠️  이것이 가장 중요한 키입니다!"
    read -r SUPABASE_SERVICE_KEY_INPUT
    if [ -n "$SUPABASE_SERVICE_KEY_INPUT" ]; then
        echo "export SUPABASE_SERVICE_KEY=\"$SUPABASE_SERVICE_KEY_INPUT\"" >> "$BASHRC_FILE"
        echo "SUPABASE_SERVICE_KEY=\"$SUPABASE_SERVICE_KEY_INPUT\"" >> "$ENV_FILE"
        export SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY_INPUT"
        echo "✅ SUPABASE_SERVICE_KEY 설정 완료"
    fi
fi

# 기타 필수 환경변수 설정
echo ""
echo "🔧 기타 환경변수 설정 중..."

# JWT_SECRET 설정
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET="christmas-trading-jwt-secret-key-2024-very-long-and-secure"
    echo "export JWT_SECRET=\"$JWT_SECRET\"" >> "$BASHRC_FILE"
    echo "JWT_SECRET=\"$JWT_SECRET\"" >> "$ENV_FILE"
    export JWT_SECRET="$JWT_SECRET"
    echo "✅ JWT_SECRET 설정 완료"
fi

# 환경변수 즉시 적용
source "$BASHRC_FILE"

echo ""
echo "🔍 설정 완료 후 환경변수 검증..."
echo "SUPABASE_URL: ${SUPABASE_URL}"
echo "SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:20}..."
echo "SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY:0:20}..."

# 검증
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_ANON_KEY" ] && [ -n "$SUPABASE_SERVICE_KEY" ] && [ "$SUPABASE_SERVICE_KEY" != "your-supabase-service-role-key" ]; then
    echo ""
    echo "🎉 모든 환경변수 설정 완료!"
    echo "✅ 더 이상 .env 파일이 필요하지 않습니다."
    echo "✅ 다음 배포부터는 자동으로 환경변수가 주입됩니다."
    
    # .env 파일 백업 및 제거
    if [ -f ".env" ]; then
        echo ""
        echo "📦 기존 .env 파일 백업 중..."
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        echo "✅ .env 파일이 .env.backup.$(date +%Y%m%d_%H%M%S)로 백업되었습니다."
        echo "🗑️  이제 .env 파일을 제거해도 됩니다."
    fi
    
    echo ""
    echo "🚀 다음 단계:"
    echo "1. docker-compose -f docker-compose.env-free.yml up -d"
    echo "2. 환경변수가 자동으로 주입되어 정상 작동합니다!"
    
else
    echo ""
    echo "❌ 환경변수 설정이 완료되지 않았습니다."
    echo "다시 실행하여 모든 값을 입력해주세요."
    exit 1
fi

echo ""
echo "📋 영구 설정 완료!"
echo "- 시스템 재부팅 후에도 환경변수가 유지됩니다."
echo "- 더 이상 매번 수동으로 .env 파일을 수정할 필요가 없습니다."
echo "- 배포 시 자동으로 환경변수가 주입됩니다." 
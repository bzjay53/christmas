#!/bin/bash
# Christmas Trading 환경변수 검증 스크립트
# 배포 전 모든 필수 환경변수가 올바르게 설정되었는지 확인

echo "🔍 Christmas Trading 환경변수 검증 시작"
echo "=" * 50

# 검증 결과 카운터
PASS_COUNT=0
FAIL_COUNT=0
TOTAL_CHECKS=0

# 검증 함수
validate_env() {
    local var_name="$1"
    local var_value="$2"
    local expected_pattern="$3"
    local description="$4"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "🔍 $description: "
    
    if [ -z "$var_value" ]; then
        echo "❌ 미설정"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
    
    if [ -n "$expected_pattern" ] && [[ ! "$var_value" =~ $expected_pattern ]]; then
        echo "❌ 잘못된 형식"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
    
    # 플레이스홀더 값 체크
    case "$var_value" in
        "your-"*|"demo-"*|"test-"*|"placeholder"*|"example"*)
            echo "❌ 플레이스홀더 값"
            FAIL_COUNT=$((FAIL_COUNT + 1))
            return 1
            ;;
    esac
    
    echo "✅ 정상"
    PASS_COUNT=$((PASS_COUNT + 1))
    return 0
}

echo "📋 필수 환경변수 검증 중..."
echo ""

# Supabase 환경변수 검증
validate_env "SUPABASE_URL" "$SUPABASE_URL" "^https://[a-z0-9]+\.supabase\.co$" "Supabase URL"
validate_env "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "^eyJ" "Supabase Anon Key"
validate_env "SUPABASE_SERVICE_KEY" "$SUPABASE_SERVICE_KEY" "^eyJ" "Supabase Service Key (가장 중요!)"

# JWT Secret 검증
validate_env "JWT_SECRET" "$JWT_SECRET" ".{32,}" "JWT Secret (32자 이상)"

# 선택적 환경변수 검증
echo ""
echo "📋 선택적 환경변수 검증 중..."

if [ -n "$KIS_DEMO_APP_KEY" ]; then
    validate_env "KIS_DEMO_APP_KEY" "$KIS_DEMO_APP_KEY" "" "KIS Demo App Key"
fi

if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    validate_env "TELEGRAM_BOT_TOKEN" "$TELEGRAM_BOT_TOKEN" "^[0-9]+:" "Telegram Bot Token"
fi

# 특별 검증: SUPABASE_SERVICE_KEY 플레이스홀더 체크
echo ""
echo "🚨 특별 검증: SUPABASE_SERVICE_KEY 플레이스홀더 체크"
if [ "$SUPABASE_SERVICE_KEY" = "your-supabase-service-role-key" ]; then
    echo "❌ CRITICAL: SUPABASE_SERVICE_KEY가 여전히 플레이스홀더입니다!"
    echo "   이것이 반복 문제의 근본 원인입니다."
    echo "   즉시 실제 Service Role Key로 교체하세요."
    FAIL_COUNT=$((FAIL_COUNT + 1))
else
    echo "✅ SUPABASE_SERVICE_KEY가 실제 값으로 설정되었습니다."
fi

# Supabase 연결 테스트
echo ""
echo "🌐 Supabase 연결 테스트..."
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_ANON_KEY" ]; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        "$SUPABASE_URL/rest/v1/" 2>/dev/null)
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Supabase 연결 성공 (HTTP $HTTP_STATUS)"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo "❌ Supabase 연결 실패 (HTTP $HTTP_STATUS)"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
else
    echo "⚠️  Supabase 연결 테스트 건너뜀 (URL 또는 Key 누락)"
fi

# 결과 요약
echo ""
echo "📊 검증 결과 요약"
echo "=" * 30
echo "✅ 통과: $PASS_COUNT"
echo "❌ 실패: $FAIL_COUNT"
echo "📊 총 검사: $TOTAL_CHECKS"

if [ $FAIL_COUNT -eq 0 ]; then
    echo ""
    echo "🎉 모든 환경변수 검증 통과!"
    echo "✅ 배포를 진행해도 안전합니다."
    echo "✅ SUPABASE_SERVICE_KEY 플레이스홀더 문제가 해결되었습니다."
    exit 0
else
    echo ""
    echo "🚨 환경변수 검증 실패!"
    echo "❌ $FAIL_COUNT개의 문제를 해결한 후 다시 시도하세요."
    echo ""
    echo "🔧 해결 방법:"
    echo "1. scripts/setup-permanent-env.sh 실행"
    echo "2. Supabase Dashboard에서 올바른 키 복사"
    echo "3. 환경변수 다시 설정"
    echo "4. 이 스크립트 다시 실행"
    exit 1
fi 
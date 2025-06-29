#!/bin/bash

# Christmas Trading: Supabase RLS 정책 자동 수정 스크립트
# 사용법: ./apply_supabase_fixes.sh

echo "🔧 Supabase RLS 정책 수정을 시작합니다..."

# 환경 변수 로드
if [ -f .env ]; then
    source .env
    echo "✅ 환경 변수 로드 완료"
else
    echo "❌ .env 파일을 찾을 수 없습니다."
    exit 1
fi

# Supabase URL과 Service Role Key 확인
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$SUPABASE_JWT_SECRET" ]; then
    echo "❌ Supabase 환경 변수가 설정되지 않았습니다."
    echo "VITE_SUPABASE_URL: $VITE_SUPABASE_URL"
    echo "SUPABASE_JWT_SECRET: ${SUPABASE_JWT_SECRET:0:20}..."
    exit 1
fi

echo "🔗 Supabase 연결 정보:"
echo "URL: $VITE_SUPABASE_URL"
echo "Service Role Key: ${SUPABASE_JWT_SECRET:0:20}..."

# SQL 파일 존재 확인
if [ ! -f "fix_rls_policies.sql" ]; then
    echo "❌ fix_rls_policies.sql 파일이 없습니다."
    exit 1
fi

echo "📄 SQL 파일 확인 완료"

# PostgreSQL 클라이언트 설치 확인
if ! command -v psql &> /dev/null; then
    echo "⚠️ psql이 설치되지 않았습니다. 수동으로 Supabase 대시보드에서 SQL을 실행해주세요."
    echo ""
    echo "🌐 다음 단계를 수행하세요:"
    echo "1. https://qehzzsxzjijfzqkysazc.supabase.co 접속"
    echo "2. SQL Editor 메뉴 선택"
    echo "3. fix_rls_policies.sql 파일 내용을 복사하여 실행"
    echo ""
    echo "📋 SQL 파일 내용:"
    echo "================================"
    cat fix_rls_policies.sql
    echo "================================"
    echo ""
    echo "✅ 위 SQL을 Supabase에서 실행한 후 애플리케이션을 테스트해보세요."
    exit 0
fi

echo "🔧 PostgreSQL 클라이언트로 SQL 실행을 시도합니다..."

# Supabase 데이터베이스에 연결하여 SQL 실행
# 주의: 실제 환경에서는 connection string이 필요합니다
echo "⚠️ 직접 데이터베이스 연결은 지원되지 않습니다."
echo "🌐 Supabase 대시보드에서 수동으로 실행해주세요:"
echo ""
echo "1. https://qehzzsxzjijfzqkysazc.supabase.co 접속"
echo "2. SQL Editor로 이동"
echo "3. 다음 SQL 실행:"
echo ""
echo "================================"
cat fix_rls_policies.sql
echo "================================"
echo ""
echo "✅ SQL 실행 후 브라우저를 새로고침하여 테스트해보세요."
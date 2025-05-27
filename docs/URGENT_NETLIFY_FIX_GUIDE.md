# 🚨 긴급 수정: Netlify 환경변수 CORS 문제 해결

## 🔥 **현재 문제 상황**

프론트엔드가 **잘못된 Supabase URL**로 요청을 보내고 있습니다:

❌ **현재 잘못된 URL**: `https://supabase.com/dashboard/project/qehzzsxzjijfzqkysazc/auth/v1/token`
✅ **올바른 API URL**: `https://qehzzsxzjijfzqkysazc.supabase.co/auth/v1/token`

## 🛠️ **즉시 수정 방법 (5분 소요)**

### 1단계: Netlify 대시보드 접속
1. 브라우저에서 https://app.netlify.com 접속
2. **christmas-protocol** 사이트 선택
3. **Site settings** 클릭
4. 좌측 메뉴에서 **Environment variables** 클릭

### 2단계: 환경변수 수정
다음 변수를 **정확히** 수정/추가하세요:

#### 🔧 **수정할 환경변수**:
```
VITE_SUPABASE_URL=https://qehzzsxzjijfzqkysazc.supabase.co
```
⚠️ **주의**: 끝에 `/` 없이, `.supabase.co`로 끝나야 함

#### 🔧 **확인할 환경변수**:
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHp6c3h6amlqZnpxa3lzYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTgxMTQsImV4cCI6MjA2MzYzNDExNH0.zjrrUaVajb9fV1NRwzA_RMy3-r3Lpww9Uen-cZYXDuE
```

### 3단계: 즉시 재배포
1. **Deploys** 탭으로 이동
2. **Trigger deploy** 버튼 클릭
3. **Deploy site** 선택
4. 배포 완료까지 대기 (약 2-3분)

### 4단계: 테스트
1. https://christmas-protocol.netlify.app 접속
2. 로그인 시도
3. CORS 에러 없이 정상 작동 확인

## 🔍 **문제 원인 분석**

### 잘못된 URL 패턴:
```
❌ https://supabase.com/dashboard/project/PROJECT_ID/...
❌ https://PROJECT_ID.supabase.co/
✅ https://PROJECT_ID.supabase.co
```

### 올바른 Supabase API 엔드포인트:
```
✅ Auth: https://qehzzsxzjijfzqkysazc.supabase.co/auth/v1/token
✅ REST: https://qehzzsxzjijfzqkysazc.supabase.co/rest/v1/
✅ Realtime: wss://qehzzsxzjijfzqkysazc.supabase.co/realtime/v1/
```

## 📋 **전체 환경변수 목록 (참고용)**

```bash
# Supabase 설정
VITE_SUPABASE_URL=https://qehzzsxzjijfzqkysazc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHp6c3h6amlqZnpxa3lzYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTgxMTQsImV4cCI6MjA2MzYzNDExNH0.zjrrUaVajb9fV1NRwzA_RMy3-r3Lpww9Uen-cZYXDuE

# 백엔드 API 설정
VITE_API_BASE_URL=http://31.220.83.213:8000

# 환경 설정
VITE_NODE_ENV=production
VITE_APP_NAME=Christmas Trading
VITE_APP_VERSION=2.0.0
```

## 🎯 **수정 완료 후 예상 결과**

✅ CORS 에러 완전 해결
✅ 로그인 정상 작동
✅ "인증 실패" 메시지 사라짐
✅ Supabase 연결 성공

## 🚨 **긴급 연락처**

수정 후에도 문제가 지속되면:
1. 브라우저 캐시 완전 삭제 (Ctrl+Shift+Delete)
2. 시크릿 모드에서 테스트
3. 개발자 도구 → Network 탭에서 요청 URL 확인

---
**📅 작성일**: 2025-05-27 04:00  
**🚨 우선순위**: CRITICAL - 즉시 수정 필요  
**⏰ 예상 해결 시간**: 5분  
**🎯 성공률**: 99% (올바른 URL 설정 시) 
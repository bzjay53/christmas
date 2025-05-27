# 🔧 Netlify 환경변수 수정 가이드

## 🚨 **현재 문제**

프론트엔드에서 잘못된 Supabase URL로 요청을 보내고 있습니다:
```
잘못된 URL: https://supabase.com/dashboard/project/qehzzsxzjijfzqkysazc/auth/v1/token
올바른 URL: https://qehzzsxzjijfzqkysazc.supabase.co/auth/v1/token
```

## 🛠️ **Netlify 환경변수 수정 방법**

### 1. Netlify 대시보드 접속
1. https://app.netlify.com 접속
2. `christmas-protocol` 사이트 선택
3. `Site settings` 클릭
4. `Environment variables` 메뉴 선택

### 2. 환경변수 확인 및 수정

#### 필수 환경변수 목록:
```bash
# Supabase 설정
VITE_SUPABASE_URL=https://qehzzsxzjijfzqkysazc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHp6c3h6amlqZnpxa3lzYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTgxMTQsImV4cCI6MjA2MzYzNDExNH0.zjrrUaVajb9fV1NRwzA_RMy3-r3Lpww9Uen-cZYXDuE

# 백엔드 API 설정
VITE_API_URL=http://31.220.83.213:8000
VITE_API_BASE_URL=http://31.220.83.213:8000/api

# 환경 설정
VITE_NODE_ENV=production
```

### 3. 환경변수 설정 단계

#### Step 1: VITE_SUPABASE_URL 확인
- **현재 값 확인**: 잘못된 대시보드 URL이 설정되어 있을 가능성
- **올바른 값**: `https://qehzzsxzjijfzqkysazc.supabase.co`
- **주의사항**: 끝에 `/` 없이 설정

#### Step 2: VITE_SUPABASE_ANON_KEY 확인
- **현재 값**: 올바른 키가 설정되어 있는지 확인
- **올바른 값**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### Step 3: 백엔드 API URL 확인
- **VITE_API_URL**: `http://31.220.83.213:8000`
- **VITE_API_BASE_URL**: `http://31.220.83.213:8000/api`

### 4. 재배포 트리거
환경변수 수정 후:
1. `Deploys` 탭으로 이동
2. `Trigger deploy` 클릭
3. `Deploy site` 선택

## 🔍 **프론트엔드 코드 확인**

### Supabase 클라이언트 초기화 확인:
```javascript
// src/lib/supabase.js 또는 유사한 파일
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 올바른 URL 형식 확인
console.log('Supabase URL:', supabaseUrl) // https://qehzzsxzjijfzqkysazc.supabase.co

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 🚨 **일반적인 실수들**

### 1. 잘못된 URL 형식
```bash
❌ https://supabase.com/dashboard/project/qehzzsxzjijfzqkysazc
❌ https://qehzzsxzjijfzqkysazc.supabase.co/
✅ https://qehzzsxzjijfzqkysazc.supabase.co
```

### 2. 환경변수 이름 오류
```bash
❌ SUPABASE_URL (Vite에서는 VITE_ 접두사 필요)
✅ VITE_SUPABASE_URL
```

### 3. 키 값 오류
```bash
❌ 만료된 키 또는 잘못된 키
✅ 유효한 anon key (eyJ로 시작)
```

## 🔧 **로컬 개발 환경 확인**

### .env.local 파일 (프론트엔드 루트):
```bash
# 로컬 개발용 환경변수
VITE_SUPABASE_URL=https://qehzzsxzjijfzqkysazc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHp6c3h6amlqZnpxa3lzYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTgxMTQsImV4cCI6MjA2MzYzNDExNH0.zjrrUaVajb9fV1NRwzA_RMy3-r3Lpww9Uen-cZYXDuE
VITE_API_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000/api
VITE_NODE_ENV=development
```

## 📊 **검증 방법**

### 1. 브라우저 개발자 도구에서 확인:
```javascript
// 콘솔에서 실행
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY)
```

### 2. 네트워크 탭에서 요청 URL 확인:
- 로그인 시도 시 올바른 URL로 요청이 가는지 확인
- `https://qehzzsxzjijfzqkysazc.supabase.co/auth/v1/token` 형태여야 함

### 3. CORS 에러 해결 확인:
- 올바른 URL 설정 후 CORS 에러가 사라져야 함

## 🎯 **성공 기준**

### 환경변수 수정 완료 후:
- [ ] 프론트엔드 재배포 성공
- [ ] 로그인 페이지에서 CORS 에러 없음
- [ ] Supabase 인증 요청이 올바른 URL로 전송
- [ ] 로그인 시도 시 적절한 응답 수신

---
**📅 작성일**: 2025-05-27 03:05  
**👤 작성자**: PM AI Assistant  
**🔄 상태**: 환경변수 수정 가이드 완료  
**📊 우선순위**: Critical - 즉시 실행 필요 
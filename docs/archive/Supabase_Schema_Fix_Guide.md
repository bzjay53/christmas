# 🔧 Supabase 스키마 수정 가이드

## 📋 개요
Christmas Trading 프로젝트의 Supabase 데이터베이스 스키마를 완성하기 위한 단계별 가이드입니다.

## 🚨 긴급 수정 필요 사항
- `ai_learning_data` 테이블에 `strategy_type` 컬럼 누락
- `users` 테이블 필수 컬럼들 누락
- 인덱스 및 RLS 정책 미설정

## 📊 1단계: Supabase 대시보드 접속

### 1.1 Supabase 프로젝트 접속
1. https://supabase.com 접속
2. 로그인 후 Christmas Trading 프로젝트 선택
3. 좌측 메뉴에서 "SQL Editor" 클릭

### 1.2 스키마 수정 스크립트 실행
1. `scripts/fix-supabase-schema.sql` 파일 내용 복사
2. SQL Editor에 붙여넣기
3. "Run" 버튼 클릭하여 실행

## 📝 2단계: 스키마 수정 내용 확인

### 2.1 주요 수정 사항
- ✅ `users` 테이블 확장 (KIS API, 텔레그램, OpenAI 설정 컬럼 추가)
- ✅ `ai_learning_data` 테이블 생성 (strategy_type 컬럼 포함)
- ✅ `ai_strategy_performance` 테이블 생성
- ✅ `trade_records` 테이블 생성
- ✅ 인덱스 생성
- ✅ RLS 정책 설정

### 2.2 테스트 데이터 삽입
- 관리자 계정: admin@christmas.com
- 테스트 계정: user@christmas.com

## 🔍 3단계: 스키마 적용 확인

### 3.1 테이블 구조 확인
```sql
-- users 테이블 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users';

-- ai_learning_data 테이블 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ai_learning_data';
```

### 3.2 인덱스 확인
```sql
-- 인덱스 목록 확인
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';
```

## ⚡ 4단계: 백엔드 연결 테스트

### 4.1 환경변수 확인
- `SUPABASE_URL`: 프로젝트 URL 확인
- `SUPABASE_SERVICE_KEY`: 서비스 키 확인
- `SUPABASE_ANON_KEY`: 익명 키 확인

### 4.2 연결 테스트
```bash
# 백엔드 서버 재시작 후 테스트
curl http://31.220.83.213:8000/api/health
```

## 📋 체크리스트

### Supabase 스키마 수정
- [ ] SQL 스크립트 실행 완료
- [ ] `ai_learning_data` 테이블 생성 확인
- [ ] `strategy_type` 컬럼 존재 확인
- [ ] 인덱스 생성 확인
- [ ] RLS 정책 활성화 확인

### 백엔드 연결 확인
- [ ] 환경변수 설정 확인
- [ ] Health Check API 응답 확인
- [ ] 데이터베이스 연결 상태 확인

## 🚨 문제 해결

### 스키마 실행 오류 시
1. 기존 테이블 충돌 확인
2. 권한 문제 확인
3. 단계별 실행 (테이블별로 분리)

### 연결 오류 시
1. 환경변수 재확인
2. 서비스 키 권한 확인
3. 네트워크 연결 확인

---

**⚠️ 중요**: 이 작업은 프로덕션 데이터베이스에 직접 영향을 미칩니다. 백업을 먼저 확인하고 신중하게 진행하세요.

**📅 작성일**: 2025-05-26  
**👤 작성자**: PM (AI Assistant)  
**🔄 상태**: 실행 대기 중 
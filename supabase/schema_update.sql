-- Christmas Trading: 한국투자증권 API 키 필드 추가
-- 실행 날짜: 2024-12-24
-- Phase 3: 사용자별 API 키 관리 시스템 구현

-- 기존 users 테이블에 한국투자증권 API 키 필드 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kis_real_app_key TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kis_real_app_secret TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kis_real_account TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kis_demo_app_key TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kis_demo_app_secret TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kis_demo_account TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kis_mock_mode BOOLEAN DEFAULT TRUE;

-- 인덱스 추가 (API 키 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_users_kis_mock_mode ON public.users(kis_mock_mode);

-- RLS 정책 업데이트 (기존 정책이 새 필드도 커버함)
-- users 테이블의 기존 RLS 정책: "Users can view their own data"가 새 필드도 보호함

-- 스키마 업데이트 완료 확인
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name LIKE 'kis_%'
ORDER BY column_name; 
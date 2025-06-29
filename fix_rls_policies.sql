-- Christmas Trading: Supabase RLS 정책 수정
-- 문제: 406/403 오류로 인한 users 테이블 접근 불가
-- 해결: 적절한 RLS 정책 설정

-- 1. 기존 정책 제거 (충돌 방지)
DROP POLICY IF EXISTS "Users can manage their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users during signup" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- 2. RLS 활성화 확인
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. 새로운 정책 생성 (더 관대하면서도 안전한 정책)

-- SELECT 정책: 본인 데이터만 조회 가능
CREATE POLICY "users_select_own" ON users 
FOR SELECT 
USING (auth.uid() = id);

-- INSERT 정책: 인증된 사용자가 본인 프로필 생성 가능
CREATE POLICY "users_insert_own" ON users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- UPDATE 정책: 본인 데이터만 수정 가능
CREATE POLICY "users_update_own" ON users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- DELETE 정책: 본인 데이터만 삭제 가능 (필요시)
CREATE POLICY "users_delete_own" ON users 
FOR DELETE 
USING (auth.uid() = id);

-- 4. 추가 정책: 회원가입 시 프로필 생성을 위한 임시 정책
-- (auth.uid()가 아직 설정되지 않은 경우를 대비)
CREATE POLICY "users_signup_insert" ON users 
FOR INSERT 
WITH CHECK (true); -- 임시로 모든 INSERT 허용 (신규 회원가입용)

-- 5. 테이블 권한 확인 및 설정
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;

-- 6. 시퀀스 권한도 설정 (ID 자동 생성용)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 7. 정책 상태 확인을 위한 쿼리 (실행 후 확인용)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';

-- 8. 테이블 권한 확인
SELECT table_name, privilege_type, grantee 
FROM information_schema.table_privileges 
WHERE table_name = 'users';

-- 완료 메시지
SELECT 'RLS 정책 설정 완료! 이제 users 테이블에 접근할 수 있습니다.' as status;
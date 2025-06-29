import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // 디버그 모드에서 더 상세한 로그
    debug: import.meta.env.DEV
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  },
  // 전역 설정
  global: {
    headers: {
      'X-Client-Info': 'christmas-trading-web'
    }
  },
  // DB 오류 처리 개선
  db: {
    schema: 'public'
  }
})

// 연결 테스트 함수 (개선된 버전)
export const testSupabaseConnection = async () => {
  try {
    // 빌드 시점에는 테스트 스킵
    if (typeof window === 'undefined') {
      return { success: true, message: 'Build time - skipped' }
    }
    
    console.log('🔄 Supabase 연결 테스트 시작...')
    
    // 1. Auth 서비스 연결 확인
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError && !authError.message.includes('session_not_found')) {
      console.error('❌ Auth 서비스 연결 실패:', authError)
      return { success: false, error: authError }
    }
    
    // 2. 공개 테이블 접근 테스트 (market_data_cache 사용)
    const { data, error } = await supabase
      .from('market_data_cache')
      .select('symbol')
      .limit(1)
    
    if (error) {
      console.log('테이블 접근 에러:', error.code, error.message)
      
      // RLS 오류나 테이블 없음 오류는 연결 성공을 의미
      if (error.code === 'PGRST116' || 
          error.code === 'PGRST301' || 
          error.message?.includes('relation') || 
          error.message?.includes('does not exist') ||
          error.message?.includes('row-level security')) {
        console.log('✅ Supabase 연결 성공! (서버 응답 정상)')
        return { success: true, message: 'Supabase connected - server responding' }
      }
      
      // 다른 에러는 실제 연결 문제
      console.error('❌ Supabase 연결 실패:', error)
      return { success: false, error }
    }
    
    console.log('✅ Supabase 연결 및 테이블 접근 성공!')
    return { success: true, data }
    
  } catch (err) {
    console.error('❌ Supabase 연결 테스트 예외:', err)
    return { success: false, error: err }
  }
}

// 디버그용 헬퍼 함수
export const debugSupabaseError = (error: any, context: string) => {
  console.group(`📊 Supabase 에러 디버그: ${context}`);
  console.log('에러 코드:', error?.code);
  console.log('에러 메시지:', error?.message);
  console.log('에러 상세:', error?.details);
  console.log('에러 힌트:', error?.hint);
  console.log('전체 에러 객체:', error);
  console.groupEnd();
};

// 전역 에러 핸들러 설정
if (typeof window !== 'undefined') {
  // 브라우저에서만 실행
  supabase.auth.onAuthStateChange((event, session) => {
    if (import.meta.env.DEV) {
      console.log(`🔑 Auth 상태 변경: ${event}`, session ? `User: ${session.user?.email}` : 'No user');
    }
  });
}

export default supabase
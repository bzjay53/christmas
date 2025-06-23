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
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
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
    
    // 더 안전한 연결 테스트: auth 상태 확인
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.warn('🎄 ⚠️  Auth 에러 (정상 - 로그인 전):', authError.message)
    }
    
    // 테이블 목록 조회로 연결 테스트 (더 안전함)
    const { data, error } = await supabase
      .from('nonexistent_table_test')
      .select('*')
      .limit(1)
    
    // 404 또는 테이블 없음 에러는 연결 성공을 의미
    if (error && (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist'))) {
      console.log('✅ Supabase 연결 성공! (서버 응답 정상)')
      return { success: true, message: 'Supabase connected - server responding' }
    }
    
    // 다른 에러는 실제 연결 문제
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Supabase 연결 실패:', error)
      return { success: false, error }
    }
    
    console.log('✅ Supabase 연결 및 테이블 조회 성공!')
    return { success: true, data }
    
  } catch (err) {
    console.error('❌ Supabase 연결 테스트 에러:', err)
    return { success: false, error: err }
  }
}

export default supabase
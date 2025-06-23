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

// 연결 테스트 함수
export const testSupabaseConnection = async () => {
  try {
    console.log('🔄 Supabase 연결 테스트 시작...')
    
    const { data, error } = await supabase
      .from('_test_connection')
      .select('*')
      .limit(1)
    
    if (error && error.code === 'PGRST116') {
      // 테이블이 없어도 연결은 성공
      console.log('✅ Supabase 연결 성공! (테이블 없음 - 정상)')
      return { success: true, message: 'Supabase connected successfully' }
    }
    
    if (error) {
      console.error('❌ Supabase 연결 실패:', error)
      return { success: false, error }
    }
    
    console.log('✅ Supabase 연결 및 데이터 조회 성공!')
    return { success: true, data }
    
  } catch (err) {
    console.error('❌ Supabase 연결 테스트 에러:', err)
    return { success: false, error: err }
  }
}

export default supabase
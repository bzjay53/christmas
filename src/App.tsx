import { useEffect } from 'react'
import StaticDashboardReact from './components/StaticDashboardReact'
import ChristmasSnowEffect from './components/ChristmasSnowEffect'
import SupabaseTestPanel from './components/SupabaseTestPanel'
import { testSupabaseConnection } from './lib/supabase'
import './styles/static-dashboard.css'

function App() {
  console.log('🎄 Christmas Trading React App - Supabase Integration v2.1')
  
  useEffect(() => {
    // Supabase 연결 테스트 (안전하게 재활성화)
    const initializeSupabase = async () => {
      try {
        const result = await testSupabaseConnection()
        if (result.success) {
          console.log('🎄 ✅ Supabase 백엔드 연결 성공!', result.message || '')
        } else {
          console.warn('🎄 ⚠️  Supabase 연결 확인 필요:', result.error)
        }
      } catch (error) {
        console.error('🎄 ❌ Supabase 초기화 에러:', error)
      }
    }
    
    initializeSupabase()
  }, [])
  
  return (
    <>
      <SupabaseTestPanel />
      <StaticDashboardReact />
      <ChristmasSnowEffect />
    </>
  )
}

export default App

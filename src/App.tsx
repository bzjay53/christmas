import { useEffect } from 'react'
import StaticDashboardReact from './components/StaticDashboardReact'
import ChristmasSnowEffect from './components/ChristmasSnowEffect'
import { testSupabaseConnection } from './lib/supabase'
import './styles/static-dashboard.css'

function App() {
  console.log('🎄 Christmas Trading React App - Supabase Integration')
  
  useEffect(() => {
    // Supabase 연결 테스트
    const initializeSupabase = async () => {
      const result = await testSupabaseConnection()
      if (result.success) {
        console.log('🎄 ✅ Supabase 백엔드 연결 성공!')
      } else {
        console.warn('🎄 ⚠️  Supabase 연결 확인 필요:', result.error)
      }
    }
    
    initializeSupabase()
  }, [])
  
  return (
    <>
      <StaticDashboardReact />
      <ChristmasSnowEffect />
    </>
  )
}

export default App

import { useEffect } from 'react'
import StaticDashboardReact from './components/StaticDashboardReact'
import ChristmasSnowEffect from './components/ChristmasSnowEffect'
import LiveStocksChart from './components/charts/LiveStocksChart'
import { testSupabaseConnection } from './lib/supabase'
import './styles/static-dashboard.css'

function App() {
  console.log('🎄 Christmas Trading React App - Live Data Integration v2.2')
  
  useEffect(() => {
    // Supabase 연결 테스트
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
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-green-50 to-red-50">
        <div className="container mx-auto px-4 py-6">
          <LiveStocksChart />
          <StaticDashboardReact />
        </div>
      </div>
      <ChristmasSnowEffect />
    </>
  )
}

export default App

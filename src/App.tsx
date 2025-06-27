import { useEffect, useState } from 'react'
import StaticDashboardReact from './components/StaticDashboardReact'
import ChristmasSnowEffect from './components/ChristmasSnowEffect'
// import LiveStocksChart from './components/charts/LiveStocksChart' // 제거됨: 중복 기능
import ThemeToggle from './components/ThemeToggle'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { testSupabaseConnection } from './lib/supabase'
import { getMarketStatus } from './lib/marketHours'
import './styles/static-dashboard.css'
import './styles/themes.css'

function AppContent() {
  const [isGlobalSnowEnabled, setIsGlobalSnowEnabled] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [marketStatus, setMarketStatus] = useState<any>(null)
  const { theme } = useTheme()

  // 실시간 시간 및 시장 상태 업데이트
  useEffect(() => {
    const updateTimeAndMarket = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }))
      setMarketStatus(getMarketStatus())
    }

    updateTimeAndMarket() // 초기 설정
    const interval = setInterval(updateTimeAndMarket, 1000) // 1초마다 업데이트

    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Theme Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="container mx-auto px-4 py-6" style={{ marginTop: '120px' }}>
        {/* LiveStocksChart 제거됨: StaticDashboardReact의 MajorIndicesChartJS로 통합 */}
        
        <StaticDashboardReact 
          isGlobalSnowEnabled={isGlobalSnowEnabled} 
          setIsGlobalSnowEnabled={setIsGlobalSnowEnabled} 
        />

        {/* 종합 대시보드 헤더 제거 - 사용자 요청 */}
      </div>
      <ChristmasSnowEffect enabled={isGlobalSnowEnabled} />
    </div>
  )
}

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
    <ThemeProvider defaultTheme="light">
      <AppContent />
    </ThemeProvider>
  )
}

export default App

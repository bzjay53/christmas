import { useEffect, useState } from 'react'
import StaticDashboardReact from './components/StaticDashboardReact'
import ChristmasSnowEffect from './components/ChristmasSnowEffect'
import LiveStocksChart from './components/charts/LiveStocksChart'
import ThemeToggle from './components/ThemeToggle'
import { ThemeProvider } from './contexts/ThemeContext'
import { testSupabaseConnection } from './lib/supabase'
import './styles/static-dashboard.css'
import './styles/themes.css'

function App() {
  console.log('🎄 Christmas Trading React App - Live Data Integration v2.2')
  const [isGlobalSnowEnabled, setIsGlobalSnowEnabled] = useState(false)
  
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
    <ThemeProvider defaultTheme="dark">
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {/* Theme Toggle Button */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        
        <div className="container mx-auto px-4 py-6" style={{ marginTop: '120px' }}>
          <LiveStocksChart />
          <StaticDashboardReact 
            isGlobalSnowEnabled={isGlobalSnowEnabled} 
            setIsGlobalSnowEnabled={setIsGlobalSnowEnabled} 
          />
        </div>
      </div>
      {isGlobalSnowEnabled && <ChristmasSnowEffect />}
    </ThemeProvider>
  )
}

export default App

import { useEffect, useState } from 'react'
import StaticDashboardReact from './components/StaticDashboardReact'
import ChristmasSnowEffect from './components/ChristmasSnowEffect'
import LiveStocksChart from './components/charts/LiveStocksChart'
import ThemeToggle from './components/ThemeToggle'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { testSupabaseConnection } from './lib/supabase'
import './styles/static-dashboard.css'
import './styles/themes.css'

function AppContent() {
  const [isGlobalSnowEnabled, setIsGlobalSnowEnabled] = useState(false)
  const { theme } = useTheme()
  
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Theme Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="container mx-auto px-4 py-6" style={{ marginTop: '120px' }}>
        <LiveStocksChart />
        
        {/* 종합 대시보드 헤더 */}
        <div className="mb-6" style={{
          background: theme === 'dark' 
            ? 'linear-gradient(135deg, #1e293b, #334155)' 
            : 'linear-gradient(135deg, #ffffff, #f1f5f9)',
          borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
          padding: '25px 20px',
          color: theme === 'dark' ? '#E5E7EB' : '#1e293b',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: theme === 'dark' 
            ? '0 2px 10px rgba(0, 0, 0, 0.2)' 
            : '0 2px 10px rgba(0, 0, 0, 0.05)',
          borderRadius: '8px',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`
        }}>
          <div style={{ 
            textAlign: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            marginBottom: '10px'
          }}>
            📊 종합 대시보드 - 포트폴리오 & 거래
          </div>
          <div style={{ 
            textAlign: 'center',
            fontSize: '1rem',
            marginBottom: '8px'
          }}>
            📊 3개 종목 | 🔄 오후 6:28:18
          </div>
          <div style={{ 
            textAlign: 'center',
            fontSize: '0.9rem',
            color: '#EF4444',
            marginBottom: '5px'
          }}>
            🔴 장 마감 - 다음날 09:00 개장
          </div>
          <div style={{ 
            textAlign: 'center',
            fontSize: '0.8rem',
            color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
          }}>
            💡 실제 거래시간: 평일 09:00-15:30
          </div>
        </div>
        
        <StaticDashboardReact 
          isGlobalSnowEnabled={isGlobalSnowEnabled} 
          setIsGlobalSnowEnabled={setIsGlobalSnowEnabled} 
        />
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

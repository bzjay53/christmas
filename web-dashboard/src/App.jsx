import React, { useState, useEffect } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

function App() {
  console.log('🔥 App 컴포넌트 렌더링 시작!')
  
  // Phase 3: 컴포넌트 구조 분리
  const [user, setUser] = useState(null)
  const [currentView, setCurrentView] = useState('welcome')
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('시스템 초기화 중...')
  
  console.log('📊 현재 상태:', { user, currentView, loading })
  
  // Phase 2: 안전한 초기화 로직
  useEffect(() => {
    console.log('🚀 시스템 초기화 시작')
    let mounted = true
    
    const initializeSystem = async () => {
      try {
        // 단계별 로딩 시뮬레이션
        const steps = [
          { message: '🎄 Christmas Trading 시스템 로드 중...', delay: 300 },
          { message: '🔧 컴포넌트 초기화 중...', delay: 200 },
          { message: '✅ 시스템 준비 완료!', delay: 200 }
        ]
        
        for (const step of steps) {
          if (!mounted) return
          
          setLoadingMessage(step.message)
          console.log('📝', step.message)
          await new Promise(resolve => setTimeout(resolve, step.delay))
        }
        
        if (mounted) {
          console.log('✅ 초기화 완료')
          setLoading(false)
        }
        
      } catch (error) {
        console.error('❌ 초기화 에러:', error)
        if (mounted) {
          setLoadingMessage('❌ 시스템 오류가 발생했습니다.')
          // 3초 후 로딩 해제 (안전장치)
          setTimeout(() => {
            if (mounted) setLoading(false)
          }, 3000)
        }
      }
    }
    
    initializeSystem()
    
    return () => {
      console.log('🧹 useEffect cleanup')
      mounted = false
    }
  }, [])
  
  // Phase 3: 로그인 핸들러
  const handleLogin = (userData) => {
    console.log('🔐 로그인 성공:', userData)
    setUser(userData)
    setCurrentView('dashboard')
  }
  
  // Phase 3: 로그아웃 핸들러
  const handleLogout = () => {
    console.log('🚪 로그아웃 성공')
    setUser(null)
    setCurrentView('welcome')
  }
  
  // Phase 2: 로딩 화면
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'Arial'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '64px', 
            marginBottom: '20px',
            animation: 'pulse 2s infinite'
          }}>🎄</div>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>
            Christmas Trading System
          </div>
          <div style={{ fontSize: '16px', opacity: 0.8 }}>
            {loadingMessage}
          </div>
          <div style={{ 
            marginTop: '20px',
            fontSize: '12px',
            opacity: 0.6 
          }}>
            Phase 3: 컴포넌트 구조 분리 테스트
          </div>
        </div>
      </div>
    )
  }
  
  // Phase 3: 조건부 렌더링 (컴포넌트 분리)
  if (currentView === 'dashboard' && user) {
    return <Dashboard user={user} onLogout={handleLogout} />
  }
  
  return <Login onLogin={handleLogin} />
}

export default App 
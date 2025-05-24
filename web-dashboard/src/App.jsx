import React, { useState, useEffect } from 'react'

function App() {
  console.log('🔥 App 컴포넌트 렌더링 시작!')
  
  // Phase 2: 로딩 상태 추가
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
  
  // 로그인 시뮬레이션
  const handleLogin = () => {
    console.log('🔐 로그인 시뮬레이션')
    const testUser = {
      id: 'test-user',
      name: 'Christmas Trader',
      email: 'test@christmas.com'
    }
    setUser(testUser)
    setCurrentView('dashboard')
  }
  
  // 로그아웃 시뮬레이션
  const handleLogout = () => {
    console.log('🚪 로그아웃 시뮬레이션')
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
            Phase 2: 로딩 시스템 테스트
          </div>
        </div>
      </div>
    )
  }
  
  // 조건부 렌더링
  if (currentView === 'dashboard' && user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#e8f5e8',
        fontFamily: 'Arial',
        color: '#333'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', padding: '20px' }}>
          <h1>🎄 Christmas Trading Dashboard</h1>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '10px',
            margin: '20px 0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3>환영합니다, {user.name}님!</h3>
            <p>📧 이메일: {user.email}</p>
            <p>⏰ 현재 시간: {new Date().toLocaleString()}</p>
            <p style={{ fontSize: '14px', color: '#666' }}>
              ✅ Phase 2: 로딩 시스템 정상 작동
            </p>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            로그아웃
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f0f8ff',
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#333'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>🎄 Christmas Trading System</h1>
        <p>자동매매 시스템에 오신 것을 환영합니다!</p>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '10px',
          margin: '20px 0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '16px', color: '#666' }}>
            현재 시간: {new Date().toLocaleString()}
          </p>
          <p style={{ fontSize: '14px', color: '#999' }}>
            시스템 상태: ✅ Phase 2 로딩 시스템 적용
          </p>
        </div>
        <button 
          onClick={handleLogin}
          style={{
            padding: '15px 30px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold'
          }}
        >
          시스템 접속하기
        </button>
      </div>
    </div>
  )
}

export default App 
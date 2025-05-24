import React, { useState } from 'react'

function App() {
  console.log('🔥 App 컴포넌트 렌더링 시작!')
  
  // 기본 상태 관리 추가
  const [user, setUser] = useState(null)
  const [currentView, setCurrentView] = useState('welcome')
  
  console.log('📊 현재 상태:', { user, currentView })
  
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
            시스템 상태: ✅ 정상 작동 중
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
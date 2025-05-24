import React from 'react'

function Login({ onLogin }) {
  console.log('🔐 Login 컴포넌트 렌더링')
  
  const handleLogin = () => {
    console.log('🔑 로그인 버튼 클릭')
    const testUser = {
      id: 'test-user',
      name: 'Christmas Trader',
      email: 'test@christmas.com',
      membershipType: 'premium',
      isAuthenticated: true
    }
    onLogin(testUser)
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
      <div style={{ textAlign: 'center', maxWidth: '500px', padding: '20px' }}>
        <div style={{
          fontSize: '64px',
          marginBottom: '20px'
        }}>🎄</div>
        
        <h1>Christmas Trading System</h1>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
          자동매매 시스템에 오신 것을 환영합니다!
        </p>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '30px', 
          borderRadius: '15px',
          margin: '20px 0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#333', marginBottom: '20px' }}>시스템 정보</h3>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
            📅 현재 시간: {new Date().toLocaleString()}
          </p>
          <p style={{ fontSize: '14px', color: '#28a745', marginBottom: '20px' }}>
            ✅ Phase 3: 컴포넌트 구조 분리 완료
          </p>
          <p style={{ fontSize: '12px', color: '#999' }}>
            🔧 Supabase 없이 안전한 모드로 동작 중
          </p>
        </div>
        
        <button 
          onClick={handleLogin}
          style={{
            padding: '15px 40px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          🚀 시스템 접속하기
        </button>
        
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          Phase 3: Login 컴포넌트 분리 테스트
        </div>
      </div>
    </div>
  )
}

export default Login 
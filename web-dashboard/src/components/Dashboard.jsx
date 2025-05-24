import React from 'react'

function Dashboard({ user, onLogout }) {
  console.log('📊 Dashboard 컴포넌트 렌더링', user)
  
  const handleLogout = () => {
    console.log('🚪 로그아웃 버튼 클릭')
    onLogout()
  }
  
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
      <div style={{ textAlign: 'center', maxWidth: '700px', padding: '20px' }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px'
        }}>🎄</div>
        
        <h1>Christmas Trading Dashboard</h1>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '30px', 
          borderRadius: '15px',
          margin: '20px 0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#333', marginBottom: '20px' }}>
            환영합니다, {user.name}님! 🎉
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#666' }}>📧 이메일</p>
              <p style={{ margin: 0, fontSize: '14px' }}>{user.email}</p>
            </div>
            
            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#666' }}>👤 사용자 ID</p>
              <p style={{ margin: 0, fontSize: '14px' }}>{user.id}</p>
            </div>
            
            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#666' }}>💳 멤버십</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#28a745', fontWeight: 'bold' }}>
                {user.membershipType || 'Premium'}
              </p>
            </div>
          </div>
          
          <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#333' }}>🎯 시스템 상태</p>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
              ⏰ 현재 시간: {new Date().toLocaleString()}
            </p>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#28a745' }}>
              ✅ Phase 3: Dashboard 컴포넌트 분리 완료
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
              🔧 Supabase 없이 안전한 모드로 동작 중
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
            onClick={() => alert('📊 포트폴리오 기능 (추후 구현)')}
          >
            📊 포트폴리오
          </button>
          
          <button 
            style={{
              padding: '12px 24px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
            onClick={() => alert('🤖 자동매매 기능 (추후 구현)')}
          >
            🤖 자동매매
          </button>
          
          <button 
            style={{
              padding: '12px 24px',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
            onClick={() => alert('⚙️ 설정 기능 (추후 구현)')}
          >
            ⚙️ 설정
          </button>
          
          <button 
            onClick={handleLogout}
            style={{
              padding: '12px 24px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🚪 로그아웃
          </button>
        </div>
        
        <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
          Phase 3: Dashboard 컴포넌트 분리 테스트 완료
        </div>
      </div>
    </div>
  )
}

export default Dashboard 
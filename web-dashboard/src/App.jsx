import React from 'react'

function App() {
  console.log('🔥 App 컴포넌트 렌더링 시작!')
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f0f0f0',
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#333'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>🎄 Hello Christmas Trading!</h1>
        <p>React 앱이 정상 작동합니다!</p>
        <p style={{ fontSize: '16px', color: '#666' }}>
          현재 시간: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  )
}

export default App 
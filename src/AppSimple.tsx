import React from 'react';

// 가장 간단한 App 컴포넌트 - 디버깅용
function AppSimple() {
  console.log('🎄 AppSimple 컴포넌트 렌더링');

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#000',
      color: '#fff',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#22C55E' }}>🎄 Christmas Trading - Simple Test</h1>
      <h2>Binance Dashboard v1</h2>
      
      <div style={{ 
        backgroundColor: '#1a1a1a', 
        padding: '20px', 
        borderRadius: '10px',
        marginTop: '20px'
      }}>
        <h3 style={{ color: '#22C55E' }}>System Status</h3>
        <p>✅ React is working!</p>
        <p>✅ Components are rendering!</p>
        <p>✅ CSS styles are applied!</p>
        <p>Current time: {new Date().toLocaleString()}</p>
      </div>

      <div style={{ 
        backgroundColor: '#1a1a1a', 
        padding: '20px', 
        borderRadius: '10px',
        marginTop: '20px'
      }}>
        <h3 style={{ color: '#FFC107' }}>Crypto Prices (Mock)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px' }}>
            <h4 style={{ color: '#22C55E' }}>Bitcoin (BTC)</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>$43,250.00</p>
            <p style={{ color: '#22C55E' }}>+2.98% (+$1,250)</p>
          </div>
          <div style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px' }}>
            <h4 style={{ color: '#22C55E' }}>Ethereum (ETH)</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>$2,580.50</p>
            <p style={{ color: '#EF4444' }}>-1.72% (-$45.00)</p>
          </div>
          <div style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px' }}>
            <h4 style={{ color: '#22C55E' }}>Binance Coin (BNB)</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>$315.75</p>
            <p style={{ color: '#22C55E' }}>+4.05% (+$12.30)</p>
          </div>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#1a1a1a', 
        padding: '20px', 
        borderRadius: '10px',
        marginTop: '20px'
      }}>
        <h3 style={{ color: '#3B82F6' }}>Debug Information</h3>
        <p>Component: AppSimple</p>
        <p>React Version: {React.version}</p>
        <p>Environment: Production</p>
        <p>Timestamp: {Date.now()}</p>
      </div>
    </div>
  );
}

export default AppSimple;
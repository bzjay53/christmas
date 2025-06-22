// import './App.css'

function App() {
  console.log('App component rendering...')
  
  return (
    <div style={{ 
      padding: '20px', 
      color: 'white', 
      backgroundColor: '#1f2937',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#10B981', marginBottom: '20px' }}>
        🎄 Christmas Trading Dashboard - Test
      </h1>
      <p>✅ React is working!</p>
      <p>✅ Components are rendering!</p>
      <p>✅ JavaScript is executing!</p>
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#374151', 
        borderRadius: '8px' 
      }}>
        <h3>System Check:</h3>
        <ul>
          <li>✅ HTML loaded</li>
          <li>✅ CSS applied</li>
          <li>✅ React mounted</li>
          <li>✅ JavaScript running</li>
        </ul>
      </div>
    </div>
  )
}

export default App

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ProTraderLayout from './components/ProTraderLayout'
import ProTraderDashboard from './components/ProTraderDashboard'
import { Portfolio } from './pages/Portfolio'
import { AIRecommendations } from './pages/AIRecommendations'
import './App.css'

function App() {
  try {
    return (
      <Router>
        <ProTraderLayout>
          <Routes>
            <Route path="/" element={<ProTraderDashboard />} />
            <Route path="/dashboard" element={<ProTraderDashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/ai-recommendations" element={<AIRecommendations />} />
          </Routes>
        </ProTraderLayout>
      </Router>
    )
  } catch (error) {
    console.error('App error:', error)
    return (
      <div style={{ padding: '20px', color: 'white', backgroundColor: '#1f2937' }}>
        <h1>🎄 Christmas Trading Dashboard</h1>
        <p>Loading application...</p>
        <p>Error: {String(error)}</p>
      </div>
    )
  }
}

export default App

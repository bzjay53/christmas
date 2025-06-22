import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ProTraderLayout from './components/ProTraderLayout'
import ProTraderDashboard from './components/ProTraderDashboard'
import { Portfolio } from './pages/Portfolio'
import { AIRecommendations } from './pages/AIRecommendations'
import './App.css'

function App() {
  console.log('🎄 App component rendering...');
  
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
    console.error('🎄 ERROR in App component:', error);
    return (
      <div style={{ padding: '20px', color: 'red', fontFamily: 'monospace' }}>
        <h1>🎄 Christmas Trading - App Error</h1>
        <p>Error in App component: {String(error)}</p>
      </div>
    );
  }
}

export default App

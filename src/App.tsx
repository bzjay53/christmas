import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ProTraderLayout from './components/ProTraderLayout'
import ProTraderDashboard from './components/ProTraderDashboard'
import { Portfolio } from './pages/Portfolio'
import { AIRecommendations } from './pages/AIRecommendations'
import './App.css'

function App() {
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
}

export default App

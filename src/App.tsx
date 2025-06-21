import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Navigation } from './components/Navigation'
import { LandingPage } from './pages/LandingPage'
import { Dashboard } from './pages/Dashboard'
import { Portfolio } from './pages/Portfolio'
import { AIRecommendations } from './pages/AIRecommendations'
import { SnowEffect } from './components/SnowEffect'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <SnowEffect />
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/ai-recommendations" element={<AIRecommendations />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

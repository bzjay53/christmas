import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'
import Navigation from './components/Navigation'
import Dashboard from './components/Dashboard'
import Portfolio from './components/Portfolio'
import Trading from './components/Trading'
import Settings from './components/Settings'

function App() {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Navigation />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/trading" element={<Trading />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Box>
    </Box>
  )
}

export default App 
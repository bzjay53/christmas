import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout, message } from 'antd'
import { useAuth } from './contexts/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'

// Pages
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TradingPage from './pages/TradingPage'
import PortfolioPage from './pages/PortfolioPage'
import SettingsPage from './pages/SettingsPage'

// Components
import Header from './components/Layout/Header'
import Sidebar from './components/Layout/Sidebar'
import LoadingSpinner from './components/LoadingSpinner'

// Styles
import './App.css'

const { Content } = Layout

// Configure global message settings
message.config({
  top: 80,
  duration: 3,
  maxCount: 3,
})

const App: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  // Public routes (no authentication required)
  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ErrorBoundary>
    )
  }

  // Private routes (authentication required)
  return (
    <ErrorBoundary>
      <Layout className="app-layout">
        <Sidebar />
        <Layout className="site-layout">
          <Header />
          <Content className="site-layout-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/trading" element={<TradingPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </ErrorBoundary>
  )
}

export default App
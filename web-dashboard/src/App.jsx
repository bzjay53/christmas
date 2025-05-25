import React, { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import { NotificationProvider, useNotification } from './components/NotificationProvider'

// Christmas 테마 (Enhanced)
const christmasTheme = createTheme({
  palette: {
    primary: {
      main: '#1d3557',
      light: '#457b9d',
      lighter: '#a8dadc',
      dark: '#1d3557'
    },
    secondary: {
      main: '#e63946',
      light: '#f1faee',
    },
    success: {
      main: '#4cc9f0',
      light: '#a7e9af',
    },
    warning: {
      main: '#ffd166',
      light: '#fff3cd',
    },
    error: {
      main: '#e63946',
      light: '#f7cad0',
    },
    info: {
      main: '#4895ef',
      light: '#4361ee',
      lighter: '#e3f2fd'
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Noto Sans KR", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    }
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          borderRadius: 10,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1d3557',
          color: 'white',
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: 'rgba(255, 255, 255, 0.8)',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: 'rgba(255, 255, 255, 0.8)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        hover: {
          '&:hover': {
            backgroundColor: 'rgba(77, 196, 240, 0.1)',
          },
        },
      },
    },
  },
})

function AppContent() {
  console.log('🔥 App 컴포넌트 렌더링 시작!')
  
  const { showNotification } = useNotification()
  
  // Phase 4-5-6: 통합 상태 관리
  const [user, setUser] = useState(null)
  const [currentView, setCurrentView] = useState('welcome')
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('시스템 초기화 중...')
  
  console.log('📊 현재 상태:', { user, currentView, loading })
  
  // Phase 2-3: 안전한 초기화 로직 (개선)
  useEffect(() => {
    console.log('🚀 시스템 초기화 시작')
    let mounted = true
    
    const initializeSystem = async () => {
      try {
        // 단계별 로딩 시뮬레이션 (개선된 메시지)
        const steps = [
          { message: '🎄 Christmas Trading 시스템 로드 중...', delay: 400 },
          { message: '🎨 Material-UI 컴포넌트 초기화 중...', delay: 300 },
          { message: '🔔 알림 시스템 준비 중...', delay: 200 },
          { message: '📊 포트폴리오 데이터 로드 중...', delay: 300 },
          { message: '✅ 시스템 준비 완료!', delay: 200 }
        ]
        
        for (const step of steps) {
          if (!mounted) return
          
          setLoadingMessage(step.message)
          console.log('📝', step.message)
          await new Promise(resolve => setTimeout(resolve, step.delay))
        }
        
        if (mounted) {
          console.log('✅ 초기화 완료')
          setLoading(false)
          
          // 초기화 완료 알림
          setTimeout(() => {
            showNotification('🎉 Christmas Trading 시스템이 성공적으로 로드되었습니다!', 'success')
          }, 500)
        }
        
      } catch (error) {
        console.error('❌ 초기화 에러:', error)
        if (mounted) {
          setLoadingMessage('❌ 시스템 오류가 발생했습니다.')
          showNotification('시스템 초기화 중 오류가 발생했습니다.', 'error')
          
          // 3초 후 로딩 해제 (안전장치)
          setTimeout(() => {
            if (mounted) setLoading(false)
          }, 3000)
        }
      }
    }
    
    initializeSystem()
    
    return () => {
      console.log('🧹 useEffect cleanup')
      mounted = false
    }
  }, [showNotification])
  
  // Phase 4-5-6: 로그인 핸들러 (개선)
  const handleLogin = (userData) => {
    console.log('🔐 로그인 성공:', userData)
    setUser(userData)
    setCurrentView('dashboard')
  }
  
  // Phase 4-5-6: 로그아웃 핸들러 (개선)
  const handleLogout = () => {
    console.log('🚪 로그아웃 성공')
    setUser(null)
    setCurrentView('welcome')
  }
  
  // Phase 4-5-6: 로딩 화면 (Material-UI 스타일)
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'Roboto, Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '80px', 
            marginBottom: '30px',
            animation: 'pulse 2s infinite'
          }}>🎄</div>
          <div style={{ fontSize: '28px', marginBottom: '15px', fontWeight: 'bold' }}>
            Christmas Trading System
          </div>
          <div style={{ fontSize: '18px', opacity: 0.9, marginBottom: '20px' }}>
            {loadingMessage}
          </div>
          <div style={{ 
            marginTop: '30px',
            fontSize: '14px',
            opacity: 0.7,
            padding: '10px 20px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '20px',
            display: 'inline-block'
          }}>
            ✅ Phase 4-5-6 통합 | 🎨 Material-UI | 🔔 알림 시스템 | 📊 완전한 기능
          </div>
        </div>
      </div>
    )
  }
  
  // Phase 4-5-6: 조건부 렌더링 (통합 완료)
  if (currentView === 'dashboard' && user) {
    return (
      <Dashboard 
        user={user} 
        onLogout={handleLogout}
        onShowNotification={showNotification}
      />
    )
  }
  
  return (
    <Login 
      onLogin={handleLogin}
      onShowNotification={showNotification}
    />
  )
}

function App() {
  return (
    <ThemeProvider theme={christmasTheme}>
      <CssBaseline />
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ThemeProvider>
  )
}

export default App 
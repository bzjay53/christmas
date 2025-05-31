import React, { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline, Box, Snackbar, Alert } from '@mui/material'
import WelcomeScreen from './components/WelcomeScreen'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import { authHelpers } from './lib/supabase'
import apiService from './lib/apiService'

// 🎄 Christmas 테마
const christmasTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#c41e3a', // Christmas Red
      light: '#ff5722',
      dark: '#8b0000'
    },
    secondary: {
      main: '#228b22', // Christmas Green
      light: '#32cd32',
      dark: '#006400'
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a'
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }
      }
    }
  }
})

function App() {
  console.log('🔥 App 컴포넌트 렌더링 시작!')
  
  // 상태 관리
  const [currentView, setCurrentView] = useState('welcome')
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('🎄 Christmas Trading 시스템 초기화 중...')
  
  // 알림 시스템
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  })

  console.log('📊 현재 상태:', { currentView, user: user?.email, loading })

  // 알림 표시 함수
  const showNotification = (message, severity = 'info') => {
    console.log('🔔 알림 표시:', message, severity)
    setNotification({
      open: true,
      message,
      severity
    })
  }

  // 알림 닫기
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }))
  }

  // 🚀 시스템 초기화 (보안 강화 버전)
  useEffect(() => {
    console.log('🚀 시스템 초기화 시작')
    let mounted = true

    const initializeSystem = async () => {
      try {
        // 1. 백엔드 프록시를 통한 세션 확인
        const initializeAuth = async () => {
          try {
            console.log('🔄 백엔드 프록시를 통한 세션 확인 중...')
            const sessionData = await authHelpers.getSession()
            
            if (sessionData && sessionData.user) {
              console.log('✅ 기존 세션 발견:', sessionData.user)
              
              const userData = {
                id: sessionData.user.id,
                name: sessionData.user.name || 'Christmas Trader',
                email: sessionData.user.email,
                membershipType: sessionData.user.membership_type || 'free',
                isAuthenticated: true,
                joinDate: new Date(sessionData.user.created_at).toLocaleDateString(),
                backendUser: sessionData.user
              }
              
              if (mounted) {
                setSession(sessionData)
                setUser(userData)
                setCurrentView('dashboard')
              }
              return sessionData
            }
            return null
          } catch (error) {
            console.warn('⚠️ 세션 확인 실패:', error.message)
            return null
          }
        }
        
        const session = await initializeAuth()
        
        // 2. 시스템 초기화 (빠른 버전)
        setLoadingMessage('🎄 Christmas Trading 시스템 로드 중...')
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 3. 백엔드 연결 상태 확인
        setLoadingMessage('🔗 백엔드 서버 연결 확인 중...')
        try {
          const healthCheck = await apiService.request('/health')
          console.log('✅ 백엔드 연결 정상:', healthCheck)
          showNotification('🎉 시스템이 정상적으로 초기화되었습니다!', 'success')
        } catch (error) {
          console.warn('⚠️ 백엔드 연결 실패:', error)
          showNotification('⚠️ 백엔드 서버 연결에 문제가 있습니다.', 'warning')
        }
        
        // 4. 초기화 완료
        if (mounted) {
          setLoading(false)
          if (!session) {
            setCurrentView('welcome')
          }
        }
        
        console.log('✅ 초기화 완료')
        
      } catch (error) {
        console.error('❌ 시스템 초기화 실패:', error)
        if (mounted) {
          setLoading(false)
          setCurrentView('welcome')
          showNotification('❌ 시스템 초기화에 실패했습니다.', 'error')
        }
      }
    }

    initializeSystem()
    
    return () => {
      console.log('🧹 useEffect cleanup')
      mounted = false
    }
  }, [showNotification])
  
  // 🔑 로그인 핸들러 (백엔드 프록시 사용)
  const handleLogin = async (email, password, isSignUp = false) => {
    console.log(`🔑 ${isSignUp ? '회원가입' : '로그인'} 시작`)
    
    try {
      let result
      if (isSignUp) {
        // 회원가입
        const userData = {
          first_name: email.split('@')[0],
          last_name: 'User',
          membership_type: 'free',
          signup_event: 'christmas_launch_2024'
        }
        
        result = await authHelpers.signUp(email, password, userData)
        console.log('📥 회원가입 응답:', result)
        
        if (result.user) {
          showNotification('🎉 회원가입이 완료되었습니다! 이메일을 확인해주세요.', 'success')
          return true
        }
      } else {
        // 로그인
        result = await authHelpers.signIn(email, password)
        console.log('📥 로그인 응답:', result)
        
        if (result.user) {
          const userData = {
            id: result.user.id,
            name: result.user.name || email.split('@')[0],
            email: result.user.email,
            membershipType: result.user.membership_type || 'free',
            isAuthenticated: true,
            joinDate: new Date(result.user.created_at).toLocaleDateString(),
            backendUser: result.user
          }
          
          setSession(result)
          setUser(userData)
          setCurrentView('dashboard')
          showNotification(`🎉 환영합니다! ${userData.name}님`, 'success')
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error(`❌ ${isSignUp ? '회원가입' : '로그인'} 실패:`, error)
      showNotification(`❌ ${isSignUp ? '회원가입' : '로그인'} 실패: ${error.message}`, 'error')
      return false
    }
  }

  // 🚪 로그아웃 핸들러
  const handleLogout = async () => {
    console.log('🚪 로그아웃 시작')
    
    try {
      await authHelpers.signOut()
      setSession(null)
      setUser(null)
      setCurrentView('welcome')
      showNotification('👋 로그아웃되었습니다.', 'info')
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error)
      // 로그아웃은 실패해도 로컬 상태는 초기화
      setSession(null)
      setUser(null)
      setCurrentView('welcome')
      showNotification('👋 로그아웃되었습니다.', 'info')
    }
  }

  // 🎯 렌더링 결정
  const renderContent = () => {
    console.log('🎯 렌더링 결정:', { currentView, loading, user: !!user })
    
    if (loading) {
      return (
        <Box 
          display="flex" 
          flexDirection="column"
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
          sx={{
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
            color: 'white',
            textAlign: 'center'
          }}
        >
          <Box sx={{ mb: 4 }}>
            🎄
          </Box>
          <Box sx={{ fontSize: '1.2rem', mb: 2 }}>
            {loadingMessage}
          </Box>
          <Box sx={{ fontSize: '0.9rem', opacity: 0.7 }}>
            잠시만 기다려주세요...
          </Box>
        </Box>
      )
    }

    switch (currentView) {
      case 'welcome':
        console.log('📊 Welcome 렌더링')
        return (
          <WelcomeScreen 
            onGetStarted={() => setCurrentView('login')}
            onShowNotification={showNotification}
          />
        )
      
      case 'login':
        console.log('🔐 Login 렌더링')
        return (
          <Login 
            onLogin={handleLogin}
            onShowNotification={showNotification}
          />
        )
      
      case 'dashboard':
        console.log('📊 Dashboard 렌더링')
        return (
          <Dashboard 
            user={user}
            onLogout={handleLogout}
            onShowNotification={showNotification}
          />
        )
      
      default:
        return (
          <WelcomeScreen 
            onGetStarted={() => setCurrentView('login')}
            onShowNotification={showNotification}
          />
        )
    }
  }

  return (
    <ThemeProvider theme={christmasTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh' }}>
        {renderContent()}
        
        {/* 알림 시스템 */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  )
}

export default App 
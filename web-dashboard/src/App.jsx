import React, { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import { NotificationProvider, useNotification } from './components/NotificationProvider'
import { supabase, isSupabaseEnabled, isAuthBypass, isDemoMode } from './lib/supabase'

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
  
  // Supabase 세션 관리 상태
  const [user, setUser] = useState(null)
  const [currentView, setCurrentView] = useState('welcome')
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('시스템 초기화 중...')
  const [session, setSession] = useState(null)
  
  console.log('📊 현재 상태:', { user, currentView, loading, session })
  
  // Supabase 세션 관리 및 시스템 초기화
  useEffect(() => {
    console.log('🚀 시스템 초기화 시작')
    let mounted = true
    
    const initializeSystem = async () => {
      try {
        setLoadingMessage('🔐 인증 시스템 확인 중...')
        
        // 1. 인증 시스템 초기화 (환경 설정에 따라 처리)
        const initializeAuth = async () => {
          // 인증 우회 모드인 경우 세션 체크 건너뛰기
          if (isAuthBypass) {
            console.log('🚀 인증 우회 모드 - 로그인 화면으로 이동')
            return null
          }
          
          // Supabase가 비활성화된 경우
          if (!isSupabaseEnabled || !supabase) {
            console.log('🎮 Supabase 비활성화 - 데모 모드로 실행')
            return null
          }
          
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 3000) // 3초 타임아웃
            
            const { data: { session }, error } = await supabase.auth.getSession()
            clearTimeout(timeoutId)
            
            if (error) {
              console.warn('⚠️ Supabase 연결 실패:', error.message)
              return null
            }
            
            if (session && session.user) {
              console.log('✅ 기존 Supabase 세션 발견:', session.user)
              
              const userData = {
                id: session.user.id,
                name: session.user.user_metadata?.first_name || 'Christmas Trader',
                email: session.user.email,
                membershipType: session.user.user_metadata?.membership_type || 'free',
                isAuthenticated: true,
                joinDate: new Date(session.user.created_at).toLocaleDateString(),
                supabaseUser: session.user
              }
              
              if (mounted) {
                setSession(session)
                setUser(userData)
                setCurrentView('dashboard')
              }
              return session
            }
            return null
          } catch (error) {
            console.warn('⚠️ Supabase 초기화 실패:', error.message)
            return null
          }
        }
        
        const session = await initializeAuth()
        
        // 2. 시스템 초기화 (빠른 버전)
        setLoadingMessage('🎄 Christmas Trading 시스템 로드 중...')
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (mounted) {
          console.log('✅ 초기화 완료')
          setLoading(false)
          
          // 초기화 완료 알림
          setTimeout(() => {
            if (session && session.user) {
              showNotification(`🎉 환영합니다! ${session.user.user_metadata?.first_name || 'Christmas Trader'}님`, 'success')
            } else {
              showNotification('🎉 Christmas Trading 시스템이 성공적으로 로드되었습니다!', 'success')
            }
          }, 500)
        }
        
      } catch (error) {
        console.error('❌ 초기화 에러:', error)
        if (mounted) {
          console.log('🚨 오류 발생, 로그인 화면으로 이동')
          setLoading(false) // 즉시 로딩 해제
          showNotification('시스템이 데모 모드로 시작됩니다.', 'info')
        }
      }
    }
    
    // Supabase 인증 상태 변화 리스너 (활성화된 경우에만)
    let subscription = null
    if (isSupabaseEnabled && supabase) {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 Supabase 인증 상태 변화:', event, session)
          
          if (event === 'SIGNED_IN' && session) {
            const userData = {
              id: session.user.id,
              name: session.user.user_metadata?.first_name || 'Christmas Trader',
              email: session.user.email,
              membershipType: session.user.user_metadata?.membership_type || 'free',
              isAuthenticated: true,
              joinDate: new Date(session.user.created_at).toLocaleDateString(),
              supabaseUser: session.user
            }
            
            setSession(session)
            setUser(userData)
            setCurrentView('dashboard')
          } else if (event === 'SIGNED_OUT') {
            setSession(null)
            setUser(null)
            setCurrentView('welcome')
          }
        }
      )
      subscription = data
    }
    
    initializeSystem()
    
    return () => {
      console.log('🧹 useEffect cleanup')
      mounted = false
      if (subscription && subscription.subscription) {
        subscription.subscription.unsubscribe()
      }
    }
  }, [showNotification])
  
  // 로그인 핸들러 (Supabase 연동)
  const handleLogin = (userData) => {
    console.log('🔐 로그인 성공:', userData)
    setUser(userData)
    setCurrentView('dashboard')
  }
  
  // 로그아웃 핸들러 (Supabase 연동)
  const handleLogout = async () => {
    console.log('🚪 로그아웃 시작')
    try {
      if (isSupabaseEnabled && supabase) {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('❌ 로그아웃 오류:', error)
          showNotification('로그아웃 중 오류가 발생했습니다.', 'error')
          return
        }
        console.log('✅ Supabase 로그아웃 성공')
      }
      
      // 로컬 상태 정리
      setUser(null)
      setCurrentView('welcome')
      setSession(null)
      showNotification('성공적으로 로그아웃되었습니다.', 'info')
      
    } catch (error) {
      console.error('❌ 로그아웃 예외:', error)
      // 에러가 발생해도 로컬 상태는 정리
      setUser(null)
      setCurrentView('welcome')
      setSession(null)
      showNotification('로그아웃되었습니다.', 'info')
    }
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
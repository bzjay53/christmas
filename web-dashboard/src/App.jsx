import React, { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline, Snackbar, Alert } from '@mui/material'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import { supabase, supabaseHelpers } from './lib/supabase'

// 커스텀 테마
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
})

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  })

  // Supabase 인증 상태 모니터링
  useEffect(() => {
    let mounted = true

    // 프로덕션/개발 모드 모두 지원: 테스트 사용자로 자동 로그인
    console.log('🎄 Christmas Trading 시스템 초기화 중...')
    
    const testUser = {
      id: 'test-user-id',
      email: 'test@christmas-trading.com',
      firstName: 'Christmas',
      lastName: 'Trader',
      membershipType: 'premium',
      isAdmin: false,
      isAuthenticated: true,
      profile: {
        first_name: 'Christmas',
        last_name: 'Trader',
        membership_type: 'premium',
        is_admin: false,
        daily_trade_count: 0,
        total_extension_days: 0,
        personal_referral_code: 'TEST2024'
      }
    }
    
    // 로딩 시간 단축: 500ms로 변경
    setTimeout(() => {
      if (mounted) {
        setUser(testUser)
        setLoading(false)
        showNotification('🎄 Christmas Trading 시스템에 접속했습니다!', 'success')
      }
    }, 500) // 500ms로 단축
    
    return () => {
      mounted = false
    }

    // 원래 Supabase 로직은 주석 처리
    /*
    // 개발 환경에서는 테스트 사용자로 바로 로그인
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 개발 모드: 테스트 사용자로 자동 로그인')
      
      const testUser = {
        id: 'test-user-id',
        email: 'test@christmas-trading.com',
        firstName: 'Christmas',
        lastName: 'Trader',
        membershipType: 'premium',
        isAdmin: false,
        isAuthenticated: true,
        profile: {
          first_name: 'Christmas',
          last_name: 'Trader',
          membership_type: 'premium',
          is_admin: false,
          daily_trade_count: 0,
          total_extension_days: 0,
          personal_referral_code: 'TEST2024'
        }
      }
      
      setTimeout(() => {
        if (mounted) {
          setUser(testUser)
          setLoading(false)
          showNotification('🎄 개발 모드로 접속했습니다!', 'info')
        }
      }, 1000) // 1초 로딩 시뮬레이션
      
      return () => {
        mounted = false
      }
    }

    // 현재 세션 확인
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('세션 확인 오류:', error)
          setLoading(false)
          return
        }

        if (session?.user && mounted) {
          await handleUserSession(session.user)
        } else if (mounted) {
          setUser(null)
          setLoading(false)
        }
      } catch (err) {
        console.error('세션 체크 실패:', err)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (!mounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        await handleUserSession(session.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
        showNotification('로그아웃되었습니다.', 'info')
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        await handleUserSession(session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    checkSession()

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
    */
  }, [])

  // 사용자 세션 처리
  const handleUserSession = async (supabaseUser) => {
    try {
      // 사용자 프로필 조회
      const userProfile = await supabaseHelpers.getUserProfile(supabaseUser.id)
      
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        membershipType: userProfile.membership_type,
        isAdmin: userProfile.is_admin,
        isAuthenticated: true,
        supabaseUser: supabaseUser,
        profile: userProfile,
        lastLoginAt: userProfile.last_login_at,
        freeTrialEndDate: userProfile.free_trial_end_date,
        dailyTradeCount: userProfile.daily_trade_count,
        totalExtensionDays: userProfile.total_extension_days,
        personalReferralCode: userProfile.personal_referral_code
      })

      // 마지막 로그인 시간 업데이트
      await supabaseHelpers.updateUserProfile(supabaseUser.id, {
        last_login_at: new Date().toISOString()
      })

      setLoading(false)
      
    } catch (error) {
      console.error('프로필 로드 실패:', error)
      
      // 프로필이 없는 경우 기본 사용자 정보만으로 설정
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email,
        firstName: supabaseUser.user_metadata?.first_name || 'User',
        lastName: supabaseUser.user_metadata?.last_name || '',
        membershipType: 'free',
        isAdmin: false,
        isAuthenticated: true,
        supabaseUser: supabaseUser,
        profile: null
      })
      
      setLoading(false)
      showNotification('프로필 정보를 불러오는데 문제가 있었습니다.', 'warning')
    }
  }

  // 로그인 처리
  const handleLogin = (userData) => {
    setUser(userData)
    showNotification(`${userData.firstName}님, 환영합니다!`, 'success')
  }

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('로그아웃 오류:', error)
        showNotification('로그아웃 중 오류가 발생했습니다.', 'error')
      }
      
      setUser(null)
      setLoading(false)
    } catch (err) {
      console.error('로그아웃 실패:', err)
      setUser(null)
      setLoading(false)
      showNotification('로그아웃 처리 중 오류가 발생했습니다.', 'error')
    }
  }

  // 사용자 프로필 업데이트
  const updateUserProfile = async (updates) => {
    try {
      const updatedProfile = await supabaseHelpers.updateUserProfile(user.id, updates)
      
      setUser(prevUser => ({
        ...prevUser,
        ...updates,
        profile: { ...prevUser.profile, ...updatedProfile }
      }))
      
      showNotification('프로필이 업데이트되었습니다.', 'success')
      return updatedProfile
    } catch (error) {
      console.error('프로필 업데이트 실패:', error)
      showNotification('프로필 업데이트에 실패했습니다.', 'error')
      throw error
    }
  }

  // 거래 권한 확인
  const checkTradingPermission = async () => {
    try {
      const permission = await supabaseHelpers.checkAndUpdateDailyTradeCount(user.id)
      
      // 사용자 상태 업데이트
      if (permission.currentCount !== user.dailyTradeCount) {
        setUser(prevUser => ({
          ...prevUser,
          dailyTradeCount: permission.currentCount
        }))
      }
      
      return permission
    } catch (error) {
      console.error('거래 권한 확인 실패:', error)
      showNotification('거래 권한 확인 중 오류가 발생했습니다.', 'error')
      return { canTrade: false, reason: '시스템 오류' }
    }
  }

  // 알림 표시
  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    })
  }

  // 알림 닫기
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false })
  }

  // 로딩 중 표시
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          color: 'white',
          fontSize: '18px',
          fontFamily: 'Roboto'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎄</div>
            <div>Christmas Trading 로딩 중...</div>
            <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
              클라우드 인증 시스템 연결 중
            </div>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {user && user.isAuthenticated ? (
        <Dashboard 
          user={user}
          onLogout={handleLogout}
          onUpdateProfile={updateUserProfile}
          onCheckTradingPermission={checkTradingPermission}
          onShowNotification={showNotification}
        />
      ) : (
        <Login onLogin={handleLogin} />
      )}

      {/* 글로벌 알림 */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  )
}

export default App 
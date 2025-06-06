import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Avatar,
  Paper,
  Grid,
  Chip,
  Divider,
  Alert
} from '@mui/material'
import {
  AccountCircle,
  Security,
  Speed,
  TrendingUp
} from '@mui/icons-material'
import { supabase, isSupabaseEnabled, isAuthBypass } from '../lib/supabase'
import apiService from '../lib/apiService'

function Login({ onLogin, onShowNotification }) {
  console.log('🔐 Supabase Login 컴포넌트 렌더링')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // URL에서 이메일 인증 토큰 처리
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const urlParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = urlParams.get('access_token')
      const type = urlParams.get('type')
      
      if (accessToken && type === 'signup') {
        console.log('📧 이메일 인증 토큰 감지:', { accessToken: accessToken.substring(0, 20) + '...', type })
        setLoading(true)
        setError('')
        
        try {
          // Supabase 세션 설정
          console.log('🔄 Supabase 세션 설정 중...')
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: urlParams.get('refresh_token')
          })
          
          if (error) {
            console.error('❌ 세션 설정 실패:', error)
            throw error
          }
          
          console.log('✅ 세션 설정 성공:', data)
          
          if (data.user) {
            console.log('✅ 이메일 인증 완료:', data.user)
            
            // URL 정리 (먼저 실행)
            window.history.replaceState({}, document.title, window.location.pathname)
            
            // 사용자 데이터 생성
            const user = {
              id: data.user.id,
              name: data.user.user_metadata?.first_name || 'Christmas Trader',
              email: data.user.email,
              membershipType: data.user.user_metadata?.membership_type || 'free',
              isAuthenticated: true,
              joinDate: new Date(data.user.created_at).toLocaleDateString(),
              supabaseUser: data.user,
              emailVerified: true // 이메일 인증을 통해 로그인했으므로 true
            }
            
            console.log('🎯 이메일 인증 사용자 데이터 전달:', user)
            
            // 즉시 로그인 처리 (App.jsx의 onAuthStateChange는 중복 방지 로직으로 처리됨)
            onLogin(user)
            
            if (onShowNotification) {
              onShowNotification(`🎉 이메일 인증이 완료되었습니다! 환영합니다, ${user.name}님!`, 'success')
            }
          }
        } catch (error) {
          console.error('❌ 이메일 인증 처리 실패:', error)
          setError(`이메일 인증 처리 실패: ${error.message}`)
          
          if (onShowNotification) {
            onShowNotification(`❌ 이메일 인증 처리 실패: ${error.message}`, 'error')
          }
        } finally {
          setLoading(false)
        }
      }
    }
    
    handleEmailConfirmation()
  }, [])
  
  const handleAuth = async () => {
    console.log(`🔑 ${isSignUp ? '회원가입' : '로그인'} 시작`)
    setLoading(true)
    setError('')
    
    try {
      // Supabase 연결 상태 확인
      if (!supabase) {
        throw new Error('Supabase 클라이언트 초기화 실패. 관리자에게 문의하세요.')
      }
      
      console.log('🔗 Supabase 연결 상태:', { 
        enabled: isSupabaseEnabled, 
        client: !!supabase,
        url: supabase.supabaseUrl,
        key: supabase.supabaseKey?.substring(0, 20) + '...'
      })
      
      // 실제 Supabase 인증 처리
      let result
      if (isSignUp) {
        console.log('📝 회원가입 시작:', { email, passwordLength: password.length })
        
        // 회원가입 (무료 이벤트 포함)
        const freeTrialEndDate = new Date()
        freeTrialEndDate.setDate(freeTrialEndDate.getDate() + 7) // 7일 무료 체험
        
        const signUpData = {
          email,
          password,
          options: {
            data: {
              first_name: email.split('@')[0],
              last_name: 'User',
              membership_type: 'free',
              free_trial_end_date: freeTrialEndDate.toISOString(),
              is_free_trial: true,
              signup_event: 'christmas_launch_2024'
            }
          }
        }
        
        console.log('📤 Supabase 회원가입 요청:', signUpData)
        result = await supabase.auth.signUp(signUpData)
        console.log('📥 Supabase 회원가입 응답:', result)
      } else {
        console.log('🔑 로그인 시작:', { email, passwordLength: password.length })
        
        // 로그인
        const signInData = { email, password }
        console.log('📤 Supabase 로그인 요청:', signInData)
        result = await supabase.auth.signInWithPassword(signInData)
        console.log('📥 Supabase 로그인 응답:', result)
      }
      
      if (result.error) {
        throw result.error
      }
      
      if (result.data.user) {
        console.log('✅ Supabase 인증 성공:', result.data.user)
        
        const user = {
          id: result.data.user.id,
          name: result.data.user.user_metadata?.first_name || 'Christmas Trader',
          email: result.data.user.email,
          membershipType: result.data.user.user_metadata?.membership_type || 'free',
          isAuthenticated: true,
          joinDate: new Date(result.data.user.created_at).toLocaleDateString(),
          supabaseUser: result.data.user
        }
        
        onLogin(user)
        
        if (onShowNotification) {
          const message = isSignUp 
            ? `🎉 회원가입 완료! 7일 무료 체험 혜택이 제공됩니다. 이메일 인증 후 로그인해주세요!`
            : `환영합니다, ${user.name}님! 🎉`
          onShowNotification(message, 'success')
        }
        
        // 회원가입인 경우 이메일 인증 안내
        if (isSignUp && onShowNotification) {
          setTimeout(() => {
            onShowNotification('📧 이메일 인증 링크를 발송했습니다. 받은편지함을 확인해주세요!', 'info')
          }, 2500)
        }
      }
    } catch (error) {
      console.error('❌ Supabase 인증 실패:', error)
      
      // 에러 메시지 개선
      let errorMessage = error.message
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = '네트워크 연결을 확인해주세요. 백엔드 서버가 실행 중인지 확인하세요.'
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = '이메일 인증이 필요합니다. 받은편지함을 확인해주세요.'
      } else if (error.message.includes('User already registered')) {
        errorMessage = '이미 가입된 이메일입니다. 로그인을 시도해주세요.'
      }
      
      setError(errorMessage)
      
      if (onShowNotification) {
        onShowNotification(`인증 실패: ${errorMessage}`, 'error')
      }
    } finally {
      setLoading(false)
    }
  }
  
  const handleDemoLogin = () => {
    console.log('🎮 데모 모드 로그인 시작')
    
    // 즉시 처리되도록 개선
    const testUser = {
      id: 'demo-user-' + Date.now(),
      name: 'Christmas Demo Trader',
      email: 'demo@christmas.com',
      membershipType: 'premium',
      isAuthenticated: true,
      joinDate: '2024-12-25',
      totalProfit: 1250000,
      winRate: 78.5,
      isDemoMode: true,
      permissions: ['view', 'trade', 'settings']
    }
    
    console.log('✅ 데모 사용자 생성:', testUser)
    
    // 즉시 로그인 처리
    setTimeout(() => {
      onLogin(testUser)
      
      if (onShowNotification) {
        onShowNotification(`🎮 데모 모드로 접속했습니다! 모든 기능을 체험해보세요.`, 'success')
      }
    }, 100) // 100ms 지연으로 UI 응답성 확보
  }

  const handleAdminDemoLogin = () => {
    console.log('👑 관리자 데모 모드 로그인 시작')
    
    const adminUser = {
      id: 'admin-demo-' + Date.now(),
      name: 'Christmas Admin',
      email: 'admin@christmas.com',
      membershipType: 'lifetime',
      isAuthenticated: true,
      joinDate: '2024-01-01',
      totalProfit: 15750000,
      winRate: 92.3,
      isDemoMode: true,
      isAdmin: true,
      permissions: ['view', 'trade', 'settings', 'admin', 'user_management', 'system_config']
    }
    
    console.log('✅ 관리자 사용자 생성:', adminUser)
    
    setTimeout(() => {
      onLogin(adminUser)
      
      if (onShowNotification) {
        onShowNotification(`👑 관리자 데모 모드로 접속했습니다! 전체 시스템을 관리할 수 있습니다.`, 'info')
      }
    }, 100)
  }
  
  // 백엔드 API 연결 테스트
  const handleBackendTest = async () => {
    console.log('🔍 백엔드 API 연결 테스트 시작')
    setLoading(true)
    
    try {
      // 서버 기본 정보 가져오기
      const serverInfo = await apiService.getServerInfo()
      console.log('✅ 백엔드 서버 정보:', serverInfo)
      
      // 헬스 체크
      const health = await apiService.getHealth()
      console.log('✅ 백엔드 헬스 체크:', health)
      
      if (onShowNotification) {
        onShowNotification(
          `🎉 백엔드 연결 성공!\n🔸 버전: ${serverInfo.version}\n🔸 모드: ${serverInfo.mode}\n🔸 상태: ${health.status}`, 
          'success'
        )
      }
    } catch (error) {
      console.error('❌ 백엔드 연결 실패:', error)
      if (onShowNotification) {
        onShowNotification(`❌ 백엔드 연결 실패: ${error.message}`, 'error')
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            borderRadius: 4,
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* 헤더 */}
            <Box textAlign="center" mb={4}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                  fontSize: '2.5rem'
                }}
              >
                🎄
              </Avatar>
              <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                Christmas Trading
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                AI 기반 클라우드 자동매매 시스템
              </Typography>
            </Box>

            {/* 기능 소개 */}
            <Paper elevation={0} sx={{ bgcolor: 'grey.50', p: 3, mb: 3, borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={4} textAlign="center">
                  <Speed color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="caption" display="block" fontWeight="bold">
                    실시간 분석
                  </Typography>
                </Grid>
                <Grid item xs={4} textAlign="center">
                  <Security color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="caption" display="block" fontWeight="bold">
                    안전한 거래
                  </Typography>
                </Grid>
                <Grid item xs={4} textAlign="center">
                  <TrendingUp color="warning" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="caption" display="block" fontWeight="bold">
                    수익 최적화
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* 안내 메시지 */}
            {isSignUp && (
              <Alert severity="info" sx={{ mb: 3 }}>
                📝 회원가입 시 이메일 인증이 필요합니다. 받은편지함을 확인해주세요!<br />
                ✅ 이메일 인증 후 자동으로 로그인됩니다.
              </Alert>
            )}
            
            {/* 이메일 인증 처리 중 메시지 */}
            {window.location.hash.includes('access_token') && (
              <Alert severity="success" sx={{ mb: 3 }}>
                📧 이메일 인증을 처리하고 있습니다... 잠시만 기다려주세요!
              </Alert>
            )}
            
            {/* 에러 메시지 */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* 인증 폼 */}
            <Box component="form" onSubmit={(e) => { e.preventDefault(); handleAuth(); }}>
              <TextField
                fullWidth
                label="이메일 주소"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
                variant="outlined"
                InputProps={{
                  startAdornment: <AccountCircle sx={{ mr: 1, color: 'action.active' }} />
                }}
                placeholder="user@example.com"
                required
              />
              
              <TextField
                fullWidth
                label="비밀번호"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
                variant="outlined"
                placeholder="비밀번호를 입력하세요"
                required
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !email || !password}
                sx={{
                  py: 1.5,
                  mb: 2,
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
                  }
                }}
              >
                {loading ? '처리중...' : (isSignUp ? '🚀 회원가입' : '🔑 로그인')}
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => setIsSignUp(!isSignUp)}
                sx={{ mb: 2 }}
              >
                {isSignUp ? '로그인으로 전환' : '회원가입으로 전환'}
              </Button>
              
              {/* 데모 모드 섹션 - 더 눈에 띄게 개선 */}
              <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: 'success.lighter', borderRadius: 2 }}>
                <Typography variant="body2" color="success.main" fontWeight="bold" textAlign="center" gutterBottom>
                  🎮 로그인 없이 바로 체험하기
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  size="large"
                  onClick={handleDemoLogin}
                  sx={{ mb: 1, borderRadius: 2 }}
                >
                  🎮 데모 모드로 체험하기
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  color="warning"
                  size="small"
                  onClick={handleAdminDemoLogin}
                  sx={{ 
                    fontSize: '0.8rem',
                    borderRadius: 2
                  }}
                >
                  👑 관리자 데모 모드 (고급 기능)
                </Button>
              </Paper>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* 상태 정보 */}
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" gutterBottom>
                시스템 상태
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={supabase?.supabaseUrl?.includes('qehzzsxzjijfzqkysazc') ? "✅ Supabase 연동" : "❌ Supabase 오류"} 
                  color={supabase?.supabaseUrl?.includes('qehzzsxzjijfzqkysazc') ? "success" : "error"} 
                  size="small" 
                />
                <Chip 
                  label="🎨 Material-UI" 
                  color="primary" 
                  size="small" 
                />
                <Chip 
                  label="🔔 알림 시스템" 
                  color="secondary" 
                  size="small" 
                />
                <Chip 
                  label="🐳 Netlify 배포" 
                  color="info" 
                  size="small" 
                />
              </Box>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                현재 시간: {new Date().toLocaleString()}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={handleBackendTest}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                🔍 백엔드 API 테스트
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default Login 
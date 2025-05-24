import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Tab,
  Tabs,
  Grid,
  InputAdornment,
  IconButton,
  Divider,
  Chip
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Lock,
  Security,
  VpnKey
} from '@mui/icons-material'
import { supabase, supabaseHelpers } from '../lib/supabase'

function Login({ onLogin }) {
  const [tabValue, setTabValue] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // 로그인 폼 상태
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })

  // 회원가입 폼 상태
  const [signupForm, setSignupForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  })

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    setError('')
    setSuccess('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Supabase Auth로 로그인
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('이메일 또는 비밀번호가 잘못되었습니다.')
        } else if (authError.message.includes('Email not confirmed')) {
          setError('이메일 인증이 필요합니다. 이메일을 확인해주세요.')
        } else {
          setError(authError.message)
        }
        return
      }

      // 사용자 프로필 정보 조회
      try {
        const userProfile = await supabaseHelpers.getUserProfile(authData.user.id)
        
        setSuccess('로그인 성공!')
        setTimeout(() => {
          onLogin({
            id: authData.user.id,
            email: authData.user.email,
            firstName: userProfile.first_name,
            lastName: userProfile.last_name,
            membershipType: userProfile.membership_type,
            isAdmin: userProfile.is_admin,
            isAuthenticated: true,
            supabaseUser: authData.user,
            profile: userProfile
          })
        }, 1000)
      } catch (profileError) {
        console.error('프로필 조회 실패:', profileError)
        // 프로필이 없어도 로그인은 성공으로 처리
        onLogin({
          id: authData.user.id,
          email: authData.user.email,
          firstName: 'User',
          lastName: '',
          membershipType: 'free',
          isAdmin: false,
          isAuthenticated: true,
          supabaseUser: authData.user,
          profile: null
        })
      }

    } catch (err) {
      console.error('로그인 오류:', err)
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 비밀번호 확인
    if (signupForm.password !== signupForm.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setLoading(false)
      return
    }

    // 비밀번호 강도 체크
    if (signupForm.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      setLoading(false)
      return
    }

    try {
      // 초대 코드 검증 (있는 경우)
      let referralData = null
      if (signupForm.referralCode) {
        try {
          referralData = await supabaseHelpers.findUserByReferralCode(signupForm.referralCode)
        } catch (referralError) {
          setError('유효하지 않은 초대 코드입니다.')
          setLoading(false)
          return
        }
      }

      // Supabase Auth로 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          data: {
            first_name: signupForm.firstName,
            last_name: signupForm.lastName,
            referred_by: signupForm.referralCode || null
          }
        }
      })

      if (authError) {
        if (authError.message.includes('User already registered')) {
          setError('이미 가입된 이메일입니다.')
        } else {
          setError(authError.message)
        }
        return
      }

      // 사용자 프로필 생성 (Auth 트리거로 자동 생성되지만, 추가 정보 업데이트)
      if (authData.user) {
        try {
          // 사용자 프로필에 추가 정보 저장
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: authData.user.email,
              first_name: signupForm.firstName,
              last_name: signupForm.lastName,
              referred_by: signupForm.referralCode || null,
              membership_type: 'free'
            })

          if (profileError) {
            console.log('프로필 생성 오류 (이미 존재할 수 있음):', profileError)
          }

          // 초대 보상 처리
          if (referralData && authData.user) {
            try {
              await supabase
                .from('referral_rewards')
                .insert({
                  inviter_id: referralData.user_id,
                  invitee_id: authData.user.id,
                  referral_code: signupForm.referralCode,
                  reward_type: 'free_extension',
                  reward_days: 7,
                  is_verified: true,
                  verification_method: 'automatic'
                })
            } catch (rewardError) {
              console.log('초대 보상 처리 오류:', rewardError)
            }
          }
        } catch (err) {
          console.log('추가 프로필 설정 오류:', err)
        }
      }

      setSuccess('회원가입이 완료되었습니다! 이메일을 확인하여 인증을 완료해주세요.')
      setTimeout(() => {
        setTabValue(0) // 로그인 탭으로 이동
        setSignupForm({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          referralCode: ''
        })
      }, 3000)

    } catch (err) {
      console.error('회원가입 오류:', err)
      setError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // URL에서 초대 코드 자동 추출
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const refCode = urlParams.get('ref')
    if (refCode) {
      setSignupForm(prev => ({ ...prev, referralCode: refCode }))
      setTabValue(1) // 회원가입 탭으로 이동
    }
  }, [])

  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="100vh"
      sx={{ 
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        padding: 2 
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 500, boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {/* 헤더 */}
          <Box textAlign="center" mb={3}>
            <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              🎄 Christmas Trading
            </Typography>
            <Typography variant="body2" color="textSecondary">
              클라우드 기반 자동매매 시스템에 오신 것을 환영합니다
            </Typography>
          </Box>

          {/* 탭 */}
          <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3 }}>
            <Tab label="로그인" />
            <Tab label="회원가입" />
          </Tabs>

          {/* 알림 메시지 */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* 로그인 폼 */}
          {tabValue === 0 && (
            <Box component="form" onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="이메일"
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
                required
              />
              <TextField
                fullWidth
                label="비밀번호"
                type={showPassword ? 'text' : 'password'}
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                required
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ py: 1.5, mb: 2 }}
              >
                {loading ? '로그인 중...' : '로그인'}
              </Button>

              {/* 데모 계정 안내 */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="textSecondary" textAlign="center" gutterBottom>
                실제 Supabase 인증을 사용합니다:
              </Typography>
              <Box textAlign="center" p={1} sx={{ backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Chip label="실제 회원가입" color="primary" size="small" sx={{ mb: 0.5 }} />
                <Typography variant="caption" display="block">
                  위에서 실제 이메일로 가입해보세요!
                </Typography>
                <Typography variant="caption" display="block" color="success.main">
                  완전 무료 서비스입니다 🎉
                </Typography>
              </Box>
            </Box>
          )}

          {/* 회원가입 폼 */}
          {tabValue === 1 && (
            <Box component="form" onSubmit={handleSignup}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="이름"
                    value={signupForm.firstName}
                    onChange={(e) => setSignupForm({...signupForm, firstName: e.target.value})}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
                        </InputAdornment>
                      ),
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="성"
                    value={signupForm.lastName}
                    onChange={(e) => setSignupForm({...signupForm, lastName: e.target.value})}
                    required
                  />
                </Grid>
              </Grid>
              
              <TextField
                fullWidth
                label="이메일"
                type="email"
                value={signupForm.email}
                onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
                required
              />
              
              <TextField
                fullWidth
                label="비밀번호"
                type={showPassword ? 'text' : 'password'}
                value={signupForm.password}
                onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText="6자 이상 입력해주세요"
                required
              />
              
              <TextField
                fullWidth
                label="비밀번호 확인"
                type={showConfirmPassword ? 'text' : 'password'}
                value={signupForm.confirmPassword}
                onChange={(e) => setSignupForm({...signupForm, confirmPassword: e.target.value})}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Security color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                required
              />

              <TextField
                fullWidth
                label="초대 코드 (선택사항)"
                value={signupForm.referralCode}
                onChange={(e) => setSignupForm({...signupForm, referralCode: e.target.value.toUpperCase()})}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKey color="action" />
                    </InputAdornment>
                  ),
                }}
                helperText="친구의 초대 코드가 있다면 입력하세요 (7일 무료 기간 연장)"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? '가입 중...' : '무료 회원가입'}
              </Button>

              <Box sx={{ mt: 2, p: 2, backgroundColor: 'info.lighter', borderRadius: 1 }}>
                <Typography variant="body2" color="info.main" textAlign="center">
                  🎁 무료 혜택: 7일 무제한 모의매매 + 클라우드 24시간 서비스
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default Login 
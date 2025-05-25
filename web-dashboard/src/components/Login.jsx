import React, { useState } from 'react'
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
import { supabase } from '../lib/supabase'

function Login({ onLogin, onShowNotification }) {
  console.log('🔐 Supabase Login 컴포넌트 렌더링')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const handleAuth = async () => {
    console.log(`🔑 Supabase ${isSignUp ? '회원가입' : '로그인'} 시작`)
    setLoading(true)
    setError('')
    
    try {
      let result
      if (isSignUp) {
        // 회원가입
        result = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: email.split('@')[0],
              last_name: 'User',
              membership_type: 'free'
            }
          }
        })
      } else {
        // 로그인
        result = await supabase.auth.signInWithPassword({
          email,
          password
        })
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
            ? `🎉 회원가입 완료! 환영합니다, ${user.name}님!`
            : `환영합니다, ${user.name}님! 🎉`
          onShowNotification(message, 'success')
        }
      }
    } catch (error) {
      console.error('❌ Supabase 인증 실패:', error)
      setError(error.message)
      
      if (onShowNotification) {
        onShowNotification(`인증 실패: ${error.message}`, 'error')
      }
    } finally {
      setLoading(false)
    }
  }
  
  const handleDemoLogin = () => {
    console.log('🎮 데모 모드 로그인')
    const testUser = {
      id: 'demo-user',
      name: 'Demo Trader',
      email: 'demo@christmas.com',
      membershipType: 'premium',
      isAuthenticated: true,
      joinDate: '2024-12-01',
      totalProfit: 1250000,
      winRate: 78.5,
      isDemoMode: true
    }
    
    onLogin(testUser)
    
    if (onShowNotification) {
      onShowNotification(`🎮 데모 모드로 접속했습니다!`, 'info')
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
              
              <Button
                fullWidth
                variant="text"
                size="large"
                onClick={handleDemoLogin}
                sx={{ mb: 2 }}
              >
                🎮 데모 모드로 체험하기
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* 상태 정보 */}
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" gutterBottom>
                시스템 상태
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label="✅ Supabase 연동" 
                  color="success" 
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
                  label="🐳 Docker 배포" 
                  color="info" 
                  size="small" 
                />
              </Box>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                현재 시간: {new Date().toLocaleString()}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default Login 
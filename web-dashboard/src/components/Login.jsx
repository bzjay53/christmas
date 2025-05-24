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
  Divider
} from '@mui/material'
import {
  AccountCircle,
  Security,
  Speed,
  TrendingUp
} from '@mui/icons-material'

function Login({ onLogin, onShowNotification }) {
  console.log('🔐 Material-UI Login 컴포넌트 렌더링')
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleLogin = async () => {
    console.log('🔑 Material-UI 로그인 버튼 클릭')
    setLoading(true)
    
    // 로딩 시뮬레이션
    setTimeout(() => {
      const testUser = {
        id: 'test-user',
        name: 'Christmas Trader',
        email: email || 'test@christmas.com',
        membershipType: 'premium',
        isAuthenticated: true,
        joinDate: '2024-12-01',
        totalProfit: 1250000,
        winRate: 78.5
      }
      
      onLogin(testUser)
      
      // 성공 알림
      if (onShowNotification) {
        onShowNotification(`환영합니다, ${testUser.name}님! 🎉`, 'success')
      }
      
      setLoading(false)
    }, 1500)
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

            {/* 로그인 폼 */}
            <Box component="form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <TextField
                fullWidth
                label="이메일 주소"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 3 }}
                variant="outlined"
                InputProps={{
                  startAdornment: <AccountCircle sx={{ mr: 1, color: 'action.active' }} />
                }}
                placeholder="demo@christmas.com"
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  mb: 3,
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
                  }
                }}
              >
                {loading ? '접속 중...' : '🚀 시스템 접속하기'}
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
                  label="✅ Phase 4-5-6 통합" 
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
                  label="🔧 No Supabase" 
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
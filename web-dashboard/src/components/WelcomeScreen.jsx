import React from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Paper
} from '@mui/material'
import {
  TrendingUp,
  Security,
  Speed,
  Psychology,
  AutoAwesome,
  Shield
} from '@mui/icons-material'

function WelcomeScreen({ onGetStarted, onShowNotification }) {
  console.log('🎄 WelcomeScreen 컴포넌트 렌더링')

  const features = [
    {
      icon: <TrendingUp sx={{ fontSize: 40, color: '#c41e3a' }} />,
      title: 'AI 자동매매',
      description: '인공지능 기반 실시간 매매 신호 생성'
    },
    {
      icon: <Security sx={{ fontSize: 40, color: '#228b22' }} />,
      title: '보안 강화',
      description: '백엔드 프록시를 통한 완전한 보안 시스템'
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: '#c41e3a' }} />,
      title: '실시간 분석',
      description: '한국투자증권 API 연동 실시간 데이터'
    },
    {
      icon: <Psychology sx={{ fontSize: 40, color: '#228b22' }} />,
      title: '학습 알고리즘',
      description: '거래 결과 학습을 통한 성능 개선'
    }
  ]

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a1a1a 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* 메인 콘텐츠 */}
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              {/* 보안 강화 배지 */}
              <Chip
                icon={<Shield />}
                label="🔒 보안 강화 버전"
                sx={{
                  mb: 3,
                  backgroundColor: '#228b22',
                  color: 'white',
                  fontWeight: 600
                }}
              />
              
              {/* 메인 타이틀 */}
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 700,
                  mb: 2,
                  background: 'linear-gradient(45deg, #c41e3a, #ff6b6b)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                🎄 Christmas Trading
              </Typography>
              
              {/* 서브타이틀 */}
              <Typography
                variant="h5"
                sx={{
                  mb: 3,
                  color: '#cccccc',
                  fontWeight: 400
                }}
              >
                AI 자체학습 기반 자동매매 시스템
              </Typography>
              
              {/* 설명 */}
              <Typography
                variant="body1"
                sx={{
                  mb: 4,
                  color: '#aaaaaa',
                  fontSize: '1.1rem',
                  lineHeight: 1.6
                }}
              >
                기존 지표와 AI 학습을 결합하여 더 높은 승률을 달성하는 
                차세대 자동매매 플랫폼입니다. 보안이 강화된 백엔드 프록시 
                시스템으로 안전하게 거래하세요.
              </Typography>
              
              {/* 시작 버튼 */}
              <Button
                variant="contained"
                size="large"
                onClick={onGetStarted}
                sx={{
                  backgroundColor: '#c41e3a',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: '#8b0000'
                  }
                }}
              >
                🚀 시작하기
              </Button>
            </Box>
          </Grid>
          
          {/* 기능 소개 */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              {features.map((feature, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Card
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      height: '100%',
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)'
                      }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Box sx={{ mb: 2 }}>
                        {feature.icon}
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 1,
                          color: 'white',
                          fontWeight: 600
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#cccccc',
                          lineHeight: 1.5
                        }}
                      >
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
        
        {/* 하단 정보 */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Paper
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              p: 3,
              borderRadius: 2
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent="center"
              alignItems="center"
            >
              <Chip
                icon={<AutoAwesome />}
                label="프론트엔드: Netlify"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              />
              <Chip
                icon={<Security />}
                label="백엔드: 31.220.83.213"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              />
              <Chip
                icon={<Shield />}
                label="보안: 백엔드 프록시"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              />
            </Stack>
            
            <Typography
              variant="body2"
              sx={{
                mt: 2,
                color: '#888888',
                fontSize: '0.9rem'
              }}
            >
              🔒 모든 민감한 정보는 백엔드에서 안전하게 관리됩니다
            </Typography>
          </Paper>
        </Box>
      </Container>
    </Box>
  )
}

export default WelcomeScreen 
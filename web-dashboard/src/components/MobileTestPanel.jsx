import React, { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Grid,
  Alert,
  Chip,
  IconButton,
  Collapse,
  useTheme,
  useMediaQuery,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material'
import {
  Send as SendIcon,
  PhoneAndroid,
  Tablet,
  Computer,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Error,
  Info,
  Notifications,
  Speed,
  Visibility
} from '@mui/icons-material'
import { sendTestNotification, notifySystemStatus } from '../utils/telegramNotification'

function MobileTestPanel() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'))
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))
  
  const [expanded, setExpanded] = useState(false)
  const [testResults, setTestResults] = useState({})
  const [loading, setLoading] = useState(false)

  // 현재 화면 크기 감지
  const getCurrentDevice = () => {
    if (isMobile) return { type: 'mobile', icon: <PhoneAndroid />, label: '모바일' }
    if (isTablet) return { type: 'tablet', icon: <Tablet />, label: '태블릿' }
    return { type: 'desktop', icon: <Computer />, label: '데스크톱' }
  }

  const device = getCurrentDevice()

  // 텔레그램 테스트 알림 전송
  const handleTestTelegram = async () => {
    setLoading(true)
    try {
      const success = await sendTestNotification()
      setTestResults(prev => ({
        ...prev,
        telegram: {
          success,
          message: success ? '텔레그램 알림이 성공적으로 전송되었습니다!' : '텔레그램 알림 전송에 실패했습니다.',
          timestamp: new Date().toLocaleString('ko-KR')
        }
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        telegram: {
          success: false,
          message: `오류: ${error.message}`,
          timestamp: new Date().toLocaleString('ko-KR')
        }
      }))
    }
    setLoading(false)
  }

  // 시스템 상태 알림 전송
  const handleSystemStatusTest = async () => {
    setLoading(true)
    try {
      const status = {
        isHealthy: true,
        apiConnected: true,
        strategyActive: true,
        memoryUsage: Math.floor(Math.random() * 30 + 40), // 40-70%
        cpuUsage: Math.floor(Math.random() * 20 + 10) // 10-30%
      }
      
      const success = await notifySystemStatus(status)
      setTestResults(prev => ({
        ...prev,
        systemStatus: {
          success,
          message: success ? '시스템 상태 알림이 전송되었습니다!' : '시스템 상태 알림 전송에 실패했습니다.',
          timestamp: new Date().toLocaleString('ko-KR')
        }
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        systemStatus: {
          success: false,
          message: `오류: ${error.message}`,
          timestamp: new Date().toLocaleString('ko-KR')
        }
      }))
    }
    setLoading(false)
  }

  // 반응형 테스트 항목들
  const responsiveTests = [
    {
      name: '네비게이션 메뉴',
      mobile: isMobile ? '햄버거 메뉴' : '가로 메뉴',
      status: isMobile ? 'success' : 'info'
    },
    {
      name: '대시보드 그리드',
      mobile: isMobile ? '1열 레이아웃' : '다중열 레이아웃',
      status: 'success'
    },
    {
      name: '차트 크기',
      mobile: '반응형 조정됨',
      status: 'success'
    },
    {
      name: '텍스트 크기',
      mobile: isMobile ? '모바일 최적화' : '데스크톱 크기',
      status: 'success'
    },
    {
      name: '버튼 크기',
      mobile: isMobile ? '터치 친화적' : '마우스 최적화',
      status: 'success'
    }
  ]

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">
              🧪 모바일 UI & 알림 테스트
            </Typography>
            <Chip 
              icon={device.icon} 
              label={device.label} 
              color="primary" 
              size="small" 
            />
          </Box>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Grid container spacing={2}>
            {/* 현재 화면 정보 */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    📱 현재 화면 정보
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><Visibility /></ListItemIcon>
                      <ListItemText 
                        primary="화면 크기" 
                        secondary={`${window.innerWidth} x ${window.innerHeight}px`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>{device.icon}</ListItemIcon>
                      <ListItemText 
                        primary="디바이스 타입" 
                        secondary={device.label} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Speed /></ListItemIcon>
                      <ListItemText 
                        primary="픽셀 비율" 
                        secondary={`${window.devicePixelRatio}x`} 
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* 반응형 테스트 결과 */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    📐 반응형 테스트 결과
                  </Typography>
                  <List dense>
                    {responsiveTests.map((test, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle color={test.status} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={test.name} 
                          secondary={test.mobile} 
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* 텔레그램 알림 테스트 */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    📱 텔레그램 알림 테스트
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
                      onClick={handleTestTelegram}
                      disabled={loading}
                      size={isMobile ? 'small' : 'medium'}
                    >
                      테스트 알림 전송
                    </Button>
                    
                    <Button
                      variant="outlined"
                      startIcon={loading ? <CircularProgress size={16} /> : <Notifications />}
                      onClick={handleSystemStatusTest}
                      disabled={loading}
                      size={isMobile ? 'small' : 'medium'}
                    >
                      시스템 상태 알림
                    </Button>
                  </Box>

                  {/* 테스트 결과 표시 */}
                  {Object.entries(testResults).map(([key, result]) => (
                    <Alert 
                      key={key}
                      severity={result.success ? 'success' : 'error'}
                      sx={{ mb: 1 }}
                      icon={result.success ? <CheckCircle /> : <Error />}
                    >
                      <Typography variant="body2">
                        <strong>{result.message}</strong>
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {result.timestamp}
                      </Typography>
                    </Alert>
                  ))}

                  {Object.keys(testResults).length === 0 && (
                    <Alert severity="info" icon={<Info />}>
                      위 버튼을 클릭하여 텔레그램 알림 기능을 테스트해보세요.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* 모바일 최적화 가이드 */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    📋 모바일 최적화 체크리스트
                  </Typography>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="success.main">
                        ✅ 반응형 네비게이션 (햄버거 메뉴)
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        ✅ 터치 친화적 버튼 크기
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        ✅ 모바일 최적화 타이포그래피
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="success.main">
                        ✅ 반응형 그리드 레이아웃
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        ✅ 스크롤 가능한 차트
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        ✅ 적응형 컴포넌트 크기
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  )
}

export default MobileTestPanel 
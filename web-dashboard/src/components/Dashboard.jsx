import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Avatar,
  Chip,
  Paper,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider
} from '@mui/material'
import {
  AccountCircle,
  TrendingUp,
  TrendingDown,
  Assessment,
  AutoAwesome,
  Settings,
  Logout,
  AccountBalance,
  ShowChart,
  Notifications
} from '@mui/icons-material'

function Dashboard({ user, onLogout, onShowNotification }) {
  console.log('📊 Material-UI Dashboard 컴포넌트 렌더링', user)
  
  const [currentTime, setCurrentTime] = useState(new Date())
  const [portfolioData, setPortfolioData] = useState({
    totalAssets: 15750000,
    todayProfit: 125000,
    totalProfit: user.totalProfit || 1250000,
    winRate: user.winRate || 78.5,
    positions: [
      { symbol: 'AAPL', name: '애플', quantity: 50, price: 185.20, profit: 5.2 },
      { symbol: 'TSLA', name: '테슬라', quantity: 25, price: 245.80, profit: -2.1 },
      { symbol: 'NVDA', name: '엔비디아', quantity: 30, price: 890.50, profit: 8.7 },
      { symbol: 'MSFT', name: '마이크로소프트', quantity: 40, price: 425.30, profit: 3.4 }
    ]
  })
  
  const [autoTradingStatus, setAutoTradingStatus] = useState({
    isActive: true,
    strategy: 'Christmas Special AI',
    performance: 'Excellent',
    lastAction: '5분 전 NVDA 매수'
  })
  
  // 실시간 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  const handleLogout = () => {
    console.log('🚪 Material-UI 로그아웃 버튼 클릭')
    if (onShowNotification) {
      onShowNotification('안전하게 로그아웃되었습니다. 👋', 'info')
    }
    setTimeout(() => {
      onLogout()
    }, 1000)
  }
  
  const handlePortfolioClick = () => {
    if (onShowNotification) {
      onShowNotification('📊 포트폴리오 상세 보기가 업데이트되었습니다!', 'success')
    }
  }
  
  const handleAutoTradingToggle = () => {
    const newStatus = !autoTradingStatus.isActive
    setAutoTradingStatus({
      ...autoTradingStatus,
      isActive: newStatus
    })
    
    if (onShowNotification) {
      onShowNotification(
        newStatus ? '🤖 자동매매가 활성화되었습니다!' : '⏸️ 자동매매가 일시정지되었습니다.', 
        newStatus ? 'success' : 'warning'
      )
    }
  }
  
  const handleSettingsClick = () => {
    if (onShowNotification) {
      onShowNotification('⚙️ 설정 페이지는 곧 출시됩니다!', 'info')
    }
  }
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }
  
  const formatPercent = (value) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }
  
  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'grey.100', minHeight: '100vh' }}>
      {/* 상단 앱바 */}
      <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}>
        <Toolbar>
          <Avatar sx={{ mr: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>🎄</Avatar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Christmas Trading Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              icon={<AccountCircle />}
              label={user.name}
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white' }}
            />
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              {currentTime.toLocaleString()}
            </Typography>
            <IconButton color="inherit" onClick={handleLogout}>
              <Logout />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* 상단 통계 카드 */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      총 자산
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {formatCurrency(portfolioData.totalAssets)}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <AccountBalance />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      오늘 수익
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color={portfolioData.todayProfit >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(portfolioData.todayProfit)}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: portfolioData.todayProfit >= 0 ? 'success.main' : 'error.main' }}>
                    {portfolioData.todayProfit >= 0 ? <TrendingUp /> : <TrendingDown />}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      승률
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="warning.main">
                      {portfolioData.winRate}%
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <Assessment />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      자동매매
                    </Typography>
                    <Chip 
                      label={autoTradingStatus.isActive ? '활성화' : '비활성화'}
                      color={autoTradingStatus.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Avatar sx={{ bgcolor: autoTradingStatus.isActive ? 'success.main' : 'grey.500' }}>
                    <AutoAwesome />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Grid container spacing={3}>
          {/* 포트폴리오 현황 */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    📊 포트폴리오 현황
                  </Typography>
                  <Button 
                    startIcon={<ShowChart />}
                    variant="outlined"
                    size="small"
                    onClick={handlePortfolioClick}
                  >
                    상세보기
                  </Button>
                </Box>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>종목</TableCell>
                        <TableCell align="right">수량</TableCell>
                        <TableCell align="right">현재가</TableCell>
                        <TableCell align="right">수익률</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {portfolioData.positions.map((position) => (
                        <TableRow key={position.symbol}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {position.symbol}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {position.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{position.quantity}</TableCell>
                          <TableCell align="right">${position.price.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              color={position.profit >= 0 ? 'success.main' : 'error.main'}
                              fontWeight="bold"
                            >
                              {formatPercent(position.profit)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* 자동매매 상태 */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  🤖 자동매매 상태
                </Typography>
                
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    현재 전략
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {autoTradingStatus.strategy}
                  </Typography>
                </Box>
                
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    성과
                  </Typography>
                  <Chip 
                    label={autoTradingStatus.performance}
                    color="success"
                    size="small"
                  />
                </Box>
                
                <Box mb={3}>
                  <Typography variant="body2" color="textSecondary">
                    마지막 활동
                  </Typography>
                  <Typography variant="body2">
                    {autoTradingStatus.lastAction}
                  </Typography>
                </Box>
                
                <Button
                  fullWidth
                  variant={autoTradingStatus.isActive ? "outlined" : "contained"}
                  color={autoTradingStatus.isActive ? "warning" : "success"}
                  onClick={handleAutoTradingToggle}
                  startIcon={<AutoAwesome />}
                >
                  {autoTradingStatus.isActive ? '일시정지' : '시작하기'}
                </Button>
              </CardContent>
            </Card>
            
            {/* 빠른 액션 */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  ⚡ 빠른 액션
                </Typography>
                
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      startIcon={<Assessment />}
                      onClick={handlePortfolioClick}
                    >
                      분석
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      startIcon={<Settings />}
                      onClick={handleSettingsClick}
                    >
                      설정
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* 시스템 정보 */}
        <Paper sx={{ p: 2, mt: 3, bgcolor: 'info.lighter' }}>
          <Typography variant="body2" color="info.main" textAlign="center">
            ✅ Phase 4-5-6 통합 완료 | 🎨 Material-UI | 🔔 알림 시스템 | 📊 완전한 기능 | 🔧 Supabase 제외 모드
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}

export default Dashboard 
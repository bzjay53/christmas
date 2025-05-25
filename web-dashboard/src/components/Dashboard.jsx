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
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  ButtonGroup,
  CardHeader
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
  Notifications,
  Dashboard as DashboardIcon,
  BarChart,
  SwapHoriz,
  Wallet,
  Lightbulb,
  ClipboardData,
  NotificationImportant,
  Help,
  Menu,
  CheckCircle,
  Warning,
  Error,
  AccessTime,
  ArrowUpward,
  ArrowDownward,
  Casino,
  Timeline
} from '@mui/icons-material'

const drawerWidth = 240

function Dashboard({ user, onLogout, onShowNotification }) {
  console.log('📊 Enhanced Dashboard 컴포넌트 렌더링', user)
  
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('weekly')
  
  // 풍부한 포트폴리오 데이터
  const [portfolioData, setPortfolioData] = useState({
    totalProfit: 2847000,
    profitChange: 12.5,
    totalOrders: 47,
    successRate: 87.2,
    activePositions: 8,
    avgHoldingTime: '4분 23초',
    totalAlerts: 15,
    criticalAlerts: 2,
    warningAlerts: 6,
    
    // 현재 포지션 상세
    currentPositions: [
      { symbol: 'AAPL', quantity: 50, entryPrice: 182.30, currentPrice: 185.20, profit: 1.59 },
      { symbol: 'TSLA', quantity: 25, entryPrice: 251.80, currentPrice: 245.80, profit: -2.38 },
      { symbol: 'NVDA', quantity: 30, entryPrice: 820.50, currentPrice: 890.50, profit: 8.53 },
      { symbol: 'MSFT', quantity: 40, entryPrice: 410.30, currentPrice: 425.30, profit: 3.66 },
      { symbol: 'GOOGL', quantity: 15, entryPrice: 138.90, currentPrice: 142.10, profit: 2.30 },
      { symbol: 'AMZN', quantity: 35, entryPrice: 144.20, currentPrice: 148.90, profit: 3.26 }
    ],
    
    // 최근 주문
    recentOrders: [
      { symbol: 'NVDA', side: '매수', price: 890.50, time: '14:23:12', profit: 8.53 },
      { symbol: 'TSLA', side: '매도', price: 245.80, time: '14:18:45', profit: -2.38 },
      { symbol: 'AAPL', side: '매수', price: 185.20, time: '14:15:22', profit: 1.59 },
      { symbol: 'MSFT', side: '매수', price: 425.30, time: '14:09:33', profit: 3.66 },
      { symbol: 'GOOGL', side: '매수', price: 142.10, time: '14:05:18', profit: 2.30 },
      { symbol: 'AMZN', side: '매도', price: 148.90, time: '14:01:45', profit: 3.26 }
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
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }
  
  const handleLogout = () => {
    console.log('🚪 Enhanced 로그아웃 버튼 클릭')
    if (onShowNotification) {
      onShowNotification('안전하게 로그아웃되었습니다. 👋', 'info')
    }
    setTimeout(() => {
      onLogout()
    }, 1000)
  }
  
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period)
    if (onShowNotification) {
      onShowNotification(`📊 ${period === 'daily' ? '일간' : period === 'weekly' ? '주간' : '월간'} 차트로 변경되었습니다!`, 'info')
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
    return `${sign}${value.toFixed(2)}%`
  }
  
  // 사이드바 메뉴 아이템들
  const menuItems = [
    { text: '대시보드', icon: <DashboardIcon />, active: true },
    { text: '성과 분석', icon: <BarChart /> },
    { text: '주문 내역', icon: <SwapHoriz /> },
    { text: '포트폴리오', icon: <Wallet /> },
    { text: '신호', icon: <Lightbulb /> },
    { text: '설정', icon: <Settings /> },
    { text: '백테스트', icon: <ClipboardData /> },
    { text: '알림', icon: <Notifications /> },
    { text: '도움말', icon: <Help /> }
  ]
  
  // 사이드바 컴포넌트
  const drawer = (
    <Box>
      <Toolbar>
        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>🎄</Avatar>
        <Typography variant="h6" noWrap component="div" color="primary" fontWeight="bold">
          Christmas
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item, index) => (
          <ListItem 
            button 
            key={item.text}
            sx={{ 
              bgcolor: item.active ? 'primary.light' : 'transparent',
              '&:hover': { bgcolor: 'primary.lighter' }
            }}
          >
            <ListItemIcon sx={{ color: item.active ? 'primary.main' : 'text.secondary' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{ color: item.active ? 'primary.main' : 'text.primary' }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  )
  
  return (
    <Box sx={{ display: 'flex' }}>
      {/* 상단 앱바 */}
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'linear-gradient(45deg, #1d3557 30%, #457b9d 90%)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <Menu />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Christmas Trading Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge badgeContent="✓" color="success">
              <Chip 
                label="시스템 정상"
                size="small"
                sx={{ color: 'white', borderColor: 'white' }}
                variant="outlined"
              />
            </Badge>
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
      
      {/* 사이드바 */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* 메인 컨텐츠 */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          bgcolor: '#f8f9fa',
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        
        {/* 페이지 헤더 */}
        <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold">대시보드</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip label="v1.0.0" color="primary" size="small" />
            <Typography variant="body2" color="text.secondary">
              최근 업데이트: {currentTime.toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        
        {/* 상단 통계 카드들 */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderLeft: '4px solid #4cc9f0' }}>
              <CardContent>
                <Box display="flex" justifyContent="between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      총 실현 수익
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      {formatCurrency(portfolioData.totalProfit)}
                    </Typography>
                    <Box mt={2}>
                      <Chip 
                        icon={<ArrowUpward />}
                        label={`${formatPercent(portfolioData.profitChange)} 지난 주 대비`}
                        size="small"
                        color="success"
                      />
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.main', width: 60, height: 60 }}>
                    <Casino fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderLeft: '4px solid #4895ef' }}>
              <CardContent>
                <Box display="flex" justifyContent="between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      오늘 주문
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {portfolioData.totalOrders}건
                    </Typography>
                    <Box mt={2}>
                      <Chip 
                        icon={<CheckCircle />}
                        label={`${portfolioData.successRate}% 성공률`}
                        size="small"
                        color="success"
                      />
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60 }}>
                    <SwapHoriz fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderLeft: '4px solid #4361ee' }}>
              <CardContent>
                <Box display="flex" justifyContent="between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      현재 포지션
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {portfolioData.activePositions}개
                    </Typography>
                    <Box mt={2}>
                      <Chip 
                        icon={<AccessTime />}
                        label={`${portfolioData.avgHoldingTime} 평균 보유시간`}
                        size="small"
                        color="info"
                      />
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: 'info.main', width: 60, height: 60 }}>
                    <Wallet fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderLeft: '4px solid #3f37c9' }}>
              <CardContent>
                <Box display="flex" justifyContent="between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      오늘 알림
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {portfolioData.totalAlerts}건
                    </Typography>
                    <Box mt={2} sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        label={`${portfolioData.criticalAlerts}개 중요`}
                        size="small"
                        color="error"
                      />
                      <Chip 
                        label={`${portfolioData.warningAlerts}개 경고`}
                        size="small"
                        color="warning"
                      />
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 60, height: 60 }}>
                    <NotificationImportant fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* 차트 및 최근 주문 섹션 */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader 
                title="성과 추이"
                action={
                  <ButtonGroup size="small">
                    <Button 
                      variant={selectedPeriod === 'daily' ? 'contained' : 'outlined'}
                      onClick={() => handlePeriodChange('daily')}
                    >
                      일간
                    </Button>
                    <Button 
                      variant={selectedPeriod === 'weekly' ? 'contained' : 'outlined'}
                      onClick={() => handlePeriodChange('weekly')}
                    >
                      주간
                    </Button>
                    <Button 
                      variant={selectedPeriod === 'monthly' ? 'contained' : 'outlined'}
                      onClick={() => handlePeriodChange('monthly')}
                    >
                      월간
                    </Button>
                  </ButtonGroup>
                }
              />
              <CardContent>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box textAlign="center">
                    <Timeline sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      📈 {selectedPeriod === 'daily' ? '일간' : selectedPeriod === 'weekly' ? '주간' : '월간'} 성과 차트
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Chart.js/ApexCharts 통합 예정
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="최근 주문" />
              <CardContent sx={{ p: 0 }}>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {portfolioData.recentOrders.slice(0, 6).map((order, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {order.symbol}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {order.time}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Box>
                              <Typography 
                                variant="body2" 
                                color={order.side === '매수' ? 'success.main' : 'error.main'}
                                fontWeight="bold"
                              >
                                {order.side}
                              </Typography>
                              <Typography variant="caption">
                                {formatCurrency(order.price)}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box textAlign="center" p={2}>
                  <Button size="small" color="primary">
                    모든 주문 보기
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* 포지션 및 전략 성과 섹션 */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="현재 포지션" />
              <CardContent sx={{ p: 0 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>종목</TableCell>
                        <TableCell align="right">수량</TableCell>
                        <TableCell align="right">진입가</TableCell>
                        <TableCell align="right">현재가</TableCell>
                        <TableCell align="right">손익</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {portfolioData.currentPositions.map((position) => (
                        <TableRow key={position.symbol} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {position.symbol}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{position.quantity}</TableCell>
                          <TableCell align="right">${position.entryPrice.toFixed(2)}</TableCell>
                          <TableCell align="right">${position.currentPrice.toFixed(2)}</TableCell>
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
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="전략 성과" />
              <CardContent>
                <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box textAlign="center">
                    <BarChart sx={{ fontSize: 80, color: 'secondary.main', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      📊 전략별 성과 분석
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ApexCharts 막대 그래프 예정
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* 시스템 정보 푸터 */}
        <Paper sx={{ p: 2, mt: 4, bgcolor: 'info.lighter' }}>
          <Typography variant="body2" color="info.main" textAlign="center">
            ✅ Enhanced UI/UX | 🎨 Material-UI | 📊 풍부한 대시보드 | 🔔 알림 시스템 | 📈 차트 통합 준비
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}

export default Dashboard 
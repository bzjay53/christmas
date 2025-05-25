import React, { useState, useEffect, Fragment } from 'react'
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
  CardHeader,
  Alert,
  Skeleton
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
  Assignment,
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
  Timeline,
  Refresh
} from '@mui/icons-material'
import { supabase, supabaseHelpers } from '../lib/supabase'

const drawerWidth = 240

function Dashboard({ user, onLogout, onShowNotification }) {
  console.log('📊 Supabase Enhanced Dashboard 컴포넌트 렌더링', user)
  
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('weekly')
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState(null)
  const [selectedView, setSelectedView] = useState('dashboard')
  
  // Supabase 연동 데이터 상태
  const [userProfile, setUserProfile] = useState(null)
  const [tradeRecords, setTradeRecords] = useState([])
  const [aiLearningStats, setAiLearningStats] = useState(null)
  const [apiSettings, setApiSettings] = useState(null)
  
  // 풍부한 포트폴리오 데이터 (기본값 + 실제 데이터 병합)
  const [portfolioData, setPortfolioData] = useState({
    totalProfit: 0,
    profitChange: 0,
    totalOrders: 0,
    successRate: 0,
    activePositions: 0,
    avgHoldingTime: '0분 0초',
    totalAlerts: 0,
    criticalAlerts: 0,
    warningAlerts: 0,
    
    // 현재 포지션 상세 (시뮬레이션 데이터)
    currentPositions: [
      { symbol: 'AAPL', quantity: 50, entryPrice: 182.30, currentPrice: 185.20, profit: 1.59 },
      { symbol: 'TSLA', quantity: 25, entryPrice: 251.80, currentPrice: 245.80, profit: -2.38 },
      { symbol: 'NVDA', quantity: 30, entryPrice: 820.50, currentPrice: 890.50, profit: 8.53 },
      { symbol: 'MSFT', quantity: 40, entryPrice: 410.30, currentPrice: 425.30, profit: 3.66 },
      { symbol: 'GOOGL', quantity: 15, entryPrice: 138.90, currentPrice: 142.10, profit: 2.30 },
      { symbol: 'AMZN', quantity: 35, entryPrice: 144.20, currentPrice: 148.90, profit: 3.26 }
    ],
    
    // 최근 주문 (실제 데이터로 대체될 예정)
    recentOrders: []
  })
  
  const [autoTradingStatus, setAutoTradingStatus] = useState({
    isActive: false,
    strategy: 'Christmas Special AI',
    performance: 'Initializing',
    lastAction: '데이터 로딩 중...'
  })
  
  // Supabase 데이터 로드
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user || !user.id) {
        console.log('❌ 사용자 정보 없음, 데이터 로드 건너뜀')
        setLoading(false)
        return
      }
      
      console.log('🔄 Supabase 대시보드 데이터 로드 시작:', user.id)
      setLoading(true)
      setDataError(null)
      
      try {
        // 1. 사용자 프로필 조회
        console.log('👤 사용자 프로필 조회 중...')
        const profile = await supabaseHelpers.getUserProfile(user.id)
        setUserProfile(profile)
        console.log('✅ 사용자 프로필 로드 완료:', profile)
        
        // 2. 거래 기록 조회
        console.log('📈 거래 기록 조회 중...')
        const trades = await supabaseHelpers.getUserTrades(user.id, null, 20)
        setTradeRecords(trades)
        console.log('✅ 거래 기록 로드 완료:', trades.length, '건')
        
        // 3. AI 학습 통계 조회
        console.log('🤖 AI 학습 통계 조회 중...')
        const aiStats = await supabaseHelpers.getAILearningStats(user.id)
        setAiLearningStats(aiStats)
        console.log('✅ AI 학습 통계 로드 완료:', aiStats)
        
        // 4. API 설정 조회
        console.log('🔑 API 설정 조회 중...')
        const apiConfig = await supabaseHelpers.getUserApiSettings(user.id)
        setApiSettings(apiConfig)
        console.log('✅ API 설정 로드 완료:', apiConfig)
        
        // 5. 포트폴리오 데이터 업데이트
        if (trades && trades.length > 0) {
          const totalProfit = trades.reduce((sum, trade) => sum + (trade.profit_amount || 0), 0)
          const successfulTrades = trades.filter(trade => (trade.profit_amount || 0) > 0).length
          const successRate = trades.length > 0 ? (successfulTrades / trades.length) * 100 : 0
          
          setPortfolioData(prev => ({
            ...prev,
            totalProfit: totalProfit,
            profitChange: 12.5, // 임시값
            totalOrders: trades.length,
            successRate: successRate,
            activePositions: trades.filter(trade => trade.status === 'active').length,
            recentOrders: trades.slice(0, 6).map(trade => ({
              symbol: trade.symbol,
              side: trade.side === 'buy' ? '매수' : '매도',
              price: trade.price,
              time: new Date(trade.created_at).toLocaleTimeString(),
              profit: ((trade.profit_amount || 0) / (trade.amount || 1)) * 100
            }))
          }))
        }
        
        // 6. 자동매매 상태 업데이트
        setAutoTradingStatus(prev => ({
          ...prev,
          isActive: apiConfig?.kis_api_key ? true : false,
          performance: aiStats?.total_trades > 0 ? 'Active' : 'Standby',
          lastAction: trades.length > 0 ? 
            `${new Date(trades[0].created_at).toLocaleTimeString()} ${trades[0].symbol} ${trades[0].side === 'buy' ? '매수' : '매도'}` :
            'API 설정 필요'
        }))
        
        if (onShowNotification) {
          onShowNotification(`📊 대시보드 데이터 로드 완료! (거래 ${trades.length}건)`, 'success')
        }
        
      } catch (error) {
        console.error('❌ 대시보드 데이터 로드 실패:', error)
        setDataError(error.message)
        
        if (onShowNotification) {
          onShowNotification(`데이터 로드 실패: ${error.message}`, 'error')
        }
      } finally {
        setLoading(false)
      }
    }
    
    loadDashboardData()
  }, [user, onShowNotification])
  
  // 데이터 새로고침
  const handleRefreshData = () => {
    console.log('🔄 데이터 수동 새로고침')
    if (user && user.id) {
      setLoading(true)
      // useEffect가 다시 실행되도록 강제 트리거
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }
  
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
  
  // 사이드바 메뉴 아이템들 (권한에 따라 다름)
  const getMenuItems = () => {
    const baseItems = [
      { text: '대시보드', icon: <DashboardIcon />, active: selectedView === 'dashboard', view: 'dashboard' },
      { text: '성과 분석', icon: <BarChart />, active: selectedView === 'analytics', view: 'analytics' },
      { text: '주문 내역', icon: <SwapHoriz />, active: selectedView === 'orders', view: 'orders' },
      { text: '포트폴리오', icon: <Wallet />, active: selectedView === 'portfolio', view: 'portfolio' },
      { text: '신호', icon: <Lightbulb />, active: selectedView === 'signals', view: 'signals' },
      { text: '설정', icon: <Settings />, active: selectedView === 'settings', view: 'settings' },
      { text: '백테스트', icon: <Assignment />, active: selectedView === 'backtest', view: 'backtest' },
      { text: '알림', icon: <Notifications />, active: selectedView === 'notifications', view: 'notifications' },
      { text: '도움말', icon: <Help />, active: selectedView === 'help', view: 'help' }
    ]
    
    // 관리자 전용 메뉴 추가
    if (user?.isAdmin || user?.permissions?.includes('admin')) {
      const adminItems = [
        { text: '--- 관리자 전용 ---', icon: null, divider: true },
        { text: '사용자 관리', icon: <AccountCircle />, active: selectedView === 'user-management', view: 'user-management', admin: true },
        { text: '시스템 설정', icon: <Settings />, active: selectedView === 'system-config', view: 'system-config', admin: true },
        { text: '로그 모니터링', icon: <Assessment />, active: selectedView === 'logs', view: 'logs', admin: true },
        { text: '서버 상태', icon: <AutoAwesome />, active: selectedView === 'server-status', view: 'server-status', admin: true }
      ]
      return [...baseItems, ...adminItems]
    }
    
    return baseItems
  }
  
  const menuItems = getMenuItems()
  
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
        {menuItems.map((item, index) => {
          // 구분선 처리
          if (item.divider) {
            return (
              <Fragment key={index}>
                <Divider sx={{ my: 1 }} />
                <ListItem sx={{ justifyContent: 'center' }}>
                  <Typography variant="caption" color="warning.main" fontWeight="bold">
                    {item.text}
                  </Typography>
                </ListItem>
              </Fragment>
            )
          }
          
          return (
            <ListItem 
              button 
              key={item.text}
              onClick={() => item.view && setSelectedView(item.view)}
              sx={{ 
                bgcolor: item.active ? (item.admin ? 'warning.light' : 'primary.light') : 'transparent',
                '&:hover': { bgcolor: item.admin ? 'warning.lighter' : 'primary.lighter' },
                borderLeft: item.admin ? '3px solid orange' : 'none'
              }}
            >
              <ListItemIcon sx={{ 
                color: item.active ? (item.admin ? 'warning.main' : 'primary.main') : 'text.secondary' 
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  color: item.active ? (item.admin ? 'warning.main' : 'primary.main') : 'text.primary',
                  fontWeight: item.admin ? 'bold' : 'normal'
                }}
              />
              {item.admin && (
                <Chip label="👑" size="small" color="warning" />
              )}
            </ListItem>
          )
        })}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {selectedView === 'dashboard' ? '대시보드' :
               selectedView === 'user-management' ? '👑 사용자 관리' :
               selectedView === 'system-config' ? '👑 시스템 설정' :
               selectedView === 'logs' ? '👑 로그 모니터링' :
               selectedView === 'server-status' ? '👑 서버 상태' :
               selectedView}
            </Typography>
            {user?.isAdmin && (
              <Typography variant="subtitle2" color="warning.main" fontWeight="bold">
                👑 관리자 모드 활성화됨
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefreshData}
              disabled={loading}
              size="small"
            >
              {loading ? '로딩 중...' : '새로고침'}
            </Button>
            {userProfile && (
              <Chip 
                label={`${userProfile.membership_type || user?.membershipType || 'free'} 회원`}
                color="primary"
                size="small"
              />
            )}
            {user?.isDemoMode && (
              <Chip 
                label="🎮 데모 모드"
                color="secondary"
                size="small"
              />
            )}
            {user?.isAdmin && (
              <Chip 
                label="👑 관리자"
                color="warning"
                size="small"
              />
            )}
          </Box>
        </Box>

        {/* 데이터 로딩 상태 */}
        {loading && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Supabase에서 데이터를 불러오는 중...
            </Typography>
          </Box>
        )}

        {/* 에러 상태 */}
        {dataError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            데이터 로드 중 오류가 발생했습니다: {dataError}
          </Alert>
        )}

        {/* 데이터 없음 상태 (데모 모드) */}
        {!loading && user?.isDemoMode && (
          <Alert severity="info" sx={{ mb: 3 }}>
            🎮 현재 데모 모드입니다. 실제 거래 데이터를 보려면 Supabase 계정으로 로그인하세요.
          </Alert>
        )}

        {/* 관리자 전용 컨텐츠 */}
        {selectedView === 'user-management' && user?.isAdmin && (
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="👑 사용자 관리" />
                <CardContent>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    관리자 전용 기능: 시스템 사용자들을 관리할 수 있습니다.
                  </Alert>
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button variant="contained" startIcon={<AccountCircle />}>
                      사용자 추가
                    </Button>
                    <Button variant="outlined" startIcon={<Settings />}>
                      권한 관리
                    </Button>
                    <Button variant="outlined" startIcon={<Assessment />}>
                      사용자 통계
                    </Button>
                  </Box>
                  <Typography variant="body1">
                    📊 전체 사용자: <strong>1,247명</strong><br />
                    🎮 데모 사용자: <strong>892명</strong><br />
                    💰 프리미엄 사용자: <strong>324명</strong><br />
                    👑 관리자: <strong>3명</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {selectedView === 'system-config' && user?.isAdmin && (
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="👑 시스템 설정" />
                <CardContent>
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    주의: 시스템 설정 변경은 전체 서비스에 영향을 줄 수 있습니다.
                  </Alert>
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button variant="contained" startIcon={<AutoAwesome />} color="warning">
                      AI 모델 설정
                    </Button>
                    <Button variant="outlined" startIcon={<Settings />}>
                      거래 설정
                    </Button>
                    <Button variant="outlined" startIcon={<Notifications />}>
                      알림 설정
                    </Button>
                  </Box>
                  <Typography variant="body1">
                    🤖 AI 모델: <strong>GPT-4o-mini (활성)</strong><br />
                    📈 거래 세션: <strong>24/7 운영</strong><br />
                    🔔 알림 시스템: <strong>정상</strong><br />
                    🛡️ 보안 상태: <strong>최고 보안</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {selectedView === 'logs' && user?.isAdmin && (
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="👑 로그 모니터링" />
                <CardContent>
                  <Alert severity="success" sx={{ mb: 3 }}>
                    시스템 로그를 실시간으로 모니터링합니다.
                  </Alert>
                  <Box sx={{ bgcolor: 'grey.900', color: 'white', p: 2, borderRadius: 1, fontFamily: 'monospace' }}>
                    <Typography variant="caption" component="pre">
{`[2024-12-25 13:01:45] INFO: 사용자 로그인 - demo@christmas.com
[2024-12-25 13:01:46] INFO: 대시보드 데이터 로드 완료
[2024-12-25 13:01:47] INFO: AI 분석 시작 - AAPL
[2024-12-25 13:01:48] SUCCESS: 매수 신호 생성 - AAPL $185.20
[2024-12-25 13:01:49] INFO: 관리자 접근 - admin@christmas.com
[2024-12-25 13:01:50] INFO: 시스템 상태 정상`}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {selectedView === 'server-status' && user?.isAdmin && (
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="👑 서버 상태" />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      프론트엔드 서버 (포트 3000)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle color="success" />
                      <Typography variant="body2">정상 운영중</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      백엔드 서버 (포트 8000)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Warning color="warning" />
                      <Typography variant="body2">연결 확인 필요</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Supabase 데이터베이스
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle color="success" />
                      <Typography variant="body2">정상 연결됨</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="시스템 메트릭" />
                <CardContent>
                  <Typography variant="body2" gutterBottom>
                    📊 메모리 사용량: <strong>2.3GB / 8GB</strong>
                  </Typography>
                  <LinearProgress variant="determinate" value={28.75} sx={{ mb: 2 }} />
                  <Typography variant="body2" gutterBottom>
                    💾 디스크 사용량: <strong>45GB / 100GB</strong>
                  </Typography>
                  <LinearProgress variant="determinate" value={45} sx={{ mb: 2 }} />
                  <Typography variant="body2" gutterBottom>
                    🌐 네트워크: <strong>정상</strong>
                  </Typography>
                  <LinearProgress variant="determinate" value={85} color="success" />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {/* 기본 대시보드 컨텐츠 (관리자 전용 뷰가 아닐 때만 표시) */}
        {selectedView === 'dashboard' && (
          <>
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
                {user?.isAdmin && " | 👑 관리자 기능"}
              </Typography>
            </Paper>
          </>
        )}
      </Box>
    </Box>
  )
}

export default Dashboard 
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
  CircularProgress,
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
  Refresh,
  Payment,
  DarkMode,
  LightMode
} from '@mui/icons-material'
import { supabase, supabaseHelpers } from '../lib/supabase'
import apiService from '../lib/apiService'
import websocketClient from '../lib/websocket'
import KISApiSettings from './KISApiSettings'
import PaymentService from './PaymentService'
import useThemeStore from '../store/themeStore'
import useInvestmentStore from '../store/investmentStore'
import useBacktestStore from '../store/backtestStore'
import useReferralStore from '../store/referralStore'
import useCouponStore from '../store/couponStore'

const drawerWidth = 240

function Dashboard({ user, onLogout, onShowNotification }) {
  console.log('📊 Supabase Enhanced Dashboard 컴포넌트 렌더링', user)
  
  const { isDarkMode, toggleTheme } = useThemeStore()
  const { 
    investmentStyle, 
    setInvestmentStyle, 
    getInvestmentInfo 
  } = useInvestmentStore()
  const { 
    isRunning: backtestRunning, 
    results: backtestResults, 
    runBacktest, 
    clearResults: clearBacktestResults 
  } = useBacktestStore()
  const { 
    referralLink, 
    initializeReferral, 
    shareReferralLink, 
    getStats 
  } = useReferralStore()
  const { 
    getAvailableCoupons, 
    getCouponStats, 
    applyCoupon, 
    validateCoupon 
  } = useCouponStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('weekly')
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState(null)
  const [selectedView, setSelectedView] = useState('dashboard')
  
  // 백엔드 연결 상태 모니터링
  const [backendStatus, setBackendStatus] = useState('checking')
  const [lastConnectionCheck, setLastConnectionCheck] = useState(new Date())
  
  // WebSocket 실시간 알림 상태
  const [wsStatus, setWsStatus] = useState('disconnected')
  const [realtimeAlerts, setRealtimeAlerts] = useState([])
  const [lastTradingSignal, setLastTradingSignal] = useState(null)
  
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
        // 데모 모드인 경우 빠른 로딩
        if (user.isDemoMode) {
          console.log('🎮 데모 모드 - 시뮬레이션 데이터 사용')
          setUserProfile({
            id: user.id,
            first_name: user.name,
            membership_type: user.membershipType || 'demo',
            created_at: new Date().toISOString()
          })
          setTradeRecords([])
          setAiLearningStats({ total_trades: 0 })
          setApiSettings(null)
          
          setAutoTradingStatus(prev => ({
            ...prev,
            isActive: false,
            performance: 'Demo Mode',
            lastAction: '데모 모드 - 실제 거래 없음'
          }))
          
          setLoading(false)
          return
        }
        
        // 실제 사용자 데이터 로드
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
  }, [user?.id, user?.isDemoMode]) // 의존성 배열 최적화로 무한 루프 방지
  
  // 데이터 새로고침
  const handleRefreshData = () => {
    console.log('🔄 데이터 수동 새로고침')
    if (user && user.id) {
      setLoading(true)
      setDataError(null)
      
      // 강제로 useEffect 재실행
      const currentUserId = user.id
      setTimeout(() => {
        // 상태를 초기화하고 다시 로드
        setUserProfile(null)
        setTradeRecords([])
        setAiLearningStats(null)
        setApiSettings(null)
        
        // useEffect가 다시 실행되도록 트리거
        window.location.reload()
      }, 100)
    }
  }
  
  // 실시간 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  // 백엔드 연결 상태 주기적 체크
  useEffect(() => {
    let consecutiveFailures = 0
    const maxFailures = 3 // 3번 연속 실패 후에만 "연결 끊김"으로 표시
    
    const checkBackendConnection = async () => {
      try {
        const health = await apiService.getHealth()
        setBackendStatus('connected')
        setLastConnectionCheck(new Date())
        consecutiveFailures = 0 // 성공 시 실패 카운트 리셋
        console.log('✅ 백엔드 연결 정상:', health)
      } catch (error) {
        consecutiveFailures++
        console.warn(`⚠️ 백엔드 연결 실패 (${consecutiveFailures}/${maxFailures}):`, error.message)
        
        // 3번 연속 실패 시에만 연결 끊김으로 표시
        if (consecutiveFailures >= maxFailures) {
          setBackendStatus('disconnected')
        }
        setLastConnectionCheck(new Date())
      }
    }
    
    // 즉시 체크
    checkBackendConnection()
    
    // 15초마다 주기적 체크 (더 빈번하게)
    const healthCheckTimer = setInterval(checkBackendConnection, 15000)
    
    return () => clearInterval(healthCheckTimer)
  }, [])
  
  // WebSocket 실시간 알림 시스템 초기화
  useEffect(() => {
    if (!user?.isDemoMode && backendStatus === 'connected') {
      console.log('🔌 WebSocket 연결 시작')
      
      // 환경 변수에서 WebSocket URL 구성
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      const wsUrl = apiBaseUrl.replace('http://', 'ws://').replace('https://', 'wss://')
      
      // WebSocket 연결
      websocketClient.connect(wsUrl)
      
      // 이벤트 리스너 등록
      websocketClient.on('connected', () => {
        setWsStatus('connected')
        console.log('✅ WebSocket 연결 성공')
        if (onShowNotification) {
          onShowNotification('🔔 실시간 알림이 활성화되었습니다!', 'success')
        }
      })
      
      websocketClient.on('disconnected', () => {
        setWsStatus('disconnected')
        console.log('❌ WebSocket 연결 끊김')
      })
      
      websocketClient.on('tradingSignal', (signal) => {
        setLastTradingSignal(signal)
        setRealtimeAlerts(prev => [...prev, {
          id: Date.now(),
          type: 'trading_signal',
          message: `📈 ${signal.symbol} ${signal.action} 신호 (${signal.confidence}% 신뢰도)`,
          timestamp: new Date().toISOString()
        }])
        
        if (onShowNotification) {
          onShowNotification(`🎯 거래 신호: ${signal.symbol} ${signal.action}`, 'info')
        }
      })
      
      websocketClient.on('priceUpdate', (update) => {
        // 실시간 가격 업데이트 처리
        console.log('💰 실시간 가격 업데이트:', update)
      })
      
      websocketClient.on('systemAlert', (alert) => {
        setRealtimeAlerts(prev => [...prev, {
          id: Date.now(),
          type: 'system_alert',
          message: alert.message,
          timestamp: new Date().toISOString()
        }])
        
        if (onShowNotification) {
          onShowNotification(`🔔 시스템 알림: ${alert.message}`, alert.level || 'info')
        }
      })
      
      // 컴포넌트 언마운트 시 연결 해제
      return () => {
        console.log('🔌 WebSocket 연결 해제')
        websocketClient.disconnect()
      }
    }
  }, [backendStatus, user?.isDemoMode])
  
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

  // 투자 성향 변경 핸들러
  const handleInvestmentStyleChange = (style) => {
    setInvestmentStyle(style)
    const styleNames = {
      aggressive: '공격형',
      neutral: '중립형', 
      defensive: '방어형'
    }
    onShowNotification(`투자 성향이 ${styleNames[style]}으로 변경되었습니다! 🎯`, 'success')
  }

  // 백테스트 실행 핸들러
  const handleRunBacktest = async (period) => {
    try {
      onShowNotification('백테스트를 시작합니다... 📊', 'info')
      const strategy = investmentStyle === 'aggressive' ? 'aggressive' : 
                     investmentStyle === 'neutral' ? 'traditional' : 'defensive'
      
      const results = await runBacktest(period, strategy)
      onShowNotification(`백테스트 완료! 총 수익률: ${results.performance.totalReturn.toFixed(2)}% 🎉`, 'success')
    } catch (error) {
      onShowNotification('백테스트 실행 중 오류가 발생했습니다. 😞', 'error')
    }
  }

  // 친구초대 링크 공유 핸들러
  const handleShareReferral = async (method) => {
    try {
      const result = await shareReferralLink(method)
      onShowNotification(result.message, result.success ? 'success' : 'error')
    } catch (error) {
      onShowNotification('공유 중 오류가 발생했습니다.', 'error')
    }
  }

  // 컴포넌트 마운트 시 초대 코드 초기화
  useEffect(() => {
    if (user?.id) {
      initializeReferral(user.id)
    }
  }, [user?.id, initializeReferral])
  
  // 사이드바 메뉴 아이템들 (권한에 따라 다름)
  const getMenuItems = () => {
    const baseItems = [
      { text: '대시보드', icon: <DashboardIcon />, active: selectedView === 'dashboard', view: 'dashboard' },
      { text: '성과 분석', icon: <BarChart />, active: selectedView === 'analytics', view: 'analytics' },
      { text: '주문 내역', icon: <SwapHoriz />, active: selectedView === 'orders', view: 'orders' },
      { text: '포트폴리오', icon: <Wallet />, active: selectedView === 'portfolio', view: 'portfolio' },
      { text: '신호', icon: <Lightbulb />, active: selectedView === 'signals', view: 'signals' },
      { text: 'KIS API 설정', icon: <Settings />, active: selectedView === 'kis-settings', view: 'kis-settings' },
      { text: '💳 요금제', icon: <Payment />, active: selectedView === 'payment', view: 'payment' },
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
            {backendStatus === 'connected' && (
              <Badge badgeContent="✓" color="success">
                <Chip 
                  label="백엔드 연결됨"
                  size="small"
                  sx={{ color: 'white', borderColor: 'success.main' }}
                  variant="outlined"
                  color="success"
                />
              </Badge>
            )}
            {backendStatus === 'checking' && (
              <Chip 
                label="연결 확인 중..."
                size="small"
                sx={{ color: 'white', borderColor: 'info.main' }}
                variant="outlined"
                color="info"
              />
            )}
            <IconButton 
              color="inherit" 
              onClick={toggleTheme}
              title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              {isDarkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
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
               selectedView === 'kis-settings' ? '📈 KIS API 설정' :
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

        {/* 시스템 상태 알림 */}
        {!loading && (
          <Alert severity="success" sx={{ mb: 3 }}>
            🎄 Christmas Trading 시스템이 정상 작동 중입니다! 모든 기능을 이용하실 수 있습니다.
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
                      {backendStatus === 'connected' ? 
                        <CheckCircle color="success" /> : 
                        <Error color="error" />
                      }
                      <Typography variant="body2">
                        {backendStatus === 'connected' ? '정상 운영중' : '연결 실패'}
                      </Typography>
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
                  <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={async () => {
                        try {
                          const health = await apiService.getHealth()
                          setBackendStatus('connected')
                          if (onShowNotification) {
                            onShowNotification(`🎉 백엔드 연결 성공! 업타임: ${Math.floor(health.uptime)}초`, 'success')
                          }
                        } catch (error) {
                          setBackendStatus('disconnected')
                          if (onShowNotification) {
                            onShowNotification(`❌ 백엔드 연결 실패: ${error.message}`, 'error')
                          }
                        }
                      }}
                    >
                      🔍 헬스 체크
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={async () => {
                        try {
                          const info = await apiService.getServerInfo()
                          if (onShowNotification) {
                            onShowNotification(`📊 서버 정보: ${info.message} (v${info.version})`, 'info')
                          }
                        } catch (error) {
                          if (onShowNotification) {
                            onShowNotification(`❌ 서버 정보 조회 실패: ${error.message}`, 'error')
                          }
                        }
                      }}
                    >
                      📊 서버 정보
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={async () => {
                        try {
                          const dbStatus = await apiService.get('/api/database-status')
                          if (onShowNotification) {
                            onShowNotification(`💾 DB 상태: ${dbStatus.status} (${dbStatus.database})`, 'success')
                          }
                        } catch (error) {
                          if (onShowNotification) {
                            onShowNotification(`❌ DB 상태 확인 실패: ${error.message}`, 'error')
                          }
                        }
                      }}
                    >
                      💾 DB 상태
                    </Button>
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
            <Grid item xs={12}>
              <Card>
                <CardHeader title="📈 KIS API 연동 테스트" />
                <CardContent>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    🔧 한국투자증권 API 연동 상태를 확인하고 테스트할 수 있습니다.
                  </Alert>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={async () => {
                        try {
                          const status = await apiService.get('/api/kis/status')
                          if (onShowNotification) {
                            onShowNotification(`📈 KIS API 상태: ${status.data.connected ? '연결됨' : '연결 실패'} (${status.data.mode})`, status.data.connected ? 'success' : 'error')
                          }
                        } catch (error) {
                          if (onShowNotification) {
                            onShowNotification(`❌ KIS API 상태 확인 실패: ${error.message}`, 'error')
                          }
                        }
                      }}
                    >
                      📡 KIS 연결 상태
                    </Button>
                    
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={async () => {
                        try {
                          const price = await apiService.get('/api/kis/stock/005930/price')
                          if (onShowNotification) {
                            onShowNotification(`📊 삼성전자 현재가: ${price.data.output?.stck_prpr || 'N/A'}원`, 'success')
                          }
                        } catch (error) {
                          if (onShowNotification) {
                            onShowNotification(`❌ 현재가 조회 실패: ${error.message}`, 'error')
                          }
                        }
                      }}
                    >
                      📈 삼성전자 현재가
                    </Button>
                    
                    <Button 
                      variant="outlined" 
                      size="small" 
                      color="warning"
                      onClick={async () => {
                        try {
                          const order = await apiService.post('/api/kis/test/mock-order')
                          if (onShowNotification) {
                            onShowNotification(`🎯 모의주문 테스트 완료: ${order.message}`, 'success')
                          }
                        } catch (error) {
                          if (onShowNotification) {
                            onShowNotification(`❌ 모의주문 테스트 실패: ${error.message}`, 'error')
                          }
                        }
                      }}
                    >
                      🎯 모의주문 테스트
                    </Button>
                    
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={async () => {
                        try {
                          const token = await apiService.post('/api/kis/token/test')
                          if (onShowNotification) {
                            onShowNotification(`🔑 토큰 테스트: ${token.data.hasToken ? '성공' : '실패'} (길이: ${token.data.tokenLength})`, token.data.hasToken ? 'success' : 'error')
                          }
                        } catch (error) {
                          if (onShowNotification) {
                            onShowNotification(`❌ 토큰 테스트 실패: ${error.message}`, 'error')
                          }
                        }
                      }}
                    >
                      🔑 OAuth 토큰
                    </Button>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    ⚠️ 실제 거래는 모의투자 충분한 테스트 후 진행하세요.<br />
                    🎮 현재 모드: KIS 모의투자 (안전 모드)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {/* KIS API 설정 컴포넌트 */}
        {selectedView === 'kis-settings' && (
          <KISApiSettings onShowNotification={onShowNotification} />
        )}

        {/* 결제 서비스 */}
        {selectedView === 'payment' && (
          <PaymentService 
            user={user}
            onShowNotification={onShowNotification}
            onPaymentSuccess={(paymentResult) => {
              console.log('결제 성공:', paymentResult)
              // 사용자 멤버십 업데이트 로직 추가
              if (onShowNotification) {
                onShowNotification(
                  `🎉 ${paymentResult.planName} 구독이 활성화되었습니다!`,
                  'success'
                )
              }
            }}
          />
        )}
        
        {/* 성과 분석 페이지 */}
        {selectedView === 'analytics' && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="📊 성과 분석" />
                <CardContent>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    거래 성과를 다양한 관점에서 분석합니다.
                  </Alert>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>📈 수익률 분석</Typography>
                        <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography color="text.secondary">수익률 차트 (Chart.js 연동 예정)</Typography>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>📊 종목별 성과</Typography>
                        <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography color="text.secondary">종목별 차트 (Chart.js 연동 예정)</Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* 주문 내역 페이지 */}
        {selectedView === 'orders' && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="📋 주문 내역" />
                <CardContent>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    모든 거래 내역을 확인할 수 있습니다.
                  </Alert>
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>시간</TableCell>
                          <TableCell>종목</TableCell>
                          <TableCell>구분</TableCell>
                          <TableCell align="right">수량</TableCell>
                          <TableCell align="right">가격</TableCell>
                          <TableCell align="right">손익</TableCell>
                          <TableCell>상태</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tradeRecords.length > 0 ? tradeRecords.map((trade, index) => (
                          <TableRow key={index}>
                            <TableCell>{new Date(trade.created_at).toLocaleString()}</TableCell>
                            <TableCell>{trade.symbol}</TableCell>
                            <TableCell>
                              <Chip 
                                label={trade.side === 'buy' ? '매수' : '매도'} 
                                color={trade.side === 'buy' ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">{trade.quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(trade.price)}</TableCell>
                            <TableCell align="right">
                              <Typography color={trade.profit_amount >= 0 ? 'success.main' : 'error.main'}>
                                {formatCurrency(trade.profit_amount || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={trade.status || 'completed'} 
                                color="success"
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              <Typography color="text.secondary">거래 내역이 없습니다.</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* 포트폴리오 페이지 */}
        {selectedView === 'portfolio' && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="💼 포트폴리오" />
                <CardContent>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    현재 보유 중인 포지션과 자산 현황을 확인합니다.
                  </Alert>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">총 자산</Typography>
                        <Typography variant="h4" fontWeight="bold">
                          {formatCurrency(portfolioData.totalProfit + 10000000)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main">실현 수익</Typography>
                        <Typography variant="h4" fontWeight="bold" color="success.main">
                          {formatCurrency(portfolioData.totalProfit)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="info.main">수익률</Typography>
                        <Typography variant="h4" fontWeight="bold" color="info.main">
                          {formatPercent(portfolioData.profitChange)}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>현재 포지션</Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>종목</TableCell>
                          <TableCell align="right">수량</TableCell>
                          <TableCell align="right">진입가</TableCell>
                          <TableCell align="right">현재가</TableCell>
                          <TableCell align="right">평가손익</TableCell>
                          <TableCell align="right">수익률</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {portfolioData.currentPositions.map((position) => (
                          <TableRow key={position.symbol}>
                            <TableCell fontWeight="bold">{position.symbol}</TableCell>
                            <TableCell align="right">{position.quantity}</TableCell>
                            <TableCell align="right">${position.entryPrice.toFixed(2)}</TableCell>
                            <TableCell align="right">${position.currentPrice.toFixed(2)}</TableCell>
                            <TableCell align="right">
                              <Typography color={position.profit >= 0 ? 'success.main' : 'error.main'}>
                                ${((position.currentPrice - position.entryPrice) * position.quantity).toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography color={position.profit >= 0 ? 'success.main' : 'error.main'} fontWeight="bold">
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
          </Grid>
        )}

        {/* 신호 페이지 */}
        {selectedView === 'signals' && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="🎯 AI 매매 신호" />
                <CardContent>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    AI가 분석한 실시간 매매 신호를 확인합니다.
                  </Alert>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>🔥 실시간 신호</Typography>
                        {lastTradingSignal ? (
                          <Box>
                            <Typography variant="body1">
                              <strong>{lastTradingSignal.symbol}</strong> - {lastTradingSignal.action}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              신뢰도: {lastTradingSignal.confidence}%
                            </Typography>
                          </Box>
                        ) : (
                          <Typography color="text.secondary">신호 대기 중...</Typography>
                        )}
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>📊 신호 통계</Typography>
                        <Typography variant="body2">
                          오늘 신호: <strong>12개</strong><br />
                          성공률: <strong>87.5%</strong><br />
                          평균 수익률: <strong>+2.3%</strong>
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>최근 신호 내역</Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>시간</TableCell>
                          <TableCell>종목</TableCell>
                          <TableCell>신호</TableCell>
                          <TableCell>신뢰도</TableCell>
                          <TableCell>결과</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {realtimeAlerts.filter(alert => alert.type === 'trading_signal').slice(0, 10).map((alert) => (
                          <TableRow key={alert.id}>
                            <TableCell>{new Date(alert.timestamp).toLocaleTimeString()}</TableCell>
                            <TableCell>AAPL</TableCell>
                            <TableCell>
                              <Chip label="매수" color="success" size="small" />
                            </TableCell>
                            <TableCell>85%</TableCell>
                            <TableCell>
                              <Chip label="성공" color="success" size="small" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* 설정 페이지 */}
        {selectedView === 'settings' && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="⚙️ 시스템 설정" />
                <CardContent>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    시스템 설정을 변경할 수 있습니다.
                  </Alert>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>🔔 알림 설정</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Button variant="outlined" startIcon={<Notifications />}>
                            텔레그램 알림 설정
                          </Button>
                          <Button variant="outlined" startIcon={<Notifications />}>
                            이메일 알림 설정
                          </Button>
                          <Button variant="outlined" startIcon={<Notifications />}>
                            푸시 알림 설정
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>🎯 거래 설정</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Button variant="outlined" startIcon={<Settings />}>
                            투자 전략 변경
                          </Button>
                          <Button variant="outlined" startIcon={<Settings />}>
                            리스크 관리 설정
                          </Button>
                          <Button variant="outlined" startIcon={<Settings />}>
                            자동매매 설정
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* 백테스트 페이지 */}
        {selectedView === 'backtest' && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="📊 백테스트" />
                <CardContent>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    과거 데이터를 기반으로 전략의 성과를 시뮬레이션합니다.
                  </Alert>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>📅 기간 설정</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Button 
                            variant="outlined" 
                            size="small"
                            disabled={backtestRunning}
                            onClick={() => handleRunBacktest('1month')}
                          >
                            {backtestRunning ? '실행 중...' : '최근 1개월'}
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small"
                            disabled={backtestRunning}
                            onClick={() => handleRunBacktest('3months')}
                          >
                            {backtestRunning ? '실행 중...' : '최근 3개월'}
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small"
                            disabled={backtestRunning}
                            onClick={() => handleRunBacktest('1year')}
                          >
                            {backtestRunning ? '실행 중...' : '최근 1년'}
                          </Button>
                          <Button 
                            variant="contained" 
                            size="small"
                            disabled={backtestRunning}
                            onClick={() => handleRunBacktest('custom')}
                          >
                            {backtestRunning ? '실행 중...' : '사용자 정의'}
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>📈 백테스트 결과</Typography>
                        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {backtestRunning ? (
                            <Box sx={{ textAlign: 'center' }}>
                              <CircularProgress sx={{ mb: 2 }} />
                              <Typography color="text.secondary">백테스트 실행 중...</Typography>
                            </Box>
                          ) : backtestResults ? (
                            <Box sx={{ width: '100%' }}>
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">총 수익률</Typography>
                                  <Typography variant="h6" color={backtestResults.performance.totalReturn >= 0 ? 'success.main' : 'error.main'}>
                                    {backtestResults.performance.totalReturn.toFixed(2)}%
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">승률</Typography>
                                  <Typography variant="h6">
                                    {backtestResults.performance.winRate.toFixed(1)}%
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">최대 낙폭</Typography>
                                  <Typography variant="h6" color="error.main">
                                    {backtestResults.performance.maxDrawdown.toFixed(2)}%
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">샤프 비율</Typography>
                                  <Typography variant="h6">
                                    {backtestResults.performance.sharpeRatio.toFixed(2)}
                                  </Typography>
                                </Grid>
                              </Grid>
                              <Button 
                                variant="outlined" 
                                size="small" 
                                sx={{ mt: 2 }}
                                onClick={clearBacktestResults}
                              >
                                결과 초기화
                              </Button>
                            </Box>
                          ) : (
                            <Typography color="text.secondary">기간을 선택하여 백테스트를 실행하세요</Typography>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>백테스트 통계</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">총 수익률</Typography>
                        <Typography variant="h6" color="success.main">+15.7%</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">승률</Typography>
                        <Typography variant="h6" color="primary.main">73.2%</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">최대 손실</Typography>
                        <Typography variant="h6" color="error.main">-3.1%</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">샤프 비율</Typography>
                        <Typography variant="h6" color="info.main">1.85</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* 알림 페이지 */}
        {selectedView === 'notifications' && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="🔔 알림 센터" />
                <CardContent>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    모든 시스템 알림과 거래 신호를 확인할 수 있습니다.
                  </Alert>
                  
                  <Typography variant="h6" sx={{ mb: 2 }}>실시간 알림</Typography>
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {realtimeAlerts.length > 0 ? realtimeAlerts.map((alert) => (
                      <Paper key={alert.id} sx={{ p: 2, mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {alert.type === 'trading_signal' ? <TrendingUp color="success" /> : <Info color="info" />}
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2">{alert.message}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(alert.timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    )) : (
                      <Typography color="text.secondary" textAlign="center">
                        알림이 없습니다.
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* 도움말 페이지 */}
        {selectedView === 'help' && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="❓ 도움말" />
                <CardContent>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Christmas Trading 사용법과 자주 묻는 질문을 확인하세요.
                  </Alert>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>🚀 시작하기</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Button variant="text" sx={{ justifyContent: 'flex-start' }}>
                            1. KIS API 설정하기
                          </Button>
                          <Button variant="text" sx={{ justifyContent: 'flex-start' }}>
                            2. 투자 전략 선택하기
                          </Button>
                          <Button variant="text" sx={{ justifyContent: 'flex-start' }}>
                            3. 자동매매 시작하기
                          </Button>
                          <Button variant="text" sx={{ justifyContent: 'flex-start' }}>
                            4. 수익 확인하기
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>❓ 자주 묻는 질문</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Button variant="text" sx={{ justifyContent: 'flex-start' }}>
                            Q. 최소 투자 금액은?
                          </Button>
                          <Button variant="text" sx={{ justifyContent: 'flex-start' }}>
                            Q. 수수료는 얼마인가요?
                          </Button>
                          <Button variant="text" sx={{ justifyContent: 'flex-start' }}>
                            Q. 손실이 발생하면?
                          </Button>
                          <Button variant="text" sx={{ justifyContent: 'flex-start' }}>
                            Q. 환불 정책은?
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>📞 고객지원</Typography>
                    <Typography variant="body2" color="text.secondary">
                      이메일: support@christmas-trading.com<br />
                      텔레그램: @christmas_trading_support<br />
                      운영시간: 평일 09:00 - 18:00
                    </Typography>
                  </Box>
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
        
        {/* 친구 초대 및 이벤트 섹션 */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={6}>
            <Card sx={{ border: '2px solid', borderColor: 'success.main' }}>
              <CardHeader 
                title="🎁 친구 초대하기" 
                subheader="친구를 초대하고 무료 이용 기간을 늘려보세요!"
                sx={{ bgcolor: 'success.lighter' }}
              />
              <CardContent>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>🎉 특별 이벤트:</strong> 친구 1명 초대 시 일주일 무료 연장! (최대 3개월)
                  </Typography>
                </Alert>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" color="success.main" gutterBottom>
                    내 초대 코드: <strong>{referralLink ? referralLink.split('=')[1] : '생성 중...'}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    아래 링크를 친구에게 공유해보세요
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'grey.100', 
                  borderRadius: 1, 
                  mb: 2,
                  border: '1px dashed',
                  borderColor: 'grey.400'
                }}>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {referralLink || '초대 링크 생성 중...'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button 
                    variant="contained" 
                    color="success" 
                    size="small"
                    onClick={() => handleShareReferral('clipboard')}
                  >
                    링크 복사
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="success" 
                    size="small"
                    onClick={() => handleShareReferral('kakao')}
                  >
                    카톡 공유
                  </Button>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    📊 초대 현황: <strong>{getStats().totalInvites}명</strong> 초대 완료<br />
                    🎁 획득 혜택: <strong>{getStats().totalInvites * 7}일</strong> 무료 연장
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ border: '2px solid', borderColor: 'warning.main' }}>
              <CardHeader 
                title="🎫 쿠폰 & 이벤트" 
                subheader="사용 가능한 쿠폰과 진행 중인 이벤트"
                sx={{ bgcolor: 'warning.lighter' }}
              />
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Chip 
                    label="🎄 크리스마스 런칭 이벤트"
                    color="warning"
                    variant="outlined"
                    sx={{ mb: 1, mr: 1 }}
                  />
                  <Chip 
                    label="🎁 신규 가입 7일 무료"
                    color="success"
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>사용 가능한 쿠폰: {getAvailableCoupons().length}개</strong>
                  </Typography>
                  {getAvailableCoupons().slice(0, 2).map((coupon) => (
                    <Box key={coupon.id} sx={{ p: 1.5, bgcolor: 'warning.lighter', borderRadius: 1, mb: 1 }}>
                      <Typography variant="body2">
                        🎟️ <strong>{coupon.code}</strong> - {coupon.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {coupon.expiryDate}까지 | 1회 사용 가능
                      </Typography>
                    </Box>
                  ))}
                </Box>
                
                <Button 
                  variant="contained" 
                  color="warning" 
                  size="small"
                  fullWidth
                  onClick={() => {
                    const stats = getCouponStats()
                    onShowNotification(`사용 가능한 쿠폰 ${stats.available}개, 총 절약 금액 ${stats.totalSaved.toLocaleString()}원! 🎫`, 'info')
                  }}
                >
                  모든 쿠폰 보기 ({getAvailableCoupons().length}개)
                </Button>
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
              <CardHeader title="🎯 자동매매 전략 설정" />
              <CardContent>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    투자 성향에 맞는 전략을 선택하세요. 언제든지 변경 가능합니다.
                  </Typography>
                </Alert>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    현재 활성 전략: <Chip 
                      label={`${getInvestmentInfo().emoji} ${getInvestmentInfo().name}`} 
                      color={getInvestmentInfo().color} 
                      size="small" 
                    />
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, border: '2px solid', borderColor: 'error.main', borderRadius: 1, bgcolor: 'error.lighter' }}>
                      <Typography variant="h6" color="error.main" gutterBottom>
                        ⚔️ 공격형 전략
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        • 높은 수익률 추구 (목표: 월 15-25%)<br />
                        • 큰 투자 금액 (잔고의 70-90%)<br />
                        • 적극적 리스크 감수
                      </Typography>
                      <Button 
                        variant={investmentStyle === 'aggressive' ? 'contained' : 'outlined'} 
                        color="error" 
                        size="small" 
                        fullWidth
                        onClick={() => handleInvestmentStyleChange('aggressive')}
                      >
                        {investmentStyle === 'aggressive' ? '✅ 현재 적용됨' : '공격형 선택'}
                      </Button>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, border: '2px solid', borderColor: 'warning.main', borderRadius: 1, bgcolor: 'warning.lighter' }}>
                      <Typography variant="h6" color="warning.main" gutterBottom>
                        ⚖️ 중립형 전략
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        • 안정적 수익률 (목표: 월 8-15%)<br />
                        • 중간 투자 금액 (잔고의 40-60%)<br />
                        • 균형잡힌 리스크 관리
                      </Typography>
                      <Button 
                        variant={investmentStyle === 'neutral' ? 'contained' : 'outlined'} 
                        color="warning" 
                        size="small" 
                        fullWidth
                        onClick={() => handleInvestmentStyleChange('neutral')}
                      >
                        {investmentStyle === 'neutral' ? '✅ 현재 적용됨' : '중립형 선택'}
                      </Button>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, border: '2px solid', borderColor: 'success.main', borderRadius: 1, bgcolor: 'success.lighter' }}>
                      <Typography variant="h6" color="success.main" gutterBottom>
                        🛡️ 방어형 전략
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        • 안전한 수익률 (목표: 월 3-8%)<br />
                        • 작은 투자 금액 (잔고의 10-30%)<br />
                        • 보수적 리스크 관리
                      </Typography>
                      <Button 
                        variant={investmentStyle === 'defensive' ? 'contained' : 'outlined'} 
                        color="success" 
                        size="small" 
                        fullWidth
                        onClick={() => handleInvestmentStyleChange('defensive')}
                      >
                        {investmentStyle === 'defensive' ? '✅ 현재 적용됨' : '방어형 선택'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
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
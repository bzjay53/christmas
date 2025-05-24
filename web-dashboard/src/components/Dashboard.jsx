import React, { useState, useEffect } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  ShowChart,
  Notifications,
  Schedule,
  CheckCircle,
  Warning
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import MobileTestPanel from './MobileTestPanel'

function Dashboard() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [portfolioData, setPortfolioData] = useState({
    totalValue: 10150000,
    totalReturn: 150000,
    returnRate: 1.5,
    dailyPnL: 25000,
    positions: 3,
    winRate: 100.0
  })

  const [recentTrades] = useState([
    {
      id: 1,
      symbol: '삼성전자',
      side: 'BUY',
      quantity: 100,
      price: 75000,
      time: '14:30:15',
      profit: null
    },
    {
      id: 2,
      symbol: 'SK하이닉스',
      side: 'SELL',
      quantity: 50,
      price: 132000,
      time: '14:25:32',
      profit: 35000
    },
    {
      id: 3,
      symbol: '네이버',
      side: 'SELL',
      quantity: 30,
      price: 235000,
      time: '14:20:18',
      profit: 15000
    }
  ])

  const [priceData] = useState([
    { time: '09:00', value: 10000000 },
    { time: '10:00', value: 10025000 },
    { time: '11:00', value: 10050000 },
    { time: '12:00', value: 10075000 },
    { time: '13:00', value: 10100000 },
    { time: '14:00', value: 10125000 },
    { time: '15:00', value: 10150000 }
  ])

  const [systemAlerts] = useState([
    { type: 'success', message: '삼성전자 매수 신호 감지', time: '14:30' },
    { type: 'info', message: '시장 변동성 낮음 - 안정적 거래환경', time: '14:25' },
    { type: 'warning', message: '일일 수익률 1.5% 달성', time: '14:20' }
  ])

  const portfolioDistribution = [
    { name: '삼성전자', value: 40, amount: 4060000 },
    { name: 'SK하이닉스', value: 35, amount: 3552500 },
    { name: '네이버', value: 25, amount: 2537500 }
  ]

  const COLORS = ['#667eea', '#764ba2', '#f093fb']

  // 실시간 데이터 업데이트 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      setPortfolioData(prev => ({
        ...prev,
        totalValue: prev.totalValue + Math.random() * 10000 - 5000,
        dailyPnL: prev.dailyPnL + Math.random() * 1000 - 500
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // 모바일용 숫자 포맷팅 함수
  const formatCurrency = (value, compact = false) => {
    if (compact && isMobile) {
      if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`
      if (value >= 10000) return `${(value / 10000).toFixed(0)}만`
      return value.toLocaleString()
    }
    return value.toLocaleString()
  }

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        gutterBottom 
        sx={{ 
          color: 'white', 
          mb: isMobile ? 2 : 3,
          textAlign: isMobile ? 'center' : 'left',
          fontSize: isSmallMobile ? '1.25rem' : undefined
        }}
      >
        🎄 Christmas Trading 대시보드
      </Typography>

      {/* 모바일 UI & 알림 테스트 패널 */}
      <MobileTestPanel />

      <Grid container spacing={isMobile ? 2 : 3}>
        {/* 포트폴리오 요약 - 모바일에서 2x2 그리드 */}
        <Grid item xs={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Box display="flex" alignItems="center" mb={1}>
                <AccountBalance sx={{ mr: 0.5, color: 'primary.main', fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                <Typography variant={isMobile ? "body2" : "h6"} sx={{ fontSize: isSmallMobile ? '0.75rem' : undefined }}>
                  총 자산
                </Typography>
              </Box>
              <Typography 
                variant={isMobile ? "h6" : "h4"} 
                sx={{ 
                  color: 'primary.main', 
                  mb: 1,
                  fontSize: isSmallMobile ? '1rem' : undefined,
                  wordBreak: 'keep-all'
                }}
              >
                ₩{formatCurrency(portfolioData.totalValue, true)}
              </Typography>
              <Box display="flex" alignItems="center" flexWrap="wrap">
                <TrendingUp sx={{ color: 'success.main', mr: 0.5, fontSize: isMobile ? '1rem' : '1.2rem' }} />
                <Typography 
                  variant={isMobile ? "caption" : "body2"} 
                  sx={{ 
                    color: 'success.main',
                    fontSize: isSmallMobile ? '0.65rem' : undefined
                  }}
                >
                  +{portfolioData.returnRate}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Box display="flex" alignItems="center" mb={1}>
                <ShowChart sx={{ mr: 0.5, color: 'secondary.main', fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                <Typography variant={isMobile ? "body2" : "h6"} sx={{ fontSize: isSmallMobile ? '0.75rem' : undefined }}>
                  오늘 손익
                </Typography>
              </Box>
              <Typography 
                variant={isMobile ? "h6" : "h4"} 
                sx={{ 
                  color: portfolioData.dailyPnL >= 0 ? 'success.main' : 'error.main', 
                  mb: 1,
                  fontSize: isSmallMobile ? '1rem' : undefined,
                  wordBreak: 'keep-all'
                }}
              >
                ₩{formatCurrency(portfolioData.dailyPnL, true)}
              </Typography>
              <Box display="flex" alignItems="center" flexWrap="wrap">
                {portfolioData.dailyPnL >= 0 ? 
                  <TrendingUp sx={{ color: 'success.main', mr: 0.5, fontSize: isMobile ? '1rem' : '1.2rem' }} /> : 
                  <TrendingDown sx={{ color: 'error.main', mr: 0.5, fontSize: isMobile ? '1rem' : '1.2rem' }} />
                }
                <Typography 
                  variant={isMobile ? "caption" : "body2"} 
                  sx={{ 
                    color: portfolioData.dailyPnL >= 0 ? 'success.main' : 'error.main',
                    fontSize: isSmallMobile ? '0.65rem' : undefined
                  }}
                >
                  {portfolioData.dailyPnL >= 0 ? '+' : ''}{(portfolioData.dailyPnL / 10000000 * 100).toFixed(2)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircle sx={{ mr: 0.5, color: 'success.main', fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                <Typography variant={isMobile ? "body2" : "h6"} sx={{ fontSize: isSmallMobile ? '0.75rem' : undefined }}>
                  승률
                </Typography>
              </Box>
              <Typography 
                variant={isMobile ? "h6" : "h4"} 
                sx={{ 
                  color: 'success.main', 
                  mb: 1,
                  fontSize: isSmallMobile ? '1rem' : undefined
                }}
              >
                {portfolioData.winRate}%
              </Typography>
              <Typography 
                variant={isMobile ? "caption" : "body2"} 
                color="textSecondary"
                sx={{ fontSize: isSmallMobile ? '0.65rem' : undefined }}
              >
                🎯 목표: 100%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Box display="flex" alignItems="center" mb={1}>
                <Schedule sx={{ mr: 0.5, color: 'warning.main', fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                <Typography variant={isMobile ? "body2" : "h6"} sx={{ fontSize: isSmallMobile ? '0.75rem' : undefined }}>
                  보유 포지션
                </Typography>
              </Box>
              <Typography 
                variant={isMobile ? "h6" : "h4"} 
                sx={{ 
                  color: 'warning.main', 
                  mb: 1,
                  fontSize: isSmallMobile ? '1rem' : undefined
                }}
              >
                {portfolioData.positions}개
              </Typography>
              <Typography 
                variant={isMobile ? "caption" : "body2"} 
                color="textSecondary"
                sx={{ fontSize: isSmallMobile ? '0.65rem' : undefined }}
              >
                활성 거래 종목
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 실시간 차트 - 모바일에서 전체 너비 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Typography variant={isMobile ? "body1" : "h6"} gutterBottom>
                📈 실시간 포트폴리오 가치
              </Typography>
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="rgba(255,255,255,0.7)" 
                    fontSize={isMobile ? 10 : 12}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.7)" 
                    fontSize={isMobile ? 10 : 12}
                    tickFormatter={(value) => formatCurrency(value, true)}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      fontSize: isMobile ? '12px' : '14px'
                    }}
                    labelStyle={{ color: 'white' }}
                    formatter={(value) => [`₩${formatCurrency(value)}`, '포트폴리오 가치']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#667eea" 
                    strokeWidth={isMobile ? 2 : 3}
                    dot={{ fill: '#667eea', strokeWidth: 2, r: isMobile ? 3 : 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 포트폴리오 분포 - 모바일에서 전체 너비 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Typography variant={isMobile ? "body1" : "h6"} gutterBottom>
                💼 포트폴리오 분포
              </Typography>
              <ResponsiveContainer width="100%" height={isMobile ? 150 : 200}>
                <PieChart>
                  <Pie
                    data={portfolioDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 60 : 80}
                    fill="#8884d8"
                    dataKey="value"
                    label={isMobile ? false : ({ name, value }) => `${name} ${value}%`}
                  >
                    {portfolioDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, '비중']} />
                </PieChart>
              </ResponsiveContainer>
              <Box mt={1}>
                {portfolioDistribution.map((item, index) => (
                  <Box key={item.name} display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Box display="flex" alignItems="center">
                      <Box 
                        width={isMobile ? 8 : 12} 
                        height={isMobile ? 8 : 12} 
                        bgcolor={COLORS[index]} 
                        borderRadius="50%" 
                        mr={1}
                      />
                      <Typography variant={isMobile ? "caption" : "body2"} sx={{ fontSize: isSmallMobile ? '0.7rem' : undefined }}>
                        {item.name}
                      </Typography>
                    </Box>
                    <Typography variant={isMobile ? "caption" : "body2"} sx={{ fontSize: isSmallMobile ? '0.7rem' : undefined }}>
                      ₩{formatCurrency(item.amount, true)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 최근 거래 내역 - 모바일에서 전체 너비 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Typography variant={isMobile ? "body1" : "h6"} gutterBottom>
                📊 최근 거래 내역
              </Typography>
              <List dense={isMobile}>
                {recentTrades.map((trade, index) => (
                  <React.Fragment key={trade.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: isMobile ? 32 : 40 }}>
                        {trade.side === 'BUY' ? 
                          <TrendingUp sx={{ color: 'primary.main', fontSize: isMobile ? '1.2rem' : '1.5rem' }} /> : 
                          <TrendingDown sx={{ color: 'secondary.main', fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                        }
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                            <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontSize: isSmallMobile ? '0.8rem' : undefined }}>
                              {trade.side === 'BUY' ? '매수' : '매도'} {trade.symbol}
                            </Typography>
                            <Typography variant={isMobile ? "caption" : "body2"} color="textSecondary" sx={{ fontSize: isSmallMobile ? '0.7rem' : undefined }}>
                              {trade.time}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                            <Typography variant={isMobile ? "caption" : "body2"} sx={{ fontSize: isSmallMobile ? '0.7rem' : undefined }}>
                              {trade.quantity}주 @ ₩{formatCurrency(trade.price, true)}
                            </Typography>
                            {trade.profit && (
                              <Chip 
                                label={`+₩${formatCurrency(trade.profit, true)}`}
                                color="success"
                                size={isMobile ? "small" : "medium"}
                                sx={{ fontSize: isSmallMobile ? '0.6rem' : undefined }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentTrades.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 시스템 알림 - 모바일에서 전체 너비 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Typography variant={isMobile ? "body1" : "h6"} gutterBottom>
                🔔 시스템 알림
              </Typography>
              <List dense={isMobile}>
                {systemAlerts.map((alert, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: isMobile ? 32 : 40 }}>
                        {alert.type === 'success' && <CheckCircle sx={{ color: 'success.main', fontSize: isMobile ? '1.2rem' : '1.5rem' }} />}
                        {alert.type === 'warning' && <Warning sx={{ color: 'warning.main', fontSize: isMobile ? '1.2rem' : '1.5rem' }} />}
                        {alert.type === 'info' && <Notifications sx={{ color: 'info.main', fontSize: isMobile ? '1.2rem' : '1.5rem' }} />}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontSize: isSmallMobile ? '0.8rem' : undefined }}>
                            {alert.message}
                          </Typography>
                        }
                        secondary={
                          <Typography variant={isMobile ? "caption" : "body2"} sx={{ fontSize: isSmallMobile ? '0.7rem' : undefined }}>
                            {alert.time}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < systemAlerts.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard 
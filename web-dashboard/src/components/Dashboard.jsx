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
  Divider
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

function Dashboard() {
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 3 }}>
        🎄 Christmas Trading Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* 포트폴리오 요약 */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountBalance sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">총 자산</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'primary.main', mb: 1 }}>
                ₩{portfolioData.totalValue.toLocaleString()}
              </Typography>
              <Box display="flex" alignItems="center">
                <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: 'success.main' }}>
                  +{portfolioData.returnRate}% (₩{portfolioData.totalReturn.toLocaleString()})
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ShowChart sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">오늘 손익</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: portfolioData.dailyPnL >= 0 ? 'success.main' : 'error.main', mb: 1 }}>
                ₩{portfolioData.dailyPnL.toLocaleString()}
              </Typography>
              <Box display="flex" alignItems="center">
                {portfolioData.dailyPnL >= 0 ? <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} /> : <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />}
                <Typography variant="body2" sx={{ color: portfolioData.dailyPnL >= 0 ? 'success.main' : 'error.main' }}>
                  {portfolioData.dailyPnL >= 0 ? '+' : ''}{(portfolioData.dailyPnL / 10000000 * 100).toFixed(2)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">승률</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'success.main', mb: 1 }}>
                {portfolioData.winRate}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                🎯 목표: 100% Win-Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Schedule sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">보유 포지션</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'warning.main', mb: 1 }}>
                {portfolioData.positions}개
              </Typography>
              <Typography variant="body2" color="textSecondary">
                활성 거래 종목
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 실시간 차트 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 실시간 포트폴리오 가치
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'white' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#667eea" 
                    strokeWidth={3}
                    dot={{ fill: '#667eea', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 포트폴리오 분포 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💼 포트폴리오 분포
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={portfolioDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}%`}
                  >
                    {portfolioDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box mt={2}>
                {portfolioDistribution.map((item, index) => (
                  <Box key={item.name} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box display="flex" alignItems="center">
                      <Box 
                        width={12} 
                        height={12} 
                        bgcolor={COLORS[index]} 
                        borderRadius="50%" 
                        mr={1}
                      />
                      <Typography variant="body2">{item.name}</Typography>
                    </Box>
                    <Typography variant="body2">₩{item.amount.toLocaleString()}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 최근 거래 내역 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 최근 거래 내역
              </Typography>
              <List>
                {recentTrades.map((trade, index) => (
                  <React.Fragment key={trade.id}>
                    <ListItem>
                      <ListItemIcon>
                        {trade.side === 'BUY' ? 
                          <TrendingUp sx={{ color: 'primary.main' }} /> : 
                          <TrendingDown sx={{ color: 'secondary.main' }} />
                        }
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1">
                              {trade.side === 'BUY' ? '매수' : '매도'} {trade.symbol}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {trade.time}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">
                              {trade.quantity}주 @ ₩{trade.price.toLocaleString()}
                            </Typography>
                            {trade.profit && (
                              <Chip 
                                label={`+₩${trade.profit.toLocaleString()}`}
                                color="success"
                                size="small"
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

        {/* 시스템 알림 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔔 시스템 알림
              </Typography>
              <List>
                {systemAlerts.map((alert, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        {alert.type === 'success' && <CheckCircle sx={{ color: 'success.main' }} />}
                        {alert.type === 'warning' && <Warning sx={{ color: 'warning.main' }} />}
                        {alert.type === 'info' && <Notifications sx={{ color: 'info.main' }} />}
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.message}
                        secondary={alert.time}
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
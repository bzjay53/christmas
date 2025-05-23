import React, { useState, useEffect } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  PlayArrow,
  Stop,
  Add,
  RemoveRedEye,
  Settings,
  ShoppingCart,
  Sell,
  Speed,
  AccountBalance
} from '@mui/icons-material'

function Trading() {
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(false)
  const [selectedStock, setSelectedStock] = useState('')
  const [orderType, setOrderType] = useState('market')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [side, setSide] = useState('buy')

  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [strategies, setStrategies] = useState([
    {
      id: 1,
      name: '스캘핑 전략 A',
      status: 'active',
      winRate: 98.5,
      profit: 245000,
      trades: 127,
      lastTrade: '2분 전'
    },
    {
      id: 2,
      name: '모멘텀 전략 B',
      status: 'paused',
      winRate: 96.2,
      profit: 189000,
      trades: 89,
      lastTrade: '5분 전'
    }
  ])

  const [recentOrders, setRecentOrders] = useState([
    {
      id: 1,
      symbol: '삼성전자',
      side: 'BUY',
      quantity: 100,
      price: 75500,
      type: 'MARKET',
      status: 'FILLED',
      time: '14:35:12',
      profit: null
    },
    {
      id: 2,
      symbol: 'SK하이닉스',
      side: 'SELL',
      quantity: 50,
      price: 132500,
      type: 'LIMIT',
      status: 'FILLED',
      time: '14:32:45',
      profit: 45000
    },
    {
      id: 3,
      symbol: '네이버',
      side: 'BUY',
      quantity: 30,
      price: 234500,
      type: 'MARKET',
      status: 'PENDING',
      time: '14:30:18',
      profit: null
    }
  ])

  const [marketData, setMarketData] = useState([
    { symbol: '삼성전자', code: '005930', price: 75500, change: 1500, changePercent: 2.03 },
    { symbol: 'SK하이닉스', code: '000660', price: 132500, change: -2000, changePercent: -1.49 },
    { symbol: '네이버', code: '035420', price: 234500, change: 3500, changePercent: 1.51 },
    { symbol: 'LG전자', code: '066570', price: 98500, change: 500, changePercent: 0.51 },
    { symbol: 'POSCO홀딩스', code: '005490', price: 289000, change: -5000, changePercent: -1.70 }
  ])

  // 실시간 시장 데이터 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => prev.map(stock => {
        const changePercent = (Math.random() - 0.5) * 0.04 // ±2% 변동
        const newPrice = Math.max(stock.price * (1 + changePercent), 1000)
        const change = newPrice - stock.price

        return {
          ...stock,
          price: Math.round(newPrice),
          change: Math.round(change),
          changePercent: Math.round(changePercent * 10000) / 100
        }
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const handlePlaceOrder = () => {
    const newOrder = {
      id: recentOrders.length + 1,
      symbol: selectedStock,
      side: side.toUpperCase(),
      quantity: parseInt(quantity),
      price: orderType === 'market' ? marketData.find(s => s.symbol === selectedStock)?.price : parseInt(price),
      type: orderType.toUpperCase(),
      status: 'PENDING',
      time: new Date().toLocaleTimeString(),
      profit: null
    }

    setRecentOrders([newOrder, ...recentOrders])
    setOrderDialogOpen(false)
    setSelectedStock('')
    setQuantity('')
    setPrice('')
  }

  const toggleStrategy = (strategyId) => {
    setStrategies(prev => prev.map(strategy => 
      strategy.id === strategyId 
        ? { ...strategy, status: strategy.status === 'active' ? 'paused' : 'active' }
        : strategy
    ))
  }

  const formatCurrency = (amount) => {
    return `₩${amount.toLocaleString()}`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'FILLED': return 'success'
      case 'PENDING': return 'warning'
      case 'CANCELLED': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 3 }}>
        🎯 자동매매 거래
      </Typography>

      {/* 자동매매 상태 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">🤖 자동매매 시스템</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoTradingEnabled}
                      onChange={(e) => setAutoTradingEnabled(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={autoTradingEnabled ? "활성화" : "비활성화"}
                />
              </Box>
              
              {autoTradingEnabled ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  🚀 자동매매가 활성화되어 실시간 거래 중입니다!
                </Alert>
              ) : (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  ⏸️ 자동매매가 일시정지되었습니다.
                </Alert>
              )}

              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  color={autoTradingEnabled ? "error" : "primary"}
                  startIcon={autoTradingEnabled ? <Stop /> : <PlayArrow />}
                  onClick={() => setAutoTradingEnabled(!autoTradingEnabled)}
                >
                  {autoTradingEnabled ? "중지" : "시작"}
                </Button>
                <Button variant="outlined" startIcon={<Settings />}>
                  설정
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 오늘의 거래 성과
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">총 거래 횟수</Typography>
                  <Typography variant="h5" color="primary.main">24회</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">수익금</Typography>
                  <Typography variant="h5" color="success.main">+₩485,000</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">승률</Typography>
                  <Typography variant="h5" color="success.main">100%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">수익률</Typography>
                  <Typography variant="h5" color="success.main">+2.85%</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 활성 전략 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ⚡ 활성 전략
          </Typography>
          <Grid container spacing={2}>
            {strategies.map((strategy) => (
              <Grid item xs={12} md={6} key={strategy.id}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {strategy.name}
                    </Typography>
                    <Chip 
                      label={strategy.status === 'active' ? '활성' : '일시정지'}
                      color={strategy.status === 'active' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    승률: {strategy.winRate}% | 수익: {formatCurrency(strategy.profit)} | 거래: {strategy.trades}회
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    마지막 거래: {strategy.lastTrade}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => toggleStrategy(strategy.id)}
                  >
                    {strategy.status === 'active' ? '일시정지' : '재시작'}
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* 실시간 시장 데이터 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">📊 실시간 시장 데이터</Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => setOrderDialogOpen(true)}
                >
                  수동 주문
                </Button>
              </Box>
              
              <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>종목</TableCell>
                      <TableCell align="right">현재가</TableCell>
                      <TableCell align="right">등락</TableCell>
                      <TableCell align="center">액션</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {marketData.slice(0, 5).map((stock) => (
                      <TableRow key={stock.code}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {stock.symbol}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {stock.code}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(stock.price)}
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end">
                            <Typography
                              variant="body2"
                              color={stock.change >= 0 ? 'success.main' : 'error.main'}
                              fontWeight="bold"
                            >
                              {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)}
                            </Typography>
                            {stock.change >= 0 ? (
                              <TrendingUp sx={{ color: 'success.main', ml: 0.5, fontSize: 16 }} />
                            ) : (
                              <TrendingDown sx={{ color: 'error.main', ml: 0.5, fontSize: 16 }} />
                            )}
                          </Box>
                          <Typography
                            variant="caption"
                            color={stock.changePercent >= 0 ? 'success.main' : 'error.main'}
                          >
                            ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%)
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" gap={0.5}>
                            <Button size="small" color="primary" startIcon={<ShoppingCart />}>
                              매수
                            </Button>
                            <Button size="small" color="secondary" startIcon={<Sell />}>
                              매도
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 최근 주문 내역 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 최근 주문 내역
              </Typography>
              
              <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>종목</TableCell>
                      <TableCell align="center">구분</TableCell>
                      <TableCell align="right">수량</TableCell>
                      <TableCell align="right">가격</TableCell>
                      <TableCell align="center">상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentOrders.slice(0, 8).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {order.symbol}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {order.time}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={order.side}
                            color={order.side === 'BUY' ? 'primary' : 'secondary'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {order.quantity.toLocaleString()}주
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(order.price)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={order.status}
                            color={getStatusColor(order.status)}
                            size="small"
                          />
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

      {/* 수동 주문 다이얼로그 */}
      <Dialog open={orderDialogOpen} onClose={() => setOrderDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>수동 주문 생성</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>종목 선택</InputLabel>
                <Select
                  value={selectedStock}
                  label="종목 선택"
                  onChange={(e) => setSelectedStock(e.target.value)}
                >
                  {marketData.map((stock) => (
                    <MenuItem key={stock.code} value={stock.symbol}>
                      {stock.symbol} ({stock.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>매매구분</InputLabel>
                <Select
                  value={side}
                  label="매매구분"
                  onChange={(e) => setSide(e.target.value)}
                >
                  <MenuItem value="buy">매수</MenuItem>
                  <MenuItem value="sell">매도</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>주문유형</InputLabel>
                <Select
                  value={orderType}
                  label="주문유형"
                  onChange={(e) => setOrderType(e.target.value)}
                >
                  <MenuItem value="market">시장가</MenuItem>
                  <MenuItem value="limit">지정가</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="수량"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Grid>
            {orderType === 'limit' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="지정가격"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDialogOpen(false)}>취소</Button>
          <Button 
            onClick={handlePlaceOrder} 
            variant="contained"
            disabled={!selectedStock || !quantity}
          >
            주문
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Trading 
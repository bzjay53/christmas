import React, { useState, useEffect } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  Add,
  Remove,
  ShowChart,
  AccountBalance,
  AttachMoney
} from '@mui/icons-material'

function Portfolio() {
  const [positions, setPositions] = useState([
    {
      id: 1,
      symbol: '삼성전자',
      code: '005930',
      quantity: 100,
      avgPrice: 75000,
      currentPrice: 76500,
      totalValue: 7650000,
      unrealizedPnL: 150000,
      returnRate: 2.0,
      weight: 40.5
    },
    {
      id: 2,
      symbol: 'SK하이닉스',
      code: '000660',
      quantity: 50,
      avgPrice: 130000,
      currentPrice: 132000,
      totalValue: 6600000,
      unrealizedPnL: 100000,
      returnRate: 1.54,
      weight: 35.0
    },
    {
      id: 3,
      symbol: '네이버',
      code: '035420',
      quantity: 30,
      avgPrice: 230000,
      currentPrice: 235000,
      totalValue: 7050000,
      unrealizedPnL: 150000,
      returnRate: 2.17,
      weight: 24.5
    }
  ])

  const [portfolioSummary, setPortfolioSummary] = useState({
    totalValue: 18865000,
    totalCost: 18350000,
    totalPnL: 515000,
    totalReturn: 2.81,
    cashBalance: 1135000
  })

  const [addPositionOpen, setAddPositionOpen] = useState(false)
  const [newPosition, setNewPosition] = useState({
    symbol: '',
    code: '',
    quantity: '',
    price: ''
  })

  // 실시간 가격 업데이트 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      setPositions(prev => prev.map(position => {
        const priceChange = (Math.random() - 0.5) * 0.02 // ±1% 변동
        const newPrice = Math.max(position.currentPrice * (1 + priceChange), 1000)
        const totalValue = newPrice * position.quantity
        const unrealizedPnL = totalValue - (position.avgPrice * position.quantity)
        const returnRate = (unrealizedPnL / (position.avgPrice * position.quantity)) * 100

        return {
          ...position,
          currentPrice: Math.round(newPrice),
          totalValue: Math.round(totalValue),
          unrealizedPnL: Math.round(unrealizedPnL),
          returnRate: Math.round(returnRate * 100) / 100
        }
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleAddPosition = () => {
    const quantity = parseInt(newPosition.quantity)
    const price = parseInt(newPosition.price)
    const totalValue = quantity * price

    const position = {
      id: positions.length + 1,
      symbol: newPosition.symbol,
      code: newPosition.code,
      quantity: quantity,
      avgPrice: price,
      currentPrice: price,
      totalValue: totalValue,
      unrealizedPnL: 0,
      returnRate: 0,
      weight: (totalValue / portfolioSummary.totalValue) * 100
    }

    setPositions([...positions, position])
    setNewPosition({ symbol: '', code: '', quantity: '', price: '' })
    setAddPositionOpen(false)
  }

  const handleClosePosition = (positionId) => {
    setPositions(positions.filter(p => p.id !== positionId))
  }

  const formatCurrency = (amount) => {
    return `₩${amount.toLocaleString()}`
  }

  const formatPercent = (percent) => {
    return `${percent >= 0 ? '+' : ''}${percent}%`
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 3 }}>
        💼 포트폴리오 관리
      </Typography>

      {/* 포트폴리오 요약 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountBalance sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">총 자산</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'primary.main', mb: 1 }}>
                {formatCurrency(portfolioSummary.totalValue)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                투자원금: {formatCurrency(portfolioSummary.totalCost)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ShowChart sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">실현손익</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'success.main', mb: 1 }}>
                {formatCurrency(portfolioSummary.totalPnL)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'success.main' }}>
                {formatPercent(portfolioSummary.totalReturn)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AttachMoney sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">현금 잔고</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'warning.main', mb: 1 }}>
                {formatCurrency(portfolioSummary.cashBalance)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                투자 가능 금액
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ShowChart sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">보유 종목</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'info.main', mb: 1 }}>
                {positions.length}개
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Add />}
                onClick={() => setAddPositionOpen(true)}
                sx={{ mt: 1 }}
              >
                종목 추가
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 보유 종목 테이블 */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">📊 보유 종목 상세</Typography>
            <Box display="flex" gap={1}>
              <Chip label="실시간 업데이트" color="success" size="small" />
              <Chip label={`총 ${positions.length}개 종목`} color="info" size="small" />
            </Box>
          </Box>

          <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>종목명</TableCell>
                  <TableCell align="right">보유수량</TableCell>
                  <TableCell align="right">매수평균가</TableCell>
                  <TableCell align="right">현재가</TableCell>
                  <TableCell align="right">평가금액</TableCell>
                  <TableCell align="right">손익</TableCell>
                  <TableCell align="right">수익률</TableCell>
                  <TableCell align="right">비중</TableCell>
                  <TableCell align="center">액션</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {position.symbol}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {position.code}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {position.quantity.toLocaleString()}주
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(position.avgPrice)}
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        {formatCurrency(position.currentPrice)}
                        {position.currentPrice > position.avgPrice ? (
                          <TrendingUp sx={{ color: 'success.main', ml: 0.5, fontSize: 16 }} />
                        ) : position.currentPrice < position.avgPrice ? (
                          <TrendingDown sx={{ color: 'error.main', ml: 0.5, fontSize: 16 }} />
                        ) : null}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(position.totalValue)}
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        color={position.unrealizedPnL >= 0 ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {formatCurrency(position.unrealizedPnL)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        color={position.returnRate >= 0 ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {formatPercent(position.returnRate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2">
                          {position.weight.toFixed(1)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={position.weight}
                          sx={{ mt: 0.5, width: 60 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Remove />}
                        onClick={() => handleClosePosition(position.id)}
                      >
                        매도
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 종목 추가 다이얼로그 */}
      <Dialog open={addPositionOpen} onClose={() => setAddPositionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>새 종목 추가</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="종목명"
                value={newPosition.symbol}
                onChange={(e) => setNewPosition({...newPosition, symbol: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="종목코드"
                value={newPosition.code}
                onChange={(e) => setNewPosition({...newPosition, code: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="수량"
                type="number"
                value={newPosition.quantity}
                onChange={(e) => setNewPosition({...newPosition, quantity: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="매수가격"
                type="number"
                value={newPosition.price}
                onChange={(e) => setNewPosition({...newPosition, price: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPositionOpen(false)}>취소</Button>
          <Button onClick={handleAddPosition} variant="contained">추가</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Portfolio 
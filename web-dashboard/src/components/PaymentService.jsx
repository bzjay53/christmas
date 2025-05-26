import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  CircularProgress
} from '@mui/material'
import {
  Payment,
  CreditCard,
  AccountBalance,
  Security,
  CheckCircle,
  Error,
  Info,
  Star,
  Diamond,
  WorkspacePremium,
  AutoAwesome
} from '@mui/icons-material'

// 토스페이먼츠 결제 플랜 정의 (새로운 요금제)
const PAYMENT_PLANS = [
  {
    id: 'subscription',
    name: '구독제 플랜',
    price: 14900,
    duration: '월간',
    icon: <Star color="primary" />,
    features: [
      '🤖 AI 기반 자동매매',
      '📊 실시간 시장 분석',
      '📱 텔레그램 알림',
      '📈 모의투자 무제한',
      '📋 거래 내역 관리',
      '💰 매수/매도 시 1% 수수료',
      '📞 이메일 지원',
      '🎯 기본 투자 전략'
    ],
    color: 'primary',
    popular: true,
    feeRate: 1.0,
    description: '매월 14,900원으로 모든 기능을 이용하세요'
  },
  {
    id: 'lifetime',
    name: 'Lifetime 플랜',
    price: 10000000,
    duration: '평생',
    icon: <Diamond sx={{ color: '#FFD700' }} />,
    features: [
      '🤖 AI 기반 자동매매 (평생)',
      '📊 실시간 시장 분석 (평생)',
      '📱 텔레그램 알림 (평생)',
      '📈 모의투자 무제한 (평생)',
      '📋 거래 내역 관리 (평생)',
      '💰 매수/매도 시 0.7% 수수료',
      '📞 우선 고객지원',
      '🎯 고급 투자 전략',
      '💎 VIP 전용 기능',
      '🔧 개인 맞춤 설정',
      '📊 고급 분석 도구',
      '💳 신용카드 할부 가능'
    ],
    color: 'warning',
    popular: false,
    feeRate: 0.7,
    description: '1,000만원 일시불 또는 신용카드 할부로 평생 이용',
    installmentOptions: [
      { months: 1, name: '일시불', fee: 0 },
      { months: 3, name: '3개월 할부', fee: 0 },
      { months: 6, name: '6개월 할부', fee: 0 },
      { months: 12, name: '12개월 할부', fee: 0 },
      { months: 24, name: '24개월 할부', fee: 0 }
    ]
  }
]

// 토스페이먼츠 결제 방법
const PAYMENT_METHODS = [
  { id: 'card', name: '신용카드/체크카드', icon: <CreditCard />, fee: 0, description: '즉시 결제, 할부 가능' },
  { id: 'transfer', name: '계좌이체', icon: <AccountBalance />, fee: 0, description: '실시간 계좌이체' },
  { id: 'virtualaccount', name: '가상계좌', icon: <Payment />, fee: 0, description: '입금 확인 후 승인' },
  { id: 'phone', name: '휴대폰 결제', icon: <Payment />, fee: 0, description: '휴대폰 소액결제' }
]

function PaymentService({ user, onShowNotification, onPaymentSuccess }) {
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('card')
  const [selectedInstallment, setSelectedInstallment] = useState(0)
  const [loading, setLoading] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: '',
    agreeTerms: false,
    agreePrivacy: false
  })

  // 토스페이먼츠 결제 처리 함수
  const processTossPayment = async (planId, amount, method, installmentMonths = 0) => {
    try {
      setLoading(true)
      
      // 토스페이먼츠 결제 데이터
      const paymentData = {
        amount: amount,
        orderId: `CHR-${Date.now()}`,
        orderName: PAYMENT_PLANS.find(p => p.id === planId)?.name,
        customerName: paymentForm.customerName,
        customerEmail: paymentForm.customerEmail,
        customerMobilePhone: paymentForm.customerPhone,
        successUrl: window.location.origin + '/payment/success',
        failUrl: window.location.origin + '/payment/fail',
        method: method,
        ...(installmentMonths > 0 && { cardInstallmentPlan: installmentMonths })
      }
      
      console.log('💳 토스페이먼츠 결제 요청:', paymentData)
      
      // 실제 환경에서는 토스페이먼츠 SDK 사용
      // const tossPayments = TossPayments(process.env.REACT_APP_TOSS_CLIENT_KEY)
      // await tossPayments.requestPayment(method, paymentData)
      
      // 시뮬레이션: 2초 후 성공 응답
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockResponse = {
        success: true,
        paymentKey: `toss_${Date.now()}`,
        orderId: paymentData.orderId,
        amount: amount,
        status: 'DONE',
        method: method,
        transactionId: `TXN_${Date.now()}`,
        approvedAt: new Date().toISOString()
      }
      
      console.log('✅ 토스페이먼츠 결제 응답:', mockResponse)
      
      if (mockResponse.success) {
        // 결제 성공 처리
        const selectedPlanData = PAYMENT_PLANS.find(p => p.id === planId)
        const paymentResult = {
          planId: planId,
          planName: selectedPlanData?.name,
          amount: amount,
          paymentKey: mockResponse.paymentKey,
          transactionId: mockResponse.transactionId,
          paymentMethod: method,
          feeRate: selectedPlanData?.feeRate || 1.0,
          paidAt: mockResponse.approvedAt,
          validUntil: planId === 'lifetime' ? 
            new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString() : // 100년 후 (평생)
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30일 후 (구독제)
        }
        
        // 사용자 멤버십 업데이트
        if (onPaymentSuccess) {
          onPaymentSuccess(paymentResult)
        }
        
        if (onShowNotification) {
          onShowNotification(
            `🎉 결제가 완료되었습니다! ${paymentResult.planName}이 활성화되었습니다.`,
            'success'
          )
        }
        
        setPaymentDialog(false)
        setSelectedPlan(null)
        
        return mockResponse
      } else {
        throw new Error('결제 처리 중 오류가 발생했습니다.')
      }
      
    } catch (error) {
      console.error('❌ Link.com 결제 실패:', error)
      
      if (onShowNotification) {
        onShowNotification(`❌ 결제 실패: ${error.message}`, 'error')
      }
      
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan)
    setPaymentDialog(true)
  }

  const handlePayment = async () => {
    if (!selectedPlan) return
    
    // 폼 검증
    if (!paymentForm.customerName || !paymentForm.customerEmail || !paymentForm.customerPhone) {
      if (onShowNotification) {
        onShowNotification('모든 필수 정보를 입력해주세요.', 'warning')
      }
      return
    }
    
    if (!paymentForm.agreeTerms || !paymentForm.agreePrivacy) {
      if (onShowNotification) {
        onShowNotification('이용약관과 개인정보처리방침에 동의해주세요.', 'warning')
      }
      return
    }
    
    try {
      await processTossPayment(selectedPlan.id, selectedPlan.price, selectedMethod, selectedInstallment)
    } catch (error) {
      console.error('결제 처리 실패:', error)
    }
  }

  const handleFormChange = (field, value) => {
    setPaymentForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          textAlign: 'center', 
          mb: 4,
          color: 'text.primary',
          fontWeight: 'bold'
        }}
      >
        🎄 Christmas Trading 요금제
      </Typography>
      
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body1">
          <strong>💳 토스페이먼츠 안전결제</strong><br />
          국내 1위 핀테크 토스의 안전한 결제 시스템을 사용합니다. 
          신용카드, 계좌이체, 가상계좌, 휴대폰 결제 등 다양한 방법을 지원하며, 
          Lifetime 플랜은 신용카드 할부 결제가 가능합니다.
        </Typography>
      </Alert>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {PAYMENT_PLANS.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card 
              sx={{ 
                height: '100%',
                position: 'relative',
                border: plan.popular ? '2px solid' : '1px solid',
                borderColor: plan.popular ? 'secondary.main' : 'divider',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                },
                transition: 'all 0.3s ease'
              }}
            >
              {plan.popular && (
                <Chip 
                  label="🔥 인기" 
                  color="secondary" 
                  sx={{ 
                    position: 'absolute', 
                    top: -10, 
                    right: 16,
                    fontWeight: 'bold'
                  }} 
                />
              )}
              
              <CardHeader
                avatar={plan.icon}
                title={plan.name}
                subheader={`₩${plan.price.toLocaleString()} / ${plan.duration}`}
                sx={{ 
                  textAlign: 'center',
                  '& .MuiCardHeader-title': {
                    color: 'text.primary',
                    fontWeight: 'bold'
                  },
                  '& .MuiCardHeader-subheader': {
                    color: 'text.secondary',
                    fontWeight: 'medium'
                  }
                }}
              />
              
              <CardContent>
                <List dense>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircle color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature} 
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          color: 'text.primary'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
                
                <Button
                  fullWidth
                  variant={plan.popular ? "contained" : "outlined"}
                  color={plan.color}
                  size="large"
                  onClick={() => handlePlanSelect(plan)}
                  sx={{ mt: 2 }}
                  startIcon={<Payment />}
                >
                  선택하기
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 결제 다이얼로그 */}
      <Dialog 
        open={paymentDialog} 
        onClose={() => setPaymentDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Payment color="primary" />
            <Typography variant="h6">
              {selectedPlan?.name} 결제
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3}>
            {/* 주문 정보 */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  📋 주문 정보
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>상품명:</Typography>
                  <Typography fontWeight="bold">{selectedPlan?.name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>기간:</Typography>
                  <Typography>{selectedPlan?.duration}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>금액:</Typography>
                  <Typography fontWeight="bold" color="primary">
                    ₩{selectedPlan?.price.toLocaleString()}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">총 결제금액:</Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    ₩{selectedPlan?.price.toLocaleString()}
                  </Typography>
                </Box>
              </Paper>

              {/* 결제 방법 선택 */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  💳 결제 방법
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={selectedMethod}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <MenuItem key={method.id} value={method.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {method.icon}
                          <Typography>{method.name}</Typography>
                          {method.fee === 0 && (
                            <Chip label="수수료 무료" size="small" color="success" />
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Paper>
            </Grid>

            {/* 고객 정보 */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  👤 고객 정보
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TextField
                  fullWidth
                  label="이름"
                  value={paymentForm.customerName}
                  onChange={(e) => handleFormChange('customerName', e.target.value)}
                  sx={{ mb: 2 }}
                  required
                />
                
                <TextField
                  fullWidth
                  label="이메일"
                  type="email"
                  value={paymentForm.customerEmail}
                  onChange={(e) => handleFormChange('customerEmail', e.target.value)}
                  sx={{ mb: 2 }}
                  required
                />
                
                <TextField
                  fullWidth
                  label="휴대폰 번호"
                  value={paymentForm.customerPhone}
                  onChange={(e) => handleFormChange('customerPhone', e.target.value)}
                  placeholder="010-1234-5678"
                  sx={{ mb: 2 }}
                  required
                />

                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <input
                      type="checkbox"
                      checked={paymentForm.agreeTerms}
                      onChange={(e) => handleFormChange('agreeTerms', e.target.checked)}
                      style={{ marginRight: 8 }}
                    />
                    <Typography variant="body2">
                      이용약관에 동의합니다. (필수)
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={paymentForm.agreePrivacy}
                      onChange={(e) => handleFormChange('agreePrivacy', e.target.checked)}
                      style={{ marginRight: 8 }}
                    />
                    <Typography variant="body2">
                      개인정보처리방침에 동의합니다. (필수)
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security />
              <Typography variant="body2">
                <strong>Link.com 보안결제</strong> - SSL 암호화 및 PCI DSS 인증으로 안전하게 보호됩니다.
              </Typography>
            </Box>
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setPaymentDialog(false)}
            disabled={loading}
          >
            취소
          </Button>
          <Button 
            variant="contained" 
            onClick={handlePayment}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Payment />}
            size="large"
          >
            {loading ? '결제 처리 중...' : `₩${selectedPlan?.price.toLocaleString()} 결제하기`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PaymentService 
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
  Crown,
  AutoAwesome
} from '@mui/icons-material'

// Link.com 결제 플랜 정의
const PAYMENT_PLANS = [
  {
    id: 'basic',
    name: '베이직 플랜',
    price: 29000,
    duration: '월간',
    icon: <Star color="primary" />,
    features: [
      '기본 AI 매매 신호',
      '일일 시장 분석 리포트',
      '텔레그램 알림 (기본)',
      '모의투자 무제한',
      '기본 백테스팅',
      '이메일 지원'
    ],
    color: 'primary',
    popular: false
  },
  {
    id: 'premium',
    name: '프리미엄 플랜',
    price: 79000,
    duration: '월간',
    icon: <Diamond color="secondary" />,
    features: [
      '고급 AI 매매 신호',
      '실시간 시장 분석',
      '텔레그램 실시간 알림',
      '실전투자 연동',
      '고급 백테스팅',
      '개인 맞춤 전략',
      '우선 고객지원',
      '월간 1:1 상담'
    ],
    color: 'secondary',
    popular: true
  },
  {
    id: 'enterprise',
    name: '엔터프라이즈 플랜',
    price: 199000,
    duration: '월간',
    icon: <Crown sx={{ color: '#FFD700' }} />,
    features: [
      '최고급 AI 매매 신호',
      '24/7 실시간 모니터링',
      '전용 텔레그램 채널',
      '다중 계좌 연동',
      '무제한 백테스팅',
      '전용 투자 전략',
      '24/7 전화 지원',
      '주간 전문가 상담',
      'API 접근 권한',
      '커스텀 개발 지원'
    ],
    color: 'warning',
    popular: false
  }
]

// Link.com 결제 방법
const PAYMENT_METHODS = [
  { id: 'card', name: '신용카드/체크카드', icon: <CreditCard />, fee: 0 },
  { id: 'bank', name: '계좌이체', icon: <AccountBalance />, fee: 0 },
  { id: 'virtual', name: '가상계좌', icon: <Payment />, fee: 0 }
]

function PaymentService({ user, onShowNotification, onPaymentSuccess }) {
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('card')
  const [loading, setLoading] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: '',
    agreeTerms: false,
    agreePrivacy: false
  })

  // Link.com 결제 처리 함수
  const processLinkPayment = async (planId, amount, method) => {
    try {
      setLoading(true)
      
      // Link.com API 호출 시뮬레이션
      const paymentData = {
        merchantId: 'christmas-trading-2024',
        orderId: `CHR-${Date.now()}`,
        amount: amount,
        currency: 'KRW',
        productName: PAYMENT_PLANS.find(p => p.id === planId)?.name,
        customerName: paymentForm.customerName,
        customerEmail: paymentForm.customerEmail,
        customerPhone: paymentForm.customerPhone,
        paymentMethod: method,
        returnUrl: window.location.origin + '/payment/success',
        cancelUrl: window.location.origin + '/payment/cancel',
        webhookUrl: window.location.origin + '/api/payment/webhook'
      }
      
      console.log('🔗 Link.com 결제 요청:', paymentData)
      
      // 실제 환경에서는 Link.com API를 호출
      // const response = await fetch('https://api.link.com/v1/payments', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${process.env.REACT_APP_LINK_API_KEY}`
      //   },
      //   body: JSON.stringify(paymentData)
      // })
      
      // 시뮬레이션: 2초 후 성공 응답
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockResponse = {
        success: true,
        paymentId: `link_${Date.now()}`,
        orderId: paymentData.orderId,
        amount: amount,
        status: 'completed',
        paymentUrl: `https://pay.link.com/checkout/${paymentData.orderId}`,
        transactionId: `TXN_${Date.now()}`
      }
      
      console.log('✅ Link.com 결제 응답:', mockResponse)
      
      if (mockResponse.success) {
        // 결제 성공 처리
        const paymentResult = {
          planId: planId,
          planName: PAYMENT_PLANS.find(p => p.id === planId)?.name,
          amount: amount,
          paymentId: mockResponse.paymentId,
          transactionId: mockResponse.transactionId,
          paymentMethod: method,
          paidAt: new Date().toISOString(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30일 후
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
      await processLinkPayment(selectedPlan.id, selectedPlan.price, selectedMethod)
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
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        🎄 Christmas Trading 요금제
      </Typography>
      
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body1">
          <strong>🔗 Link.com 안전결제</strong><br />
          국내 최고 수준의 보안 시스템으로 안전하게 결제하세요. 
          신용카드, 계좌이체, 가상계좌 등 다양한 결제 방법을 지원합니다.
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
                sx={{ textAlign: 'center' }}
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
                        primaryTypographyProps={{ variant: 'body2' }}
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
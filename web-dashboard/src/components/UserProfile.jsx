import React, { useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Switch,
  FormControlLabel,
  Tab,
  Tabs,
  Divider,
  Chip,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Security,
  VpnKey,
  AccountBalance,
  Settings,
  Save,
  Edit,
  Delete,
  Add,
  Warning,
  CheckCircle,
  CreditCard,
  Payment
} from '@mui/icons-material'

function UserProfile({ user }) {
  const [activeTab, setActiveTab] = useState(0)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // 사용자 설정 상태
  const [userSettings, setUserSettings] = useState({
    // API 설정
    kisApiKey: '**********************ABCD',
    kisSecretKey: '**********************WXYZ',
    kisAccountNumber: '12345678-01',
    kisEnvironment: 'sandbox', // sandbox or production
    
    // 투자 설정
    maxInvestmentAmount: 10000000,
    riskLevel: 'medium',
    autoTradingEnabled: true,
    stopLossPercentage: 5,
    takeProfitPercentage: 10,
    
    // 알림 설정
    telegramEnabled: true,
    emailEnabled: true,
    pushEnabled: false,
    
    // 개인정보
    username: user?.username || '',
    email: user?.email || '',
    phone: '010-1234-5678',
    
    // 보안 설정
    twoFactorEnabled: false,
    sessionTimeout: 30,
    ipWhitelist: []
  })

  // 결제 정보 상태
  const [paymentInfo, setPaymentInfo] = useState({
    membershipType: user?.membershipType || 'free',
    paymentMethod: 'stripe',
    monthlyFee: 15,
    lifetimeFee: 10000000,
    nextBillingDate: '2025-01-25',
    paymentHistory: [
      { id: 1, date: '2024-12-24', amount: 15, type: 'monthly', status: 'paid' },
      { id: 2, date: '2024-11-24', amount: 15, type: 'monthly', status: 'paid' },
    ]
  })

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    setError('')
    setSuccess('')
  }

  const handleSave = async () => {
    setSaveLoading(true)
    setError('')
    
    try {
      // 저장 로직 구현 (API 호출)
      await new Promise(resolve => setTimeout(resolve, 1500)) // 시뮬레이션
      
      setSuccess('설정이 성공적으로 저장되었습니다!')
      setEditMode(false)
    } catch (err) {
      setError('설정 저장 중 오류가 발생했습니다.')
    } finally {
      setSaveLoading(false)
    }
  }

  const maskApiKey = (key) => {
    if (!key) return ''
    return key.slice(0, 4) + '*'.repeat(16) + key.slice(-4)
  }

  const getMembershipInfo = () => {
    switch (paymentInfo.membershipType) {
      case 'lifetime':
        return { 
          label: 'Lifetime 회원', 
          color: 'success', 
          description: '모든 기능 무제한 이용, 수수료 면제',
          price: '₩10,000,000 (일시불)'
        }
      case 'premium':
        return { 
          label: 'Premium 회원', 
          color: 'primary', 
          description: '실시간 매매, 고급 기능 이용, 1% 수수료',
          price: '$15/월'
        }
      default:
        return { 
          label: '무료 회원', 
          color: 'default', 
          description: '데모 모드만 이용 가능',
          price: '무료'
        }
    }
  }

  const membershipInfo = getMembershipInfo()

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 3 }}>
        👤 사용자 프로필
      </Typography>

      {/* 사용자 정보 요약 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 1
                  }}
                >
                  <Typography variant="h4" color="white">
                    {user?.username?.charAt(0) || 'U'}
                  </Typography>
                </Box>
                <Typography variant="h6">{user?.username}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {user?.email}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Chip 
                  label={membershipInfo.label} 
                  color={membershipInfo.color} 
                  sx={{ mb: 1 }} 
                />
                <Typography variant="body1" gutterBottom>
                  {membershipInfo.description}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  현재 요금: {membershipInfo.price}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant={editMode ? "outlined" : "contained"}
                startIcon={editMode ? <Save /> : <Edit />}
                onClick={editMode ? handleSave : () => setEditMode(true)}
                disabled={saveLoading}
                fullWidth
              >
                {saveLoading ? '저장 중...' : editMode ? '저장' : '편집'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 알림 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* 탭 메뉴 */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable">
          <Tab label="API 설정" icon={<VpnKey />} />
          <Tab label="투자 설정" icon={<Settings />} />
          <Tab label="보안 설정" icon={<Security />} />
          <Tab label="결제 관리" icon={<Payment />} />
        </Tabs>
      </Card>

      {/* API 설정 탭 */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔑 한국투자증권 KIS API 설정
            </Typography>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>보안 주의:</strong> API 키와 시크릿 키는 암호화되어 저장됩니다. 
                타인과 공유하지 마세요.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="API Key"
                  type={showApiKey ? 'text' : 'password'}
                  value={showApiKey ? userSettings.kisApiKey : maskApiKey(userSettings.kisApiKey)}
                  onChange={(e) => setUserSettings({...userSettings, kisApiKey: e.target.value})}
                  disabled={!editMode}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowApiKey(!showApiKey)}>
                          {showApiKey ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Secret Key"
                  type={showSecretKey ? 'text' : 'password'}
                  value={showSecretKey ? userSettings.kisSecretKey : maskApiKey(userSettings.kisSecretKey)}
                  onChange={(e) => setUserSettings({...userSettings, kisSecretKey: e.target.value})}
                  disabled={!editMode}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowSecretKey(!showSecretKey)}>
                          {showSecretKey ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="계좌번호"
                  value={userSettings.kisAccountNumber}
                  onChange={(e) => setUserSettings({...userSettings, kisAccountNumber: e.target.value})}
                  disabled={!editMode}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>환경</InputLabel>
                  <Select
                    value={userSettings.kisEnvironment}
                    label="환경"
                    onChange={(e) => setUserSettings({...userSettings, kisEnvironment: e.target.value})}
                    disabled={!editMode}
                  >
                    <MenuItem value="sandbox">샌드박스 (테스트)</MenuItem>
                    <MenuItem value="production">프로덕션 (실전)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* API 연결 상태 */}
            <Divider sx={{ my: 3 }} />
            <Box display="flex" alignItems="center" gap={2}>
              <CheckCircle color="success" />
              <Typography variant="body1">
                API 연결 상태: <strong>정상</strong>
              </Typography>
              <Button variant="outlined" size="small">
                연결 테스트
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 투자 설정 탭 */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 투자 및 리스크 설정
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="최대 투자 금액 (원)"
                  type="number"
                  value={userSettings.maxInvestmentAmount}
                  onChange={(e) => setUserSettings({...userSettings, maxInvestmentAmount: parseInt(e.target.value)})}
                  disabled={!editMode}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>리스크 레벨</InputLabel>
                  <Select
                    value={userSettings.riskLevel}
                    label="리스크 레벨"
                    onChange={(e) => setUserSettings({...userSettings, riskLevel: e.target.value})}
                    disabled={!editMode}
                  >
                    <MenuItem value="low">낮음 (안전 우선)</MenuItem>
                    <MenuItem value="medium">보통 (균형)</MenuItem>
                    <MenuItem value="high">높음 (수익 우선)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="손절 비율 (%)"
                  type="number"
                  value={userSettings.stopLossPercentage}
                  onChange={(e) => setUserSettings({...userSettings, stopLossPercentage: parseFloat(e.target.value)})}
                  disabled={!editMode}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="익절 비율 (%)"
                  type="number"
                  value={userSettings.takeProfitPercentage}
                  onChange={(e) => setUserSettings({...userSettings, takeProfitPercentage: parseFloat(e.target.value)})}
                  disabled={!editMode}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            
            <FormControlLabel
              control={
                <Switch
                  checked={userSettings.autoTradingEnabled}
                  onChange={(e) => setUserSettings({...userSettings, autoTradingEnabled: e.target.checked})}
                  disabled={!editMode}
                />
              }
              label="자동매매 활성화"
            />
          </CardContent>
        </Card>
      )}

      {/* 보안 설정 탭 */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔒 보안 설정
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userSettings.twoFactorEnabled}
                      onChange={(e) => setUserSettings({...userSettings, twoFactorEnabled: e.target.checked})}
                      disabled={!editMode}
                    />
                  }
                  label="2단계 인증 (Google Authenticator)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="세션 타임아웃 (분)"
                  type="number"
                  value={userSettings.sessionTimeout}
                  onChange={(e) => setUserSettings({...userSettings, sessionTimeout: parseInt(e.target.value)})}
                  disabled={!editMode}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              알림 설정
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userSettings.telegramEnabled}
                      onChange={(e) => setUserSettings({...userSettings, telegramEnabled: e.target.checked})}
                      disabled={!editMode}
                    />
                  }
                  label="텔레그램 알림"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userSettings.emailEnabled}
                      onChange={(e) => setUserSettings({...userSettings, emailEnabled: e.target.checked})}
                      disabled={!editMode}
                    />
                  }
                  label="이메일 알림"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userSettings.pushEnabled}
                      onChange={(e) => setUserSettings({...userSettings, pushEnabled: e.target.checked})}
                      disabled={!editMode}
                    />
                  }
                  label="Push 알림"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 결제 관리 탭 */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          {/* 현재 멤버십 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  💳 현재 멤버십
                </Typography>
                <Box mb={2}>
                  <Chip 
                    label={membershipInfo.label} 
                    color={membershipInfo.color} 
                    sx={{ mb: 1 }} 
                  />
                  <Typography variant="body2" gutterBottom>
                    {membershipInfo.description}
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {membershipInfo.price}
                  </Typography>
                </Box>
                
                {paymentInfo.membershipType !== 'lifetime' && (
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      다음 결제일: {paymentInfo.nextBillingDate}
                    </Typography>
                    <Button variant="contained" size="small" sx={{ mr: 1 }}>
                      업그레이드
                    </Button>
                    <Button variant="outlined" size="small" color="error">
                      해지
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 결제 내역 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📋 결제 내역
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>날짜</TableCell>
                        <TableCell align="right">금액</TableCell>
                        <TableCell align="center">상태</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentInfo.paymentHistory.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.date}</TableCell>
                          <TableCell align="right">
                            ${payment.amount}
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={payment.status} 
                              color={payment.status === 'paid' ? 'success' : 'error'} 
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

          {/* 업그레이드 옵션 */}
          {paymentInfo.membershipType !== 'lifetime' && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🚀 멤버십 업그레이드
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" color="primary.main">
                            Premium 월구독
                          </Typography>
                          <Typography variant="h4" gutterBottom>
                            $15<Typography component="span" variant="body2">/월</Typography>
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            • 실시간 매매 기능
                            • 고급 차트 분석
                            • 매매 수수료 1%
                            • 24/7 고객지원
                          </Typography>
                          <Button variant="contained" fullWidth>
                            월구독 시작
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ border: '2px solid gold' }}>
                        <CardContent>
                          <Box display="flex" alignItems="center" mb={1}>
                            <Typography variant="h6" color="warning.main">
                              Lifetime 평생회원
                            </Typography>
                            <Chip label="추천" color="warning" size="small" sx={{ ml: 1 }} />
                          </Box>
                          <Typography variant="h4" gutterBottom>
                            ₩10,000,000<Typography component="span" variant="body2">/평생</Typography>
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            • 모든 기능 무제한
                            • 수수료 완전 면제
                            • VIP 전용 기능
                            • 평생 업데이트
                          </Typography>
                          <Button variant="contained" color="warning" fullWidth>
                            평생회원 가입
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* 확인 다이얼로그 */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>설정 저장 확인</DialogTitle>
        <DialogContent>
          <Typography>
            변경된 설정을 저장하시겠습니까? 일부 설정은 즉시 적용됩니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>취소</Button>
          <Button onClick={handleSave} variant="contained">저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UserProfile 
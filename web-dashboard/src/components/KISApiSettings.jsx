import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  Alert,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
  Chip,
  LinearProgress,
  Tab,
  Tabs,
  IconButton,
  InputAdornment
} from '@mui/material'
import {
  Security,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error,
  Warning,
  Info,
  Refresh,
  Save,
  Delete,
  TrendingUp,
  AccountBalance
} from '@mui/icons-material'
import apiService from '../lib/apiService'

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`kis-tabpanel-${index}`}
      aria-labelledby={`kis-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

function KISApiSettings({ onShowNotification }) {
  const [tabValue, setTabValue] = useState(0)
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [showSecrets, setShowSecrets] = useState({
    demoSecret: false,
    realSecret: false,
    telegramToken: false
  })
  
  // KIS API 설정 상태
  const [settings, setSettings] = useState({
    mockMode: true,
    demoAppKey: '',
    demoAppSecret: '',
    realAppKey: '',
    realAppSecret: '',
    accountNumber: '',
    // 텔레그램 봇 설정 추가
    telegramBotToken: '',
    telegramChatId: '',
    enableTelegramNotifications: false
  })
  
  // 테스트 결과 상태
  const [testResults, setTestResults] = useState({
    connection: null,
    token: null,
    balance: null,
    price: null
  })
  
  // 컴포넌트 마운트 시 저장된 설정 로드
  useEffect(() => {
    loadSavedSettings()
  }, [])
  
  const loadSavedSettings = () => {
    try {
      const saved = localStorage.getItem('kisApiSettings')
      if (saved) {
        const parsedSettings = JSON.parse(saved)
        setSettings(prev => ({
          ...prev,
          ...parsedSettings,
          // 보안상 시크릿 키는 로컬스토리지에서 로드하지 않음
          demoAppSecret: '',
          realAppSecret: ''
        }))
      }
    } catch (error) {
      console.error('설정 로드 실패:', error)
    }
  }
  
  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const toggleSecretVisibility = (field) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }
  
  const saveSettings = () => {
    try {
      const settingsToSave = {
        ...settings,
        // 보안상 시크릿 키는 저장하지 않음
        demoAppSecret: '',
        realAppSecret: ''
      }
      localStorage.setItem('kisApiSettings', JSON.stringify(settingsToSave))
      
      if (onShowNotification) {
        onShowNotification('✅ KIS API 설정이 저장되었습니다.', 'success')
      }
    } catch (error) {
      console.error('설정 저장 실패:', error)
      if (onShowNotification) {
        onShowNotification('❌ 설정 저장에 실패했습니다.', 'error')
      }
    }
  }
  
  const clearSettings = () => {
    setSettings({
      mockMode: true,
      demoAppKey: '',
      demoAppSecret: '',
      realAppKey: '',
      realAppSecret: '',
      accountNumber: '',
      telegramBotToken: '',
      telegramChatId: '',
      enableTelegramNotifications: false
    })
    setTestResults({
      connection: null,
      token: null,
      balance: null,
      price: null
    })
    localStorage.removeItem('kisApiSettings')
    
    if (onShowNotification) {
      onShowNotification('🗑️ KIS API 설정이 초기화되었습니다.', 'info')
    }
  }
  
  // KIS API 연결 테스트
  const testConnection = async () => {
    setTestLoading(true)
    try {
      const response = await apiService.get('/api/kis/status')
      setTestResults(prev => ({
        ...prev,
        connection: response.data
      }))
      
      if (onShowNotification) {
        onShowNotification(
          `📡 KIS API 연결 상태: ${response.data.connected ? '성공' : '실패'}`,
          response.data.connected ? 'success' : 'error'
        )
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        connection: { connected: false, error: error.message }
      }))
      
      if (onShowNotification) {
        onShowNotification(`❌ 연결 테스트 실패: ${error.message}`, 'error')
      }
    } finally {
      setTestLoading(false)
    }
  }
  
  // OAuth 토큰 테스트
  const testToken = async () => {
    setTestLoading(true)
    try {
      const response = await apiService.post('/api/kis/token/test')
      setTestResults(prev => ({
        ...prev,
        token: response.data
      }))
      
      if (onShowNotification) {
        onShowNotification(
          `🔑 토큰 테스트: ${response.data.hasToken ? '성공' : '실패'}`,
          response.data.hasToken ? 'success' : 'error'
        )
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        token: { hasToken: false, error: error.message }
      }))
      
      if (onShowNotification) {
        onShowNotification(`❌ 토큰 테스트 실패: ${error.message}`, 'error')
      }
    } finally {
      setTestLoading(false)
    }
  }
  
  // 삼성전자 현재가 조회 테스트
  const testStockPrice = async () => {
    setTestLoading(true)
    try {
      const response = await apiService.get('/api/kis/stock/005930/price')
      setTestResults(prev => ({
        ...prev,
        price: response.data
      }))
      
      const price = response.data.output?.stck_prpr || 'N/A'
      if (onShowNotification) {
        onShowNotification(`📈 삼성전자 현재가: ${price}원`, 'success')
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        price: { error: error.message }
      }))
      
      if (onShowNotification) {
        onShowNotification(`❌ 현재가 조회 실패: ${error.message}`, 'error')
      }
    } finally {
      setTestLoading(false)
    }
  }
  
  // 모의주문 테스트
  const testMockOrder = async () => {
    setTestLoading(true)
    try {
      const response = await apiService.post('/api/kis/test/mock-order')
      setTestResults(prev => ({
        ...prev,
        balance: response.data
      }))
      
      if (onShowNotification) {
        onShowNotification(`🎯 모의주문 테스트: ${response.message}`, 'success')
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        balance: { error: error.message }
      }))
      
      if (onShowNotification) {
        onShowNotification(`❌ 모의주문 테스트 실패: ${error.message}`, 'error')
      }
    } finally {
      setTestLoading(false)
    }
  }
  
  const renderTestResult = (result, type) => {
    if (!result) return null
    
    const isSuccess = type === 'connection' ? result.connected : 
                     type === 'token' ? result.hasToken :
                     type === 'price' ? !!result.output :
                     !result.error
    
    const icon = isSuccess ? <CheckCircle color="success" /> : <Error color="error" />
    const color = isSuccess ? 'success' : 'error'
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
        {icon}
        <Typography variant="body2" color={color}>
          {type === 'connection' && (result.connected ? '연결 성공' : `연결 실패: ${result.error}`)}
          {type === 'token' && (result.hasToken ? `토큰 발급 성공 (${result.tokenLength}자)` : `토큰 실패: ${result.error}`)}
          {type === 'price' && (result.output ? `삼성전자: ${result.output.stck_prpr}원` : `조회 실패: ${result.error}`)}
          {type === 'order' && (!result.error ? '모의주문 성공' : `주문 실패: ${result.error}`)}
        </Typography>
      </Box>
    )
  }
  
  return (
    <Card>
      <CardHeader 
        title="📈 KIS API 설정"
        subheader="한국투자증권 API 연동을 위한 설정"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Save />}
              onClick={saveSettings}
              size="small"
            >
              저장
            </Button>
            <Button
              variant="outlined"
              startIcon={<Delete />}
              onClick={clearSettings}
              size="small"
              color="error"
            >
              초기화
            </Button>
          </Box>
        }
      />
      
      <CardContent>
        {/* 환경 선택 */}
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.mockMode}
                onChange={(e) => handleInputChange('mockMode', e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">
                  {settings.mockMode ? '🎮 모의투자 모드' : '💰 실전투자 모드'}
                </Typography>
                <Chip 
                  label={settings.mockMode ? '안전' : '위험'} 
                  size="small" 
                  color={settings.mockMode ? 'success' : 'error'}
                />
              </Box>
            }
          />
          <Typography variant="caption" color="text.secondary" display="block">
            {settings.mockMode 
              ? '가상 자금으로 안전하게 테스트할 수 있습니다.'
              : '⚠️ 실제 자금이 사용됩니다. 충분한 테스트 후 사용하세요.'
            }
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* 탭 네비게이션 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="API 키 설정" />
            <Tab label="연결 테스트" />
            <Tab label="텔레그램 봇" />
            <Tab label="도움말" />
          </Tabs>
        </Box>
        
        {/* API 키 설정 탭 */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* 계좌 정보 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="계좌번호"
                placeholder="50123456-01"
                value={settings.accountNumber}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                helperText="한국투자증권 계좌번호를 입력하세요"
              />
            </Grid>
            
            {/* 모의투자 설정 */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                🎮 모의투자 API 키
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Demo App Key"
                    placeholder="DEMO-PSxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={settings.demoAppKey}
                    onChange={(e) => handleInputChange('demoAppKey', e.target.value)}
                    helperText="DEMO- 로 시작하는 키"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Demo App Secret"
                    type={showSecrets.demoSecret ? 'text' : 'password'}
                    value={settings.demoAppSecret}
                    onChange={(e) => handleInputChange('demoAppSecret', e.target.value)}
                    helperText="모의투자용 시크릿 키"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => toggleSecretVisibility('demoSecret')}
                            edge="end"
                          >
                            {showSecrets.demoSecret ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            {/* 실전투자 설정 */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                💰 실전투자 API 키
                <Chip label="주의 필요" size="small" color="error" />
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                실전투자 키는 실제 자금이 사용되므로 매우 신중하게 관리하세요.
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Real App Key"
                    placeholder="P-xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={settings.realAppKey}
                    onChange={(e) => handleInputChange('realAppKey', e.target.value)}
                    helperText="P- 로 시작하는 키"
                    disabled={settings.mockMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Real App Secret"
                    type={showSecrets.realSecret ? 'text' : 'password'}
                    value={settings.realAppSecret}
                    onChange={(e) => handleInputChange('realAppSecret', e.target.value)}
                    helperText="실전투자용 시크릿 키"
                    disabled={settings.mockMode}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => toggleSecretVisibility('realSecret')}
                            edge="end"
                            disabled={settings.mockMode}
                          >
                            {showSecrets.realSecret ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* 연결 테스트 탭 */}
        <TabPanel value={tabValue} index={1}>
          {testLoading && <LinearProgress sx={{ mb: 2 }} />}
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Security />}
                onClick={testConnection}
                disabled={testLoading}
              >
                연결 테스트
              </Button>
              {renderTestResult(testResults.connection, 'connection')}
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Security />}
                onClick={testToken}
                disabled={testLoading}
              >
                토큰 테스트
              </Button>
              {renderTestResult(testResults.token, 'token')}
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<TrendingUp />}
                onClick={testStockPrice}
                disabled={testLoading}
              >
                현재가 조회
              </Button>
              {renderTestResult(testResults.price, 'price')}
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AccountBalance />}
                onClick={testMockOrder}
                disabled={testLoading || !settings.mockMode}
                color="warning"
              >
                모의주문 테스트
              </Button>
              {renderTestResult(testResults.balance, 'order')}
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              💡 모든 테스트가 성공하면 자동매매 시스템을 사용할 수 있습니다.
            </Typography>
          </Box>
        </TabPanel>
        
        {/* 텔레그램 봇 설정 탭 */}
        <TabPanel value={tabValue} index={2}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              🤖 텔레그램 봇 알림 설정
            </Typography>
            <Typography variant="body2">
              거래 신호, 수익/손실, 시스템 상태를 텔레그램으로 실시간 알림받을 수 있습니다.
            </Typography>
          </Alert>
          
          <Grid container spacing={3}>
            {/* 텔레그램 알림 활성화 */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableTelegramNotifications}
                    onChange={(e) => handleInputChange('enableTelegramNotifications', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      📱 텔레그램 알림 활성화
                    </Typography>
                    <Chip 
                      label={settings.enableTelegramNotifications ? '활성' : '비활성'} 
                      size="small" 
                      color={settings.enableTelegramNotifications ? 'success' : 'default'}
                    />
                  </Box>
                }
              />
            </Grid>
            
            {/* 봇 토큰 설정 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="텔레그램 봇 토큰"
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={settings.telegramBotToken}
                onChange={(e) => handleInputChange('telegramBotToken', e.target.value)}
                type={showSecrets.telegramToken ? 'text' : 'password'}
                helperText="@BotFather에서 발급받은 봇 토큰을 입력하세요"
                disabled={!settings.enableTelegramNotifications}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => toggleSecretVisibility('telegramToken')}
                        edge="end"
                        disabled={!settings.enableTelegramNotifications}
                      >
                        {showSecrets.telegramToken ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            {/* 채팅 ID 설정 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="텔레그램 채팅 ID"
                placeholder="123456789 또는 -123456789"
                value={settings.telegramChatId}
                onChange={(e) => handleInputChange('telegramChatId', e.target.value)}
                helperText="개인 채팅 ID 또는 그룹 채팅 ID를 입력하세요"
                disabled={!settings.enableTelegramNotifications}
              />
            </Grid>
            
            {/* 텔레그램 봇 설정 가이드 */}
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  📋 텔레그램 봇 설정 방법
                </Typography>
                <Typography variant="body2" component="div">
                  <strong>1단계: 봇 생성</strong><br />
                  • 텔레그램에서 @BotFather 검색<br />
                  • /newbot 명령어로 새 봇 생성<br />
                  • 봇 이름과 사용자명 설정<br />
                  • 발급받은 토큰을 위에 입력<br /><br />
                  
                  <strong>2단계: 채팅 ID 확인</strong><br />
                  • 생성한 봇과 대화 시작<br />
                  • /start 메시지 전송<br />
                  • @userinfobot에서 본인 ID 확인<br />
                  • 확인한 ID를 위에 입력<br /><br />
                  
                  <strong>3단계: 테스트</strong><br />
                  • 설정 저장 후 테스트 메시지 전송<br />
                  • 알림이 정상적으로 수신되는지 확인
                </Typography>
              </Box>
            </Grid>
            
            {/* 테스트 버튼 */}
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={async () => {
                  if (!settings.telegramBotToken || !settings.telegramChatId) {
                    if (onShowNotification) {
                      onShowNotification('❌ 봇 토큰과 채팅 ID를 먼저 입력해주세요.', 'error')
                    }
                    return
                  }
                  
                  setTestLoading(true)
                  try {
                    const response = await apiService.post('/api/telegram/send-test-message', {
                      botToken: settings.telegramBotToken,
                      chatId: settings.telegramChatId
                    })
                    
                    if (response.success) {
                      if (onShowNotification) {
                        onShowNotification('🎉 텔레그램 테스트 메시지가 성공적으로 전송되었습니다!', 'success')
                      }
                    } else {
                      if (onShowNotification) {
                        onShowNotification(`❌ 메시지 전송 실패: ${response.message}`, 'error')
                      }
                    }
                  } catch (error) {
                    console.error('텔레그램 테스트 실패:', error)
                    if (onShowNotification) {
                      onShowNotification(`❌ 텔레그램 테스트 실패: ${error.message}`, 'error')
                    }
                  } finally {
                    setTestLoading(false)
                  }
                }}
                disabled={!settings.enableTelegramNotifications || !settings.telegramBotToken || !settings.telegramChatId || testLoading}
                fullWidth
              >
                {testLoading ? '전송 중...' : '📱 테스트 메시지 전송'}
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* 도움말 탭 */}
        <TabPanel value={tabValue} index={3}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              📚 KIS API 키 발급 방법
            </Typography>
          </Alert>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              1️⃣ 한국투자증권 계좌 개설
            </Typography>
            <Typography variant="body2" paragraph>
              • 한국투자증권 홈페이지에서 비대면 계좌 개설<br />
              • 신분증과 핸드폰 인증 필요<br />
              • 계좌 개설 완료까지 1-2일 소요
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              2️⃣ KIS Developers 가입
            </Typography>
            <Typography variant="body2" paragraph>
              • KIS Developers 포털 접속: https://apiportal.koreainvestment.com<br />
              • 회원가입 후 앱 생성<br />
              • 모의투자용 키 먼저 발급 받기
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              3️⃣ 테스트 및 검증
            </Typography>
            <Typography variant="body2" paragraph>
              • 모의투자 환경에서 충분한 테스트<br />
              • 자동매매 전략 검증<br />
              • 안정성 확인 후 실전투자 키 발급
            </Typography>
          </Box>
          
          <Alert severity="warning">
            <Typography variant="body2">
              <strong>⚠️ 중요한 보안 주의사항</strong><br />
              • API 키는 절대 타인과 공유하지 마세요<br />
              • 정기적으로 키를 갱신하세요<br />
              • 실전투자 전 반드시 모의투자에서 테스트하세요<br />
              • 의심스러운 활동 발견 시 즉시 키를 비활성화하세요
            </Typography>
          </Alert>
        </TabPanel>
      </CardContent>
    </Card>
  )
}

export default KISApiSettings 
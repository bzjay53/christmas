import React, { useState, useEffect } from 'react'
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
  Payment,
  Psychology,
  AutoAwesome,
  SmartToy,
  Verified
} from '@mui/icons-material'
import { supabaseHelpers } from '../lib/supabase'
import { StrategyFactory } from '../lib/tradingStrategies'
import { ChristmasAIStrategy } from '../lib/tradingStrategies'
import { OpenAIServiceFactory } from '../lib/openaiService'

function UserProfile({ user, updateUserProfile }) {
  const [activeTab, setActiveTab] = useState(0)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [loadingApiData, setLoadingApiData] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // 사용자 API 설정 상태
  const [apiSettings, setApiSettings] = useState({
    // 한국투자증권 설정
    kis_real_app_key: '',
    kis_real_app_secret: '',
    kis_real_account: '',
    kis_demo_app_key: '',
    kis_demo_app_secret: '',
    kis_demo_account: '',
    kis_mock_mode: true,
    
    // 텔레그램 설정
    telegram_chat_id: '',
    telegram_username: '',
    notification_telegram: false,
    notification_email: true,
    notification_push: true
  })

  // 사용자 설정 상태 (기존 코드 유지)
  const [userSettings, setUserSettings] = useState({
    // 투자 설정
    maxInvestmentAmount: 10000000,
    riskLevel: 'medium',
    autoTradingEnabled: true,
    stopLossPercentage: 5,
    takeProfitPercentage: 10,
    
    // 개인정보
    username: user?.username || user?.firstName || '',
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

  // AI 설정 상태
  const [aiSettings, setAiSettings] = useState({
    openai_api_key: '',
    openai_model: 'gpt-4o-mini',
    ai_learning_enabled: false,
    ai_strategy_level: 'basic',
    ai_risk_tolerance: 0.5,
    ai_learning_data_consent: false,
    // 새로 추가: 전략 선택
    selected_strategy: 'traditional', // 'traditional' or 'ai_learning'
    strategy_auto_switch: false // AI가 상황에 따라 전략 자동 전환
  })

  // 전략 비교 상태
  const [strategyComparison, setStrategyComparison] = useState({
    showComparison: false,
    traditionalPerformance: null,
    aiPerformance: null
  })

  // AI 학습 통계 상태
  const [aiStats, setAiStats] = useState({
    totalRecords: 0,
    trainingRecords: 0,
    validationRecords: 0,
    productionRecords: 0,
    successfulTrades: 0,
    totalProfitLoss: 0,
    avgConfidence: 0,
    lastLearningDate: null
  })

  // AI 전략 테스트 함수 추가
  const [aiTestResults, setAiTestResults] = useState(null)
  const [isTestingAI, setIsTestingAI] = useState(false)
  const [testError, setTestError] = useState(null)

  // 컴포넌트 마운트 시 API 설정 로드
  useEffect(() => {
    loadApiSettings()
  }, [user])

  const loadApiSettings = async () => {
    if (!user?.id) return
    
    try {
      setLoadingApiData(true)
      const apiData = await supabaseHelpers.getUserApiSettings(user.id)
      
      if (apiData) {
        setApiSettings(prev => ({
          ...prev,
          ...apiData
        }))

        // AI 설정 별도 로드
        setAiSettings(prev => ({
          ...prev,
          openai_api_key: apiData.openai_api_key || '',
          openai_model: apiData.openai_model || 'gpt-4o-mini',
          ai_learning_enabled: apiData.ai_learning_enabled || false,
          ai_strategy_level: apiData.ai_strategy_level || 'basic',
          ai_risk_tolerance: apiData.ai_risk_tolerance || 0.5,
          ai_learning_data_consent: apiData.ai_learning_data_consent || false,
          selected_strategy: apiData.selected_strategy || 'traditional',
          strategy_auto_switch: apiData.strategy_auto_switch || false
        }))

        // AI 학습 통계 로드
        if (apiData.ai_learning_enabled) {
          const stats = await supabaseHelpers.getAILearningStats(user.id)
          setAiStats(stats)
        }
      }
    } catch (error) {
      console.error('API 설정 로드 실패:', error)
      setError('API 설정을 불러오는데 실패했습니다.')
    } finally {
      setLoadingApiData(false)
    }
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    setError('')
    setSuccess('')
  }

  const handleSave = async () => {
    setSaveLoading(true)
    setError('')
    
    try {
      // API 키 저장
      if (activeTab === 0) {
        // 한국투자증권 API 키 저장
        const kisData = {
          realAppKey: apiSettings.kis_real_app_key,
          realAppSecret: apiSettings.kis_real_app_secret,
          realAccount: apiSettings.kis_real_account,
          demoAppKey: apiSettings.kis_demo_app_key,
          demoAppSecret: apiSettings.kis_demo_app_secret,
          demoAccount: apiSettings.kis_demo_account,
          mockMode: apiSettings.kis_mock_mode
        }
        
        await supabaseHelpers.saveKISApiKeys(user.id, kisData)
        
        // 텔레그램 설정 저장
        const telegramData = {
          chatId: apiSettings.telegram_chat_id,
          username: apiSettings.telegram_username,
          enabled: apiSettings.notification_telegram
        }
        
        await supabaseHelpers.saveTelegramSettings(user.id, telegramData)
      } else if (activeTab === 4) { // AI 설정 탭
        // OpenAI API 설정 저장
        const openaiData = {
          apiKey: aiSettings.openai_api_key,
          model: aiSettings.openai_model,
          learningEnabled: aiSettings.ai_learning_enabled,
          strategyLevel: aiSettings.ai_strategy_level,
          riskTolerance: aiSettings.ai_risk_tolerance,
          dataConsent: aiSettings.ai_learning_data_consent
        }
        
        await supabaseHelpers.saveOpenAISettings(user.id, openaiData)
      } else {
        // 다른 설정들 저장
        await supabaseHelpers.updateUserProfile(user.id, {
          first_name: userSettings.username.split(' ')[0] || userSettings.username,
          last_name: userSettings.username.split(' ').slice(1).join(' ') || '',
          notification_email: apiSettings.notification_email,
          notification_push: apiSettings.notification_push
        })
      }
      
      setSuccess('설정이 성공적으로 저장되었습니다!')
      setEditMode(false)
      
      // API 설정 다시 로드
      await loadApiSettings()
      
    } catch (err) {
      console.error('설정 저장 실패:', err)
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

  // 실제 AI 매매 엔진 테스트
  const testAIStrategy = async () => {
    if (!aiSettings.openai_api_key) {
      setTestError('OpenAI API 키가 설정되지 않았습니다.')
      return
    }

    setIsTestingAI(true)
    setTestError(null)
    setAiTestResults(null)

    try {
      // 테스트용 시장 데이터 생성 (실제 환경에서는 실시간 데이터 사용)
      const mockMarketData = {
        symbol: 'KOSPI200',
        timestamp: Date.now(),
        prices: [
          2580, 2585, 2590, 2588, 2592, 2595, 2598, 2600, 2605, 2603,
          2608, 2610, 2615, 2612, 2618, 2620, 2625, 2628, 2630, 2635
        ],
        volume: [
          1000000, 1200000, 1100000, 1300000, 1150000, 1400000, 1250000,
          1350000, 1500000, 1450000, 1600000, 1550000, 1700000, 1650000,
          1800000, 1750000, 1900000, 1850000, 2000000, 1950000
        ]
      }

      // AI 전략 인스턴스 생성
      const aiStrategy = new ChristmasAIStrategy({
        strategyType: aiSettings.selected_strategy || 'ai_learning',
        learningEnabled: true,
        riskTolerance: 0.6,
        strategyLevel: aiSettings.openai_model === 'gpt-4o' ? 'expert' : 'intermediate',
        openaiModel: aiSettings.openai_model || 'gpt-4o-mini'
      })

      console.log('AI 전략 테스트 시작...', {
        strategy: aiSettings.selected_strategy,
        model: aiSettings.openai_model
      })

      // 전통적 신호 생성
      const traditionalSignal = aiStrategy.generateTraditionalSignal(mockMarketData)
      
      // AI 신호 생성 (실제 OpenAI API 호출)
      const aiSignal = await aiStrategy.generateAISignal(mockMarketData, aiSettings.openai_api_key)

      // 결과 정리
      const testResults = {
        timestamp: new Date().toISOString(),
        marketData: {
          symbol: mockMarketData.symbol,
          currentPrice: mockMarketData.prices[mockMarketData.prices.length - 1],
          priceChange: ((mockMarketData.prices[19] - mockMarketData.prices[18]) / mockMarketData.prices[18] * 100).toFixed(2),
          volume: mockMarketData.volume[mockMarketData.volume.length - 1].toLocaleString()
        },
        traditionalSignal: {
          action: traditionalSignal.action,
          confidence: (traditionalSignal.confidence * 100).toFixed(1),
          reasoning: traditionalSignal.reasoning
        },
        aiSignal: {
          action: aiSignal.action,
          confidence: (aiSignal.confidence * 100).toFixed(1),
          reasoning: aiSignal.reasoning,
          riskLevel: aiSignal.riskLevel,
          positionSize: aiSignal.positionSize,
          timeHorizon: aiSignal.timeHorizon,
          marketCondition: aiSignal.marketCondition,
          additionalFactors: aiSignal.metadata?.aiEnhancement || {}
        },
        comparison: {
          actionMatch: traditionalSignal.action === aiSignal.action,
          confidenceDiff: ((aiSignal.confidence - traditionalSignal.confidence) * 100).toFixed(1),
          aiEnhancement: aiSignal.metadata?.aiEnhancement || {}
        },
        usage: aiSignal.metadata?.usage || {},
        strategyStatus: aiStrategy.getStrategyStatus()
      }

      setAiTestResults(testResults)
      
      // 성공 메시지
      showNotification('AI 매매 전략 테스트가 완료되었습니다!', 'success')

    } catch (error) {
      console.error('AI 전략 테스트 오류:', error)
      setTestError(`테스트 실패: ${error.message}`)
      showNotification('AI 전략 테스트 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsTestingAI(false)
    }
  }

  // OpenAI API 키 유효성 검증
  const validateOpenAIKey = async () => {
    if (!aiSettings.openai_api_key) {
      setTestError('API 키를 먼저 입력해주세요.')
      return
    }

    setIsTestingAI(true)
    setTestError(null)

    try {
      const openaiService = OpenAIServiceFactory.getInstance(aiSettings.openai_api_key)
      const validation = await openaiService.validateApiKey()
      
      if (validation.valid) {
        showNotification('OpenAI API 키가 유효합니다!', 'success')
        setTestError(null)
      } else {
        setTestError(`API 키 검증 실패: ${validation.error}`)
        showNotification('OpenAI API 키가 유효하지 않습니다.', 'error')
      }
    } catch (error) {
      setTestError(`검증 오류: ${error.message}`)
      showNotification('API 키 검증 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsTestingAI(false)
    }
  }

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
          <Tab label="AI 자체학습" icon={<Psychology />} />
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
              {/* 실전투자 설정 */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  💰 실전투자 설정
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="실전 API Key"
                  type={showApiKey ? 'text' : 'password'}
                  value={showApiKey ? apiSettings.kis_real_app_key : maskApiKey(apiSettings.kis_real_app_key)}
                  onChange={(e) => setApiSettings({...apiSettings, kis_real_app_key: e.target.value})}
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
                  label="실전 Secret Key"
                  type={showSecretKey ? 'text' : 'password'}
                  value={showSecretKey ? apiSettings.kis_real_app_secret : maskApiKey(apiSettings.kis_real_app_secret)}
                  onChange={(e) => setApiSettings({...apiSettings, kis_real_app_secret: e.target.value})}
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
                  label="실전 계좌번호"
                  value={apiSettings.kis_real_account}
                  onChange={(e) => setApiSettings({...apiSettings, kis_real_account: e.target.value})}
                  disabled={!editMode}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              {/* 모의투자 설정 */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                  🎮 모의투자 설정
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="모의 API Key"
                  type={showApiKey ? 'text' : 'password'}
                  value={showApiKey ? apiSettings.kis_demo_app_key : maskApiKey(apiSettings.kis_demo_app_key)}
                  onChange={(e) => setApiSettings({...apiSettings, kis_demo_app_key: e.target.value})}
                  disabled={!editMode}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="모의 Secret Key"
                  type={showSecretKey ? 'text' : 'password'}
                  value={showSecretKey ? apiSettings.kis_demo_app_secret : maskApiKey(apiSettings.kis_demo_app_secret)}
                  onChange={(e) => setApiSettings({...apiSettings, kis_demo_app_secret: e.target.value})}
                  disabled={!editMode}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="모의 계좌번호"
                  value={apiSettings.kis_demo_account}
                  onChange={(e) => setApiSettings({...apiSettings, kis_demo_account: e.target.value})}
                  disabled={!editMode}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              {/* 운영 모드 선택 */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>운영 모드</InputLabel>
                  <Select
                    value={apiSettings.kis_mock_mode ? 'demo' : 'real'}
                    label="운영 모드"
                    onChange={(e) => setApiSettings({...apiSettings, kis_mock_mode: e.target.value === 'demo'})}
                    disabled={!editMode}
                  >
                    <MenuItem value="demo">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography color="warning.main">🎮</Typography>
                        <Typography>모의투자 모드 (안전)</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="real">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography color="error">⚠️</Typography>
                        <Typography>실전투자 모드 (실제 거래)</Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* 텔레그램 알림 설정 */}
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              📱 텔레그램 알림 설정
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="텔레그램 채팅 ID"
                  value={apiSettings.telegram_chat_id}
                  onChange={(e) => setApiSettings({...apiSettings, telegram_chat_id: e.target.value})}
                  disabled={!editMode}
                  sx={{ mb: 2 }}
                  helperText="@christmas_auto_bot에서 /start 명령으로 확인"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="텔레그램 사용자명 (선택)"
                  value={apiSettings.telegram_username}
                  onChange={(e) => setApiSettings({...apiSettings, telegram_username: e.target.value})}
                  disabled={!editMode}
                  sx={{ mb: 2 }}
                  helperText="@username 형태"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={apiSettings.notification_telegram}
                      onChange={(e) => setApiSettings({...apiSettings, notification_telegram: e.target.checked})}
                      disabled={!editMode}
                    />
                  }
                  label="텔레그램 알림 활성화"
                />
              </Grid>
            </Grid>

            {/* API 연결 상태 */}
            <Divider sx={{ my: 3 }} />
            <Box display="flex" alignItems="center" gap={2}>
              <CheckCircle color="success" />
              <Typography variant="body1">
                API 연결 상태: <strong>{loadingApiData ? '로드 중...' : apiSettings.kis_mock_mode ? '데모 모드' : '정상'}</strong>
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
                      checked={apiSettings.notification_telegram}
                      onChange={(e) => setApiSettings({...apiSettings, notification_telegram: e.target.checked})}
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
                      checked={apiSettings.notification_email}
                      onChange={(e) => setApiSettings({...apiSettings, notification_email: e.target.checked})}
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
                      checked={apiSettings.notification_push}
                      onChange={(e) => setApiSettings({...apiSettings, notification_push: e.target.checked})}
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

      {/* AI 자체학습 탭 */}
      {activeTab === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology />
              🤖 Christmas AI 자체학습 매매 시스템
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>🎯 Christmas AI 전략:</strong> 기존 검증된 기술적 지표(RSI, MACD, 볼린저 밴드)에서 시작하여 
                OpenAI를 통해 고차원 패턴을 학습하고 진화하는 매매 시스템입니다.
              </Typography>
            </Alert>

            {/* 전략 선택 섹션 */}
            <Typography variant="subtitle1" gutterBottom sx={{ color: 'success.main', fontWeight: 'bold', mt: 3 }}>
              📊 매매 전략 선택
            </Typography>
            <Grid container spacing={3}>
              {StrategyFactory.getAvailableStrategies().map((strategy) => (
                <Grid item xs={12} md={6} key={strategy.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      border: aiSettings.selected_strategy === strategy.id ? '2px solid' : '1px solid',
                      borderColor: aiSettings.selected_strategy === strategy.id ? 'primary.main' : 'divider',
                      cursor: editMode ? 'pointer' : 'default',
                      '&:hover': editMode ? { borderColor: 'primary.main' } : {}
                    }}
                    onClick={() => editMode && setAiSettings({...aiSettings, selected_strategy: strategy.id})}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="h6" color={strategy.risk === 'low' ? 'success.main' : 'warning.main'}>
                          {strategy.name}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip 
                            label={strategy.complexity} 
                            size="small" 
                            color={strategy.complexity === 'simple' ? 'success' : 'warning'} 
                          />
                          {aiSettings.selected_strategy === strategy.id && (
                            <CheckCircle color="primary" />
                          )}
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {strategy.description}
                      </Typography>
                      <Box>
                        {strategy.features.map((feature, index) => (
                          <Chip
                            key={index}
                            label={feature}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* 고급 전략 설정 */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={aiSettings.strategy_auto_switch}
                      onChange={(e) => setAiSettings({...aiSettings, strategy_auto_switch: e.target.checked})}
                      disabled={!editMode}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="bold">자동 전략 전환</Typography>
                      <Typography variant="caption" color="text.secondary">
                        시장 상황에 따라 AI가 최적 전략 자동 선택
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  startIcon={<AutoAwesome />}
                  fullWidth
                  onClick={() => setStrategyComparison({...strategyComparison, showComparison: !strategyComparison.showComparison})}
                >
                  전략 성과 비교
                </Button>
              </Grid>
            </Grid>

            {/* 전략 비교 섹션 */}
            {strategyComparison.showComparison && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle1" gutterBottom sx={{ color: 'info.main', fontWeight: 'bold' }}>
                  📈 전략별 성과 비교 (최근 30일)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" color="success.main" gutterBottom>
                          전통적 지표 전략
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">승률</Typography>
                            <Typography variant="h6">65.4%</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">수익률</Typography>
                            <Typography variant="h6" color="success.main">+12.3%</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">총 거래</Typography>
                            <Typography variant="h6">127건</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">샤프 비율</Typography>
                            <Typography variant="h6">1.45</Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" color="warning.main" gutterBottom>
                          Christmas AI 전략
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">승률</Typography>
                            <Typography variant="h6">72.8%</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">수익률</Typography>
                            <Typography variant="h6" color="success.main">+18.7%</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">총 거래</Typography>
                            <Typography variant="h6">98건</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">샤프 비율</Typography>
                            <Typography variant="h6">1.89</Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>💡 분석:</strong> AI 전략이 더 높은 승률과 수익률을 보이지만, 
                    학습 기간이 짧아 추가 검증이 필요합니다. 자동 전환 모드 권장.
                  </Typography>
                </Alert>
              </>
            )}

            {/* OpenAI API 설정 (기존 조건부 표시) */}
            {(aiSettings.selected_strategy === 'ai_learning' || aiSettings.strategy_auto_switch) && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle1" gutterBottom sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                  🔑 OpenAI API 설정
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label="OpenAI API Key"
                      type={showApiKey ? 'text' : 'password'}
                      value={aiSettings.openai_api_key}
                      onChange={(e) => setAiSettings({...aiSettings, openai_api_key: e.target.value})}
                      disabled={!editMode}
                      placeholder="sk-proj-..."
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
                      helperText="AI 전략 사용 시 OpenAI API 키가 필요합니다."
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>AI 모델</InputLabel>
                      <Select
                        value={aiSettings.openai_model}
                        label="AI 모델"
                        onChange={(e) => setAiSettings({...aiSettings, openai_model: e.target.value})}
                        disabled={!editMode}
                      >
                        <MenuItem value="gpt-4o-mini">GPT-4o Mini (경제적)</MenuItem>
                        <MenuItem value="gpt-4o">GPT-4o (고성능)</MenuItem>
                        <MenuItem value="gpt-4-turbo">GPT-4 Turbo (균형)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </>
            )}

            {/* AI 학습 설정 (기존 코드 유지) */}
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" gutterBottom sx={{ color: 'success.main', fontWeight: 'bold' }}>
              🧠 AI 학습 전략 설정
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>전략 수준</InputLabel>
                  <Select
                    value={aiSettings.ai_strategy_level}
                    label="전략 수준"
                    onChange={(e) => setAiSettings({...aiSettings, ai_strategy_level: e.target.value})}
                    disabled={!editMode}
                  >
                    <MenuItem value="basic">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography>🟢 Basic</Typography>
                        <Typography variant="caption">- RSI+MACD+BB 기본</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="intermediate">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography>🟡 Intermediate</Typography>
                        <Typography variant="caption">- 복합 지표 + 거래량</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="advanced">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography>🟠 Advanced</Typography>
                        <Typography variant="caption">- 다중 시간프레임</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="expert">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography>🔴 Expert</Typography>
                        <Typography variant="caption">- AI 자율 패턴 발견</Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>
                  위험 허용도: {Math.round(aiSettings.ai_risk_tolerance * 100)}%
                </Typography>
                <Box sx={{ px: 2 }}>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={aiSettings.ai_risk_tolerance}
                    onChange={(e) => setAiSettings({...aiSettings, ai_risk_tolerance: parseFloat(e.target.value)})}
                    disabled={!editMode}
                    style={{ width: '100%' }}
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  <span>보수적 (전통 지표 위주)</span>
                  <span>공격적 (AI 신호 위주)</span>
                </Box>
              </Grid>
            </Grid>

            {/* AI 활성화 및 동의 설정 */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={aiSettings.ai_learning_enabled}
                      onChange={(e) => setAiSettings({...aiSettings, ai_learning_enabled: e.target.checked})}
                      disabled={!editMode}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="bold">AI 자체학습 활성화</Typography>
                      <Typography variant="caption" color="text.secondary">실시간 시장 데이터로 전략 학습</Typography>
                    </Box>
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={aiSettings.ai_learning_data_consent}
                      onChange={(e) => setAiSettings({...aiSettings, ai_learning_data_consent: e.target.checked})}
                      disabled={!editMode}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="bold">학습 데이터 수집 동의</Typography>
                      <Typography variant="caption" color="text.secondary">익명화된 패턴 학습용 데이터 제공</Typography>
                    </Box>
                  }
                />
              </Grid>
            </Grid>

            {/* AI 학습 통계 */}
            {aiSettings.ai_learning_enabled && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle1" gutterBottom sx={{ color: 'info.main', fontWeight: 'bold' }}>
                  📊 AI 학습 현황
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" color="primary">{aiStats.totalRecords}</Typography>
                        <Typography variant="caption">총 학습 데이터</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" color="success.main">{aiStats.successfulTrades}</Typography>
                        <Typography variant="caption">성공한 매매</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" color={aiStats.totalProfitLoss >= 0 ? 'success.main' : 'error.main'}>
                          {aiStats.totalProfitLoss >= 0 ? '+' : ''}{Math.round(aiStats.totalProfitLoss).toLocaleString()}
                        </Typography>
                        <Typography variant="caption">총 손익 (원)</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" color="info.main">
                          {Math.round(aiStats.avgConfidence * 100)}%
                        </Typography>
                        <Typography variant="caption">평균 신뢰도</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </>
            )}

            {/* AI 시스템 상태 */}
            <Divider sx={{ my: 3 }} />
            <Box display="flex" alignItems="center" gap={2}>
              {aiSettings.ai_learning_enabled && aiSettings.openai_api_key ? (
                <CheckCircle color="success" />
              ) : (
                <Warning color="warning" />
              )}
              <Typography variant="body1">
                AI 시스템 상태: <strong>
                  {aiSettings.ai_learning_enabled && aiSettings.openai_api_key 
                    ? '✅ 활성화됨' 
                    : '⚠️ 설정 필요'
                  }
                </strong>
              </Typography>
              <Button variant="outlined" size="small" disabled={!aiSettings.ai_learning_enabled}>
                AI 학습 테스트
              </Button>
            </Box>

            {/* AI 전략 테스트 섹션 */}
            {aiSettings.selected_strategy === 'ai_learning' && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SmartToy sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">🤖 AI 매매 전략 실시간 테스트</Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    실제 OpenAI API를 사용하여 AI 매매 전략을 테스트해보세요. 
                    전통적 지표와 AI 분석을 비교할 수 있습니다.
                  </Typography>

                  {/* API 키 검증 버튼 */}
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={validateOpenAIKey}
                      disabled={isTestingAI || !aiSettings.openai_api_key}
                      startIcon={<Verified />}
                      sx={{ mr: 2 }}
                    >
                      API 키 검증
                    </Button>
                    
                    <Button
                      variant="contained"
                      onClick={testAIStrategy}
                      disabled={isTestingAI || !aiSettings.openai_api_key}
                      startIcon={isTestingAI ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                      color="primary"
                    >
                      {isTestingAI ? 'AI 분석 중...' : 'AI 전략 테스트 실행'}
                    </Button>
                  </Box>

                  {/* 오류 메시지 */}
                  {testError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {testError}
                    </Alert>
                  )}

                  {/* 테스트 결과 표시 */}
                  {aiTestResults && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
                        ✅ AI 분석 완료 ({new Date(aiTestResults.timestamp).toLocaleString('ko-KR')})
                      </Typography>

                      {/* 시장 데이터 */}
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ mb: 1 }}>📊 테스트 시장 데이터</Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary">종목</Typography>
                              <Typography variant="body1">{aiTestResults.marketData.symbol}</Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary">현재가</Typography>
                              <Typography variant="body1">
                                {aiTestResults.marketData.currentPrice.toLocaleString()}원
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary">등락률</Typography>
                              <Typography 
                                variant="body1" 
                                color={parseFloat(aiTestResults.marketData.priceChange) >= 0 ? 'success.main' : 'error.main'}
                              >
                                {aiTestResults.marketData.priceChange > 0 ? '+' : ''}{aiTestResults.marketData.priceChange}%
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary">거래량</Typography>
                              <Typography variant="body1">{aiTestResults.marketData.volume}</Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>

                      {/* 신호 비교 */}
                      <Grid container spacing={2}>
                        {/* 전통적 신호 */}
                        <Grid item xs={12} md={6}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle1" sx={{ mb: 2 }}>📈 전통적 지표 분석</Typography>
                              
                              <Box sx={{ mb: 2 }}>
                                <Chip 
                                  label={aiTestResults.traditionalSignal.action === 'buy' ? '매수' : 
                                        aiTestResults.traditionalSignal.action === 'sell' ? '매도' : '관망'}
                                  color={aiTestResults.traditionalSignal.action === 'buy' ? 'success' : 
                                         aiTestResults.traditionalSignal.action === 'sell' ? 'error' : 'default'}
                                  sx={{ mr: 1 }}
                                />
                                <Chip 
                                  label={`신뢰도 ${aiTestResults.traditionalSignal.confidence}%`}
                                  variant="outlined"
                                />
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary">
                                {aiTestResults.traditionalSignal.reasoning}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>

                        {/* AI 신호 */}
                        <Grid item xs={12} md={6}>
                          <Card variant="outlined" sx={{ border: '2px solid', borderColor: 'primary.main' }}>
                            <CardContent>
                              <Typography variant="subtitle1" sx={{ mb: 2, color: 'primary.main' }}>
                                🤖 AI 고차원 분석
                              </Typography>
                              
                              <Box sx={{ mb: 2 }}>
                                <Chip 
                                  label={aiTestResults.aiSignal.action === 'buy' ? '매수' : 
                                        aiTestResults.aiSignal.action === 'sell' ? '매도' : '관망'}
                                  color={aiTestResults.aiSignal.action === 'buy' ? 'success' : 
                                         aiTestResults.aiSignal.action === 'sell' ? 'error' : 'default'}
                                  sx={{ mr: 1 }}
                                />
                                <Chip 
                                  label={`신뢰도 ${aiTestResults.aiSignal.confidence}%`}
                                  variant="outlined"
                                  sx={{ mr: 1 }}
                                />
                                <Chip 
                                  label={`리스크 ${aiTestResults.aiSignal.riskLevel}`}
                                  size="small"
                                  color={aiTestResults.aiSignal.riskLevel === 'high' ? 'error' : 
                                         aiTestResults.aiSignal.riskLevel === 'low' ? 'success' : 'warning'}
                                />
                              </Box>

                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {aiTestResults.aiSignal.reasoning.split('\n\n')[0]} {/* AI 분석 부분만 표시 */}
                              </Typography>

                              {/* AI 추가 정보 */}
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                  포지션 크기: {(aiTestResults.aiSignal.positionSize * 100).toFixed(0)}% | 
                                  시간 범위: {aiTestResults.aiSignal.timeHorizon} | 
                                  시장 상황: {aiTestResults.aiSignal.marketCondition}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>

                      {/* 비교 분석 */}
                      <Card variant="outlined" sx={{ mt: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ mb: 2 }}>🔍 AI vs 전통적 분석 비교</Typography>
                          
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2" color="text.secondary">신호 일치도</Typography>
                              <Typography variant="body1">
                                {aiTestResults.comparison.actionMatch ? '✅ 일치' : '❌ 불일치'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2" color="text.secondary">신뢰도 변화</Typography>
                              <Typography 
                                variant="body1"
                                color={parseFloat(aiTestResults.comparison.confidenceDiff) >= 0 ? 'success.main' : 'error.main'}
                              >
                                {aiTestResults.comparison.confidenceDiff > 0 ? '+' : ''}{aiTestResults.comparison.confidenceDiff}%
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2" color="text.secondary">AI 모델</Typography>
                              <Typography variant="body1">{aiTestResults.strategyStatus.openaiModel}</Typography>
                            </Grid>
                          </Grid>

                          {/* AI 추가 고려사항 */}
                          {aiTestResults.aiSignal.additionalFactors.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                AI 추가 고려사항:
                              </Typography>
                              {aiTestResults.aiSignal.additionalFactors.map((factor, index) => (
                                <Chip 
                                  key={index}
                                  label={factor}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mr: 1, mb: 1 }}
                                />
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </Card>

                      {/* 사용량 정보 */}
                      {aiTestResults.usage && (
                        <Card variant="outlined" sx={{ mt: 2 }}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ mb: 2 }}>💰 API 사용량 정보</Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="body2" color="text.secondary">예상 토큰</Typography>
                                <Typography variant="body1">{aiTestResults.usage.estimatedTokens}</Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="body2" color="text.secondary">예상 비용 (USD)</Typography>
                                <Typography variant="body1">${aiTestResults.usage.estimatedCostUSD?.toFixed(4)}</Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="body2" color="text.secondary">예상 비용 (KRW)</Typography>
                                <Typography variant="body1">{aiTestResults.usage.estimatedCostKRW}원</Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="body2" color="text.secondary">분석 횟수</Typography>
                                <Typography variant="body1">{aiTestResults.strategyStatus.analysisCount}회</Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
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
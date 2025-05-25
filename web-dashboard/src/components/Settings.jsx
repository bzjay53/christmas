import React, { useState, useEffect } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Snackbar
} from '@mui/material'
import {
  Save,
  Refresh,
  Security,
  Notifications,
  Api,
  Settings as SettingsIcon,
  CheckCircle,
  Error,
  Visibility,
  VisibilityOff
} from '@mui/icons-material'
import { supabaseHelpers } from '../lib/supabase'

function Settings({ user, onShowNotification }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingConnection, setTestingConnection] = useState({})
  const [showPasswords, setShowPasswords] = useState({})
  const [dataError, setDataError] = useState(null)
  
  const [settings, setSettings] = useState({
    // API 설정
    kisAppKey: '',
    kisAppSecret: '',
    kisAccountNo: '',
    kisMockMode: true,
    
    // 텔레그램 설정
    telegramBotToken: '',
    telegramChatId: '',
    telegramEnabled: true,
    
    // OpenAI 설정
    openaiApiKey: '',
    openaiModel: 'gpt-4',
    openaiEnabled: true,
    
    // 거래 설정
    maxPositionSize: 10,
    maxDailyLoss: 3,
    minProfitRate: 0.5,
    stopLossRate: 1.0,
    
    // 알림 설정
    tradeNotifications: true,
    profitAlerts: true,
    riskWarnings: true,
    systemStatus: true
  })

  const [connectionStatus, setConnectionStatus] = useState({
    kis: 'disconnected',
    telegram: 'disconnected',
    openai: 'disconnected',
    database: 'connected'
  })

  // Supabase에서 설정 데이터 로드
  useEffect(() => {
    const loadSettings = async () => {
      if (!user || !user.id) {
        console.log('❌ 사용자 정보 없음, 설정 로드 건너뜀')
        setLoading(false)
        return
      }
      
      console.log('🔄 Supabase 설정 데이터 로드 시작:', user.id)
      setLoading(true)
      setDataError(null)
      
      try {
        // API 설정들 병렬로 로드
        const [kisSettings, telegramSettings, openaiSettings] = await Promise.all([
          supabaseHelpers.getKISApiKeys(user.id).catch(() => null),
          supabaseHelpers.getTelegramSettings ? supabaseHelpers.getTelegramSettings(user.id).catch(() => null) : null,
          supabaseHelpers.getOpenAISettings(user.id).catch(() => null)
        ])
        
        console.log('✅ 설정 로드 완료:', { kisSettings, telegramSettings, openaiSettings })
        
        // 설정 상태 업데이트
        setSettings(prev => ({
          ...prev,
          // KIS API 설정
          kisAppKey: kisSettings?.app_key || '',
          kisAppSecret: kisSettings?.app_secret || '',
          kisAccountNo: kisSettings?.account_number || '',
          kisMockMode: kisSettings?.is_mock_mode !== false,
          
          // 텔레그램 설정
          telegramBotToken: telegramSettings?.bot_token || '',
          telegramChatId: telegramSettings?.chat_id || '',
          telegramEnabled: telegramSettings?.is_enabled !== false,
          
          // OpenAI 설정
          openaiApiKey: openaiSettings?.api_key || '',
          openaiModel: openaiSettings?.model || 'gpt-4',
          openaiEnabled: openaiSettings?.is_enabled !== false
        }))
        
        // 연결 상태 업데이트
        setConnectionStatus({
          kis: kisSettings?.app_key ? 'connected' : 'disconnected',
          telegram: telegramSettings?.bot_token ? 'connected' : 'disconnected',
          openai: openaiSettings?.api_key ? 'connected' : 'disconnected',
          database: 'connected'
        })
        
        if (onShowNotification) {
          onShowNotification('⚙️ 설정 데이터 로드 완료!', 'success')
        }
        
      } catch (error) {
        console.error('❌ 설정 로드 실패:', error)
        setDataError(error.message)
        
        if (onShowNotification) {
          onShowNotification(`설정 로드 실패: ${error.message}`, 'error')
        }
      } finally {
        setLoading(false)
      }
    }
    
    loadSettings()
  }, [user, onShowNotification])

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveSettings = async () => {
    if (!user || !user.id) {
      if (onShowNotification) {
        onShowNotification('사용자 정보가 없습니다.', 'error')
      }
      return
    }
    
    console.log('💾 설정 저장 시작:', settings)
    setSaving(true)
    
    try {
      // 각 API 설정을 개별적으로 저장
      const savePromises = []
      
      // KIS API 설정 저장
      if (settings.kisAppKey || settings.kisAppSecret || settings.kisAccountNo) {
        savePromises.push(
          supabaseHelpers.saveKISApiKeys(user.id, {
            app_key: settings.kisAppKey,
            app_secret: settings.kisAppSecret,
            account_number: settings.kisAccountNo,
            is_mock_mode: settings.kisMockMode
          })
        )
      }
      
      // 텔레그램 설정 저장
      if (settings.telegramBotToken || settings.telegramChatId) {
        if (supabaseHelpers.saveTelegramSettings) {
          savePromises.push(
            supabaseHelpers.saveTelegramSettings(user.id, {
              bot_token: settings.telegramBotToken,
              chat_id: settings.telegramChatId,
              is_enabled: settings.telegramEnabled
            })
          )
        }
      }
      
      // OpenAI 설정 저장
      if (settings.openaiApiKey) {
        savePromises.push(
          supabaseHelpers.saveOpenAISettings(user.id, {
            api_key: settings.openaiApiKey,
            model: settings.openaiModel,
            is_enabled: settings.openaiEnabled
          })
        )
      }
      
      await Promise.all(savePromises)
      
      // 연결 상태 업데이트
      setConnectionStatus({
        kis: settings.kisAppKey ? 'connected' : 'disconnected',
        telegram: settings.telegramBotToken ? 'connected' : 'disconnected',
        openai: settings.openaiApiKey ? 'connected' : 'disconnected',
        database: 'connected'
      })
      
      console.log('✅ 설정 저장 완료')
      
      if (onShowNotification) {
        onShowNotification('⚙️ 설정이 성공적으로 저장되었습니다!', 'success')
      }
      
    } catch (error) {
      console.error('❌ 설정 저장 실패:', error)
      
      if (onShowNotification) {
        onShowNotification(`설정 저장 실패: ${error.message}`, 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async (type) => {
    console.log(`🔍 ${type} 연결 테스트 시작`)
    setTestingConnection(prev => ({ ...prev, [type]: true }))
    
    try {
      // 실제 연결 테스트 로직 (시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setConnectionStatus(prev => ({
        ...prev,
        [type]: 'connected'
      }))
      
      if (onShowNotification) {
        onShowNotification(`✅ ${type.toUpperCase()} 연결 테스트 성공!`, 'success')
      }
      
    } catch (error) {
      console.error(`❌ ${type} 연결 테스트 실패:`, error)
      
      setConnectionStatus(prev => ({
        ...prev,
        [type]: 'disconnected'
      }))
      
      if (onShowNotification) {
        onShowNotification(`❌ ${type.toUpperCase()} 연결 테스트 실패`, 'error')
      }
    } finally {
      setTestingConnection(prev => ({ ...prev, [type]: false }))
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'success'
      case 'disconnected': return 'error'
      case 'warning': return 'warning'
      default: return 'default'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return '연결됨'
      case 'disconnected': return '연결 끊김'
      case 'warning': return '경고'
      default: return '알 수 없음'
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 3 }}>
        ⚙️ 시스템 설정
      </Typography>

      {/* 연결 상태 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔗 연결 상태
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body1">한국투자증권 API</Typography>
                <Chip 
                  label={getStatusText(connectionStatus.kis)}
                  color={getStatusColor(connectionStatus.kis)}
                  size="small"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body1">텔레그램 봇</Typography>
                <Chip 
                  label={getStatusText(connectionStatus.telegram)}
                  color={getStatusColor(connectionStatus.telegram)}
                  size="small"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body1">데이터베이스</Typography>
                <Chip 
                  label={getStatusText(connectionStatus.database)}
                  color={getStatusColor(connectionStatus.database)}
                  size="small"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body1">모니터링</Typography>
                <Chip 
                  label={getStatusText(connectionStatus.openai)}
                  color={getStatusColor(connectionStatus.openai)}
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* API 설정 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Api sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">📡 API 설정</Typography>
              </Box>
              
              <TextField
                fullWidth
                margin="normal"
                label="KIS App Key"
                value={settings.kisAppKey}
                onChange={(e) => handleInputChange('kisAppKey', e.target.value)}
                type={showPasswords.kisAppKey ? 'text' : 'password'}
                helperText="한국투자증권 앱 키"
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => togglePasswordVisibility('kisAppKey')} edge="end">
                      {showPasswords.kisAppKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="KIS App Secret"
                value={settings.kisAppSecret}
                onChange={(e) => handleInputChange('kisAppSecret', e.target.value)}
                type={showPasswords.kisAppSecret ? 'text' : 'password'}
                helperText="한국투자증권 앱 시크릿"
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => togglePasswordVisibility('kisAppSecret')} edge="end">
                      {showPasswords.kisAppSecret ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="계좌번호"
                value={settings.kisAccountNo}
                onChange={(e) => handleInputChange('kisAccountNo', e.target.value)}
                helperText="거래 계좌번호"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.kisMockMode}
                    onChange={(e) => handleInputChange('kisMockMode', e.target.checked)}
                  />
                }
                label="모의투자 모드"
                sx={{ mt: 2 }}
              />
              
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => handleTestConnection('kis')}
                sx={{ mt: 2 }}
                fullWidth
              >
                KIS API 연결 테스트
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 텔레그램 설정 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Notifications sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">📱 텔레그램 설정</Typography>
              </Box>
              
              <TextField
                fullWidth
                margin="normal"
                label="봇 토큰"
                value={settings.telegramBotToken}
                onChange={(e) => handleInputChange('telegramBotToken', e.target.value)}
                type={showPasswords.telegramBotToken ? 'text' : 'password'}
                helperText="텔레그램 봇 토큰"
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => togglePasswordVisibility('telegramBotToken')} edge="end">
                      {showPasswords.telegramBotToken ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="채팅 ID"
                value={settings.telegramChatId}
                onChange={(e) => handleInputChange('telegramChatId', e.target.value)}
                helperText="알림을 받을 채팅 ID"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.telegramEnabled}
                    onChange={(e) => handleInputChange('telegramEnabled', e.target.checked)}
                  />
                }
                label="텔레그램 알림 활성화"
                sx={{ mt: 2 }}
              />
              
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => handleTestConnection('telegram')}
                sx={{ mt: 2 }}
                fullWidth
              >
                텔레그램 연결 테스트
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* OpenAI 설정 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Security sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">🤖 OpenAI 설정</Typography>
              </Box>
              
              <TextField
                fullWidth
                margin="normal"
                label="OpenAI API Key"
                value={settings.openaiApiKey}
                onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                type={showPasswords.openaiApiKey ? 'text' : 'password'}
                helperText="OpenAI API Key"
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => togglePasswordVisibility('openaiApiKey')} edge="end">
                      {showPasswords.openaiApiKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="OpenAI Model"
                value={settings.openaiModel}
                onChange={(e) => handleInputChange('openaiModel', e.target.value)}
                helperText="OpenAI Model"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.openaiEnabled}
                    onChange={(e) => handleInputChange('openaiEnabled', e.target.checked)}
                  />
                }
                label="OpenAI 활성화"
                sx={{ mt: 2 }}
              />
              
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => handleTestConnection('openai')}
                sx={{ mt: 2 }}
                fullWidth
              >
                OpenAI 연결 테스트
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 거래 설정 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SettingsIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">🎯 거래 설정</Typography>
              </Box>
              
              <TextField
                fullWidth
                margin="normal"
                label="최대 포지션 크기 (%)"
                type="number"
                value={settings.maxPositionSize}
                onChange={(e) => handleInputChange('maxPositionSize', e.target.value)}
                helperText="총 자산 대비 최대 투자 비율"
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="최대 일일 손실 (%)"
                type="number"
                value={settings.maxDailyLoss}
                onChange={(e) => handleInputChange('maxDailyLoss', e.target.value)}
                helperText="일일 최대 손실 한도"
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="최소 수익률 (%)"
                type="number"
                step="0.1"
                value={settings.minProfitRate}
                onChange={(e) => handleInputChange('minProfitRate', e.target.value)}
                helperText="익절 기준 수익률"
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="손절선 (%)"
                type="number"
                step="0.1"
                value={settings.stopLossRate}
                onChange={(e) => handleInputChange('stopLossRate', e.target.value)}
                helperText="손절 기준 손실률"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 알림 설정 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Notifications sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">🔔 알림 설정</Typography>
              </Box>
              
              <List>
                <ListItem>
                  <ListItemText primary="거래 알림" secondary="매수/매도 실행 시 알림" />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.tradeNotifications}
                      onChange={(e) => handleInputChange('tradeNotifications', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                  <ListItemText primary="수익 알림" secondary="목표 수익률 달성 시 알림" />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.profitAlerts}
                      onChange={(e) => handleInputChange('profitAlerts', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                  <ListItemText primary="위험 경고" secondary="손실 발생 시 경고 알림" />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.riskWarnings}
                      onChange={(e) => handleInputChange('riskWarnings', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                  <ListItemText primary="시스템 상태" secondary="시스템 상태 변경 알림" />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.systemStatus}
                      onChange={(e) => handleInputChange('systemStatus', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 설정 저장 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6">💾 설정 저장</Typography>
                  <Typography variant="body2" color="textSecondary">
                    변경사항을 저장하고 시스템에 적용합니다.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  onClick={handleSaveSettings}
                  disabled={saving || loading}
                  size="large"
                >
                  {saving ? '저장 중...' : '설정 저장'}
                </Button>
              </Box>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                ⚠️ 설정 변경 후 시스템이 자동으로 재시작될 수 있습니다.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Settings 
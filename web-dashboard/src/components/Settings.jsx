import React, { useState } from 'react'
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
  ListItemSecondaryAction
} from '@mui/material'
import {
  Save,
  Refresh,
  Security,
  Notifications,
  Api,
  Settings as SettingsIcon
} from '@mui/icons-material'

function Settings() {
  const [settings, setSettings] = useState({
    // API 설정
    kisAppKey: 'PSiyCzaXROW***',
    kisAppSecret: 'D14ZIyoJnmjd***',
    kisAccountNo: '50132354-01',
    kisMockMode: true,
    
    // 텔레그램 설정
    telegramBotToken: '7889451962:AAE3***',
    telegramChatId: '750429634',
    telegramEnabled: true,
    
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

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveSettings = () => {
    console.log('설정 저장:', settings)
    // 실제로는 API 호출
  }

  const handleTestConnection = (type) => {
    console.log(`${type} 연결 테스트`)
    // 실제로는 각 서비스별 연결 테스트
  }

  const connectionStatus = {
    kis: 'connected',
    telegram: 'connected',
    database: 'connected',
    monitoring: 'connected'
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
                  label={getStatusText(connectionStatus.monitoring)}
                  color={getStatusColor(connectionStatus.monitoring)}
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
                type="password"
                helperText="한국투자증권 앱 키"
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="KIS App Secret"
                value={settings.kisAppSecret}
                onChange={(e) => handleInputChange('kisAppSecret', e.target.value)}
                type="password"
                helperText="한국투자증권 앱 시크릿"
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
                onClick={() => handleTestConnection('KIS')}
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
                type="password"
                helperText="텔레그램 봇 토큰"
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
                onClick={() => handleTestConnection('Telegram')}
                sx={{ mt: 2 }}
                fullWidth
              >
                텔레그램 연결 테스트
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
                  startIcon={<Save />}
                  onClick={handleSaveSettings}
                  size="large"
                >
                  설정 저장
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
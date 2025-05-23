import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  AccountBalance as PortfolioIcon,
  TrendingUp as TradingIcon,
  Settings as SettingsIcon,
  NotificationImportant as AlertIcon
} from '@mui/icons-material'

function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { path: '/', label: '대시보드', icon: <DashboardIcon /> },
    { path: '/portfolio', label: '포트폴리오', icon: <PortfolioIcon /> },
    { path: '/trading', label: '거래', icon: <TradingIcon /> },
    { path: '/settings', label: '설정', icon: <SettingsIcon /> }
  ]

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        {/* 로고 */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          🎄 Christmas Trading
          <Chip 
            label="LIVE" 
            color="success" 
            size="small" 
            sx={{ ml: 2 }}
            icon={<AlertIcon />}
          />
        </Typography>

        {/* 메뉴 버튼들 */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {menuItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        {/* 시스템 상태 */}
        <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label="API 연결" color="success" size="small" />
          <Chip label="전략 활성" color="primary" size="small" />
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navigation 
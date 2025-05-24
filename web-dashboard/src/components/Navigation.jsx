import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  AccountBalance as PortfolioIcon,
  TrendingUp as TradingIcon,
  Settings as SettingsIcon,
  NotificationImportant as AlertIcon,
  AccountCircle,
  Person,
  ExitToApp,
  VpnKey,
  Payment
} from '@mui/icons-material'

function Navigation({ user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [anchorEl, setAnchorEl] = useState(null)

  const menuItems = [
    { path: '/', label: '대시보드', icon: <DashboardIcon /> },
    { path: '/portfolio', label: '포트폴리오', icon: <PortfolioIcon /> },
    { path: '/trading', label: '거래', icon: <TradingIcon /> },
    { path: '/settings', label: '설정', icon: <SettingsIcon /> }
  ]

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleMenuClick = (path) => {
    navigate(path)
    handleProfileMenuClose()
  }

  const handleLogout = () => {
    onLogout()
    handleProfileMenuClose()
  }

  const getMembershipColor = (membershipType) => {
    switch (membershipType) {
      case 'lifetime': return 'success'
      case 'premium': return 'primary'
      default: return 'default'
    }
  }

  const getMembershipLabel = (membershipType) => {
    switch (membershipType) {
      case 'lifetime': return 'LIFETIME'
      case 'premium': return 'PREMIUM'
      default: return 'FREE'
    }
  }

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

        {/* 사용자 정보 및 프로필 메뉴 */}
        <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* 멤버십 표시 */}
          <Chip 
            label={getMembershipLabel(user?.membershipType)} 
            color={getMembershipColor(user?.membershipType)} 
            size="small" 
          />
          
          {/* 사용자 아바타 및 메뉴 */}
          <IconButton
            size="large"
            color="inherit"
            onClick={handleProfileMenuOpen}
            sx={{ p: 0.5 }}
          >
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                fontSize: '14px'
              }}
            >
              {user?.username?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>

          {/* 프로필 드롭다운 메뉴 */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
              },
            }}
          >
            {/* 사용자 정보 */}
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                {user?.username}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />

            {/* 프로필 관리 */}
            <MenuItem onClick={() => handleMenuClick('/profile')}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              <ListItemText>프로필 관리</ListItemText>
            </MenuItem>

            {/* API 설정 (관리자 또는 유료회원만) */}
            {(user?.role === 'admin' || user?.membershipType !== 'free') && (
              <MenuItem onClick={() => handleMenuClick('/profile')}>
                <ListItemIcon>
                  <VpnKey fontSize="small" />
                </ListItemIcon>
                <ListItemText>API 설정</ListItemText>
              </MenuItem>
            )}

            {/* 결제 관리 */}
            <MenuItem onClick={() => handleMenuClick('/profile')}>
              <ListItemIcon>
                <Payment fontSize="small" />
              </ListItemIcon>
              <ListItemText>결제 관리</ListItemText>
            </MenuItem>

            <Divider />

            {/* 로그아웃 */}
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              <ListItemText>로그아웃</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navigation 
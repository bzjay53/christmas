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
  ListItemText,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton
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
  Payment,
  Menu as MenuIcon,
  Close as CloseIcon
} from '@mui/icons-material'

function Navigation({ user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [anchorEl, setAnchorEl] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleMenuClick = (path) => {
    navigate(path)
    handleProfileMenuClose()
    setMobileMenuOpen(false)
  }

  const handleLogout = () => {
    onLogout()
    handleProfileMenuClose()
    setMobileMenuOpen(false)
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

  // 모바일 드로어 메뉴
  const MobileDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={handleMobileMenuToggle}
      PaperProps={{
        sx: { width: 280 }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">🎄 Christmas Trading</Typography>
        <IconButton onClick={handleMobileMenuToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      
      {/* 사용자 정보 */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          {user?.username?.charAt(0) || 'U'}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {user?.username}
          </Typography>
          <Chip 
            label={getMembershipLabel(user?.membershipType)} 
            color={getMembershipColor(user?.membershipType)} 
            size="small" 
          />
        </Box>
      </Box>
      <Divider />

      {/* 메뉴 아이템들 */}
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => handleMenuClick(item.path)}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      {/* 시스템 상태 */}
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          시스템 상태
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Chip label="API 연결" color="success" size="small" />
          <Chip label="전략 활성" color="primary" size="small" />
          <Chip label="LIVE" color="success" size="small" icon={<AlertIcon />} />
        </Box>
      </Box>
      
      <Divider />
      
      {/* 프로필 메뉴 */}
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleMenuClick('/profile')}>
            <ListItemIcon><Person /></ListItemIcon>
            <ListItemText primary="프로필 관리" />
          </ListItemButton>
        </ListItem>
        
        {(user?.role === 'admin' || user?.membershipType !== 'free') && (
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleMenuClick('/profile')}>
              <ListItemIcon><VpnKey /></ListItemIcon>
              <ListItemText primary="API 설정" />
            </ListItemButton>
          </ListItem>
        )}
        
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleMenuClick('/profile')}>
            <ListItemIcon><Payment /></ListItemIcon>
            <ListItemText primary="결제 관리" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon><ExitToApp /></ListItemIcon>
            <ListItemText primary="로그아웃" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  )

  return (
    <>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ minHeight: isMobile ? 56 : 64 }}>
          {/* 모바일 메뉴 버튼 */}
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={handleMobileMenuToggle}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* 로고 */}
          <Typography 
            variant={isMobile ? "body1" : "h6"} 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              alignItems: 'center',
              fontSize: isSmallMobile ? '1rem' : undefined
            }}
          >
            🎄 {isSmallMobile ? 'CT' : 'Christmas Trading'}
            {!isMobile && (
              <Chip 
                label="LIVE" 
                color="success" 
                size="small" 
                sx={{ ml: 2 }}
                icon={<AlertIcon />}
              />
            )}
          </Typography>

          {/* 데스크톱 메뉴 버튼들 */}
          {!isMobile && (
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
          )}

          {/* 데스크톱 시스템 상태 */}
          {!isMobile && (
            <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="API 연결" color="success" size="small" />
              <Chip label="전략 활성" color="primary" size="small" />
            </Box>
          )}

          {/* 사용자 정보 및 프로필 메뉴 */}
          <Box sx={{ ml: isMobile ? 1 : 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* 멤버십 표시 (모바일에서는 숨김) */}
            {!isSmallMobile && (
              <Chip 
                label={getMembershipLabel(user?.membershipType)} 
                color={getMembershipColor(user?.membershipType)} 
                size="small" 
              />
            )}
            
            {/* 사용자 아바타 및 메뉴 (데스크톱에서만) */}
            {!isMobile && (
              <>
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
              </>
            )}

            {/* 모바일에서 사용자 아바타 (메뉴 없음) */}
            {isMobile && (
              <Avatar 
                sx={{ 
                  width: isSmallMobile ? 28 : 32, 
                  height: isSmallMobile ? 28 : 32, 
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  fontSize: isSmallMobile ? '12px' : '14px'
                }}
              >
                {user?.username?.charAt(0) || 'U'}
              </Avatar>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* 모바일 드로어 메뉴 */}
      {isMobile && <MobileDrawer />}
    </>
  )
}

export default Navigation 
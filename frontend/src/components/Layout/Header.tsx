import React from 'react'
import { Layout, Space, Button, Avatar, Dropdown, Badge, Typography } from 'antd'
import { 
  UserOutlined, 
  LogoutOutlined, 
  SettingOutlined,
  BellOutlined,
  MenuOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useAuth } from '../../contexts/AuthContext'
import { useTrading } from '../../contexts/TradingContext'

const { Header: AntHeader } = Layout
const { Text } = Typography

interface HeaderProps {
  collapsed?: boolean
  onToggle?: () => void
}

const Header: React.FC<HeaderProps> = ({ collapsed, onToggle }) => {
  const { userProfile, logout } = useAuth()
  const { state: tradingState } = useTrading()

  // 사용자 메뉴 아이템
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <div>
          <div style={{ fontWeight: 600 }}>{userProfile?.displayName}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{userProfile?.email}</div>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'tier',
      label: (
        <div>
          <Text type="secondary">등급: </Text>
          <Text strong style={{ 
            color: userProfile?.tier === 'premium' ? '#52c41a' : '#1890ff' 
          }}>
            {userProfile?.tier === 'premium' ? '프리미엄' : '베이직'}
          </Text>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '설정',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '로그아웃',
      danger: true,
    },
  ]

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'settings':
        // 설정 페이지로 이동
        window.location.href = '/settings'
        break
      case 'logout':
        logout()
        break
    }
  }

  // 알림 개수 계산
  const notificationCount = tradingState.orders.filter(
    order => order.status === 'failed'
  ).length

  return (
    <AntHeader className="site-layout-header" style={{ 
      padding: '0 24px', 
      background: '#fff', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* 왼쪽: 메뉴 토글 버튼 (모바일) */}
      <div className="header-left">
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={onToggle}
          style={{ 
            fontSize: '16px',
            width: 40,
            height: 40,
            display: window.innerWidth <= 768 ? 'flex' : 'none'
          }}
        />
      </div>

      {/* 가운데: 거래 상태 표시 */}
      <div className="header-center">
        <Space>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div 
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: tradingState.isTrading ? '#52c41a' : '#ff4d4f'
              }}
            />
            <Text style={{ fontSize: 14 }}>
              {tradingState.isTrading ? '자동매매 활성' : '자동매매 비활성'}
            </Text>
          </div>
          
          {tradingState.portfolio && (
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 16 }}>
              포트폴리오 총액: ₩{tradingState.portfolio.totalValue.toLocaleString()}
            </Text>
          )}
        </Space>
      </div>

      {/* 오른쪽: 알림 및 사용자 메뉴 */}
      <div className="header-right">
        <Space size="middle">
          {/* 알림 아이콘 */}
          <Badge count={notificationCount} size="small">
            <Button 
              type="text" 
              icon={<BellOutlined />} 
              style={{ fontSize: '16px' }}
            />
          </Badge>

          {/* 사용자 프로필 메뉴 */}
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            trigger={['click']}
            placement="bottomRight"
          >
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Avatar 
                size="small" 
                icon={<UserOutlined />} 
                style={{ marginRight: 8 }}
              />
              <Text style={{ fontSize: 14, maxWidth: 120 }} ellipsis>
                {userProfile?.displayName || userProfile?.email}
              </Text>
            </div>
          </Dropdown>
        </Space>
      </div>

      <style jsx>{`
        .site-layout-header {
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
        }

        @media (max-width: 768px) {
          .header-center {
            display: none;
          }
          
          .site-layout-header {
            padding: 0 16px;
          }
        }

        @media (max-width: 576px) {
          .header-right .ant-space-item:first-child {
            display: none;
          }
        }
      `}</style>
    </AntHeader>
  )
}

export default Header
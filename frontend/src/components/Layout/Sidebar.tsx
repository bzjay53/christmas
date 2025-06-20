import React, { useState, useEffect } from 'react'
import { Layout, Menu, Typography } from 'antd'
import { 
  DashboardOutlined,
  TradingViewOutlined,
  PieChartOutlined,
  SettingOutlined,
  RobotOutlined,
  LineChartOutlined
} from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import type { MenuProps } from 'antd'

const { Sider } = Layout
const { Text } = Typography

type MenuItem = Required<MenuProps>['items'][number]

interface SidebarProps {
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onCollapse }) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const location = useLocation()
  const navigate = useNavigate()

  // 메뉴 아이템 정의
  const menuItems: MenuItem[] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '대시보드',
    },
    {
      key: '/trading',
      icon: <TradingViewOutlined />,
      label: 'AI 매매',
    },
    {
      key: '/portfolio',
      icon: <PieChartOutlined />,
      label: '포트폴리오',
    },
    {
      type: 'divider',
    },
    {
      key: 'analysis',
      icon: <LineChartOutlined />,
      label: '분석 도구',
      children: [
        {
          key: '/analysis/market',
          label: '시장 분석',
        },
        {
          key: '/analysis/ai',
          label: 'AI 분석',
        },
        {
          key: '/analysis/backtest',
          label: '백테스팅',
        },
      ],
    },
    {
      key: 'ai',
      icon: <RobotOutlined />,
      label: 'AI 관리',
      children: [
        {
          key: '/ai/models',
          label: 'AI 모델',
        },
        {
          key: '/ai/learning',
          label: '학습 현황',
        },
        {
          key: '/ai/performance',
          label: '성과 분석',
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '설정',
    },
  ]

  // 현재 경로에 따른 선택된 메뉴 업데이트
  useEffect(() => {
    const currentPath = location.pathname
    setSelectedKeys([currentPath])
  }, [location.pathname])

  // 메뉴 클릭 핸들러
  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
  }

  // 기본 열린 서브메뉴 설정
  const defaultOpenKeys = ['analysis', 'ai']

  return (
    <Sider
      theme="light"
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={200}
      collapsedWidth={80}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
      }}
      breakpoint="lg"
      onBreakpoint={(broken) => {
        if (onCollapse) {
          onCollapse(broken)
        }
      }}
    >
      {/* 로고 영역 */}
      <div 
        className="sidebar-logo" 
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 24px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fff',
          transition: 'all 0.2s',
        }}
      >
        {collapsed ? (
          <div style={{ fontSize: 24 }}>🎄</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 24 }}>🎄</div>
            <div>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: 600, 
                color: '#1890ff' 
              }}>
                Christmas
              </Text>
              <br />
              <Text style={{ 
                fontSize: 12, 
                color: '#8c8c8c',
                lineHeight: 1
              }}>
                Trading
              </Text>
            </div>
          </div>
        )}
      </div>

      {/* 메뉴 */}
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        defaultOpenKeys={defaultOpenKeys}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          borderRight: 0,
          marginTop: 8,
        }}
      />

      {/* 하단 정보 영역 */}
      {!collapsed && (
        <div 
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            padding: 12,
            background: '#f8f9fa',
            borderRadius: 8,
            border: '1px solid #e8e8e8',
          }}
        >
          <Text style={{ fontSize: 11, color: '#8c8c8c' }}>
            Christmas Trading v1.0
          </Text>
          <br />
          <Text style={{ fontSize: 11, color: '#8c8c8c' }}>
            AI 자동매매 시스템
          </Text>
        </div>
      )}

      <style jsx>{`
        /* 메뉴 아이템 커스텀 스타일 */
        :global(.ant-menu-item:hover) {
          background-color: #e6f7ff !important;
        }
        
        :global(.ant-menu-item-selected) {
          background-color: #1890ff !important;
          color: white !important;
        }
        
        :global(.ant-menu-item-selected .anticon) {
          color: white !important;
        }
        
        :global(.ant-menu-submenu-title:hover) {
          background-color: #f0f0f0 !important;
        }
        
        /* 모바일 반응형 */
        @media (max-width: 768px) {
          :global(.ant-layout-sider) {
            position: fixed !important;
            z-index: 1000 !important;
            transform: translateX(${collapsed ? '-100%' : '0'});
            transition: transform 0.3s ease;
          }
        }
      `}</style>
    </Sider>
  )
}

export default Sidebar
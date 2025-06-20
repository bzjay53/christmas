import React from 'react'
import { Card, Typography, Space, Button } from 'antd'
import { SettingOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const SettingsPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>설정</Title>
      <Card>
        <div style={{ 
          height: 400, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <Space direction="vertical" size="large" style={{ textAlign: 'center' }}>
            <SettingOutlined style={{ fontSize: 64, color: '#faad14' }} />
            <Title level={4}>설정 페이지 개발 중</Title>
            <Text type="secondary">시스템 설정 기능이 곧 제공됩니다.</Text>
            <Button type="primary">대시보드로 돌아가기</Button>
          </Space>
        </div>
      </Card>
    </div>
  )
}

export default SettingsPage
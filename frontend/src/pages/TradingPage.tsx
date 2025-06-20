import React from 'react'
import { Card, Typography, Space, Button } from 'antd'
import { RobotOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const TradingPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>AI 매매</Title>
      <Card>
        <div style={{ 
          height: 400, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <Space direction="vertical" size="large" style={{ textAlign: 'center' }}>
            <RobotOutlined style={{ fontSize: 64, color: '#1890ff' }} />
            <Title level={4}>AI 매매 페이지 개발 중</Title>
            <Text type="secondary">실시간 매매 기능이 곧 제공됩니다.</Text>
            <Button type="primary">대시보드로 돌아가기</Button>
          </Space>
        </div>
      </Card>
    </div>
  )
}

export default TradingPage
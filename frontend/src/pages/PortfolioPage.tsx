import React from 'react'
import { Card, Typography, Space, Button } from 'antd'
import { PieChartOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const PortfolioPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>포트폴리오</Title>
      <Card>
        <div style={{ 
          height: 400, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <Space direction="vertical" size="large" style={{ textAlign: 'center' }}>
            <PieChartOutlined style={{ fontSize: 64, color: '#52c41a' }} />
            <Title level={4}>포트폴리오 페이지 개발 중</Title>
            <Text type="secondary">상세한 포트폴리오 분석이 곧 제공됩니다.</Text>
            <Button type="primary">대시보드로 돌아가기</Button>
          </Space>
        </div>
      </Card>
    </div>
  )
}

export default PortfolioPage
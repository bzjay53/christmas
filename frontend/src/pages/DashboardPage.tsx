import React, { useEffect, useState } from 'react'
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Typography, 
  Space, 
  Button, 
  Table, 
  Tag,
  Progress,
  Alert
} from 'antd'
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  DollarOutlined,
  TrophyOutlined,
  RobotOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { useTrading } from '../contexts/TradingContext'
import LoadingSpinner from '../components/LoadingSpinner'

const { Title, Text } = Typography

const DashboardPage: React.FC = () => {
  const { userProfile } = useAuth()
  const { state: tradingState, actions } = useTrading()
  const [refreshing, setRefreshing] = useState(false)

  // 초기 데이터 로드
  useEffect(() => {
    actions.fetchOrders()
    actions.fetchPortfolio()
  }, [])

  // 데이터 새로고침
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        actions.fetchOrders(),
        actions.fetchPortfolio()
      ])
    } finally {
      setRefreshing(false)
    }
  }

  // 자동매매 토글
  const handleTradingToggle = async () => {
    try {
      if (tradingState.isTrading) {
        await actions.stopTrading()
      } else {
        await actions.startTrading()
      }
    } catch (error) {
      console.error('Trading toggle failed:', error)
    }
  }

  // 최근 주문 테이블 컬럼
  const orderColumns = [
    {
      title: '종목',
      dataIndex: 'stockName',
      key: 'stockName',
      width: 100,
    },
    {
      title: '타입',
      dataIndex: 'orderType',
      key: 'orderType',
      width: 60,
      render: (type: string) => (
        <Tag color={type === 'buy' ? 'green' : 'red'}>
          {type === 'buy' ? '매수' : '매도'}
        </Tag>
      ),
    },
    {
      title: '수량',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 60,
      render: (quantity: number) => `${quantity}주`,
    },
    {
      title: '가격',
      dataIndex: 'price',
      key: 'price',
      width: 80,
      render: (price: number) => `₩${price.toLocaleString()}`,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const statusMap = {
          pending: { color: 'processing', text: '대기중' },
          submitted: { color: 'warning', text: '제출됨' },
          filled: { color: 'success', text: '체결됨' },
          cancelled: { color: 'default', text: '취소됨' },
          failed: { color: 'error', text: '실패' },
        }
        const statusInfo = statusMap[status as keyof typeof statusMap] || 
                          { color: 'default', text: status }
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      },
    },
    {
      title: 'AI',
      dataIndex: 'aiDecision',
      key: 'aiDecision',
      width: 50,
      render: (aiDecision: boolean) => (
        aiDecision ? <RobotOutlined style={{ color: '#1890ff' }} /> : '-'
      ),
    },
  ]

  if (tradingState.loading && !tradingState.portfolio) {
    return <LoadingSpinner tip="대시보드 로딩 중..." />
  }

  const recentOrders = tradingState.orders.slice(0, 10)
  const portfolio = tradingState.portfolio

  return (
    <div className="dashboard-page" style={{ padding: 24 }}>
      {/* 페이지 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Title level={2} style={{ margin: 0 }}>
            안녕하세요, {userProfile?.displayName}님! 🎄
          </Title>
          <Button 
            loading={refreshing} 
            onClick={handleRefresh}
            type="default"
          >
            새로고침
          </Button>
        </Space>
        <Text type="secondary" style={{ fontSize: 16 }}>
          AI 자동매매 대시보드에서 실시간 투자 현황을 확인하세요
        </Text>
      </div>

      {/* 자동매매 상태 알림 */}
      <Alert
        message={
          <Space>
            <Text strong>
              자동매매 상태: {tradingState.isTrading ? '활성' : '비활성'}
            </Text>
            <Button
              type={tradingState.isTrading ? 'default' : 'primary'}
              size="small"
              icon={tradingState.isTrading ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={handleTradingToggle}
            >
              {tradingState.isTrading ? '중지' : '시작'}
            </Button>
          </Space>
        }
        type={tradingState.isTrading ? 'success' : 'warning'}
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 핵심 지표 카드들 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="총 자산"
              value={portfolio?.totalValue || 0}
              precision={0}
              valueStyle={{ color: '#3f8600', fontSize: 24 }}
              prefix="₩"
              suffix=""
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="총 수익률"
              value={portfolio?.totalProfitRate || 0}
              precision={2}
              valueStyle={{ 
                color: (portfolio?.totalProfitRate || 0) >= 0 ? '#3f8600' : '#cf1322',
                fontSize: 24
              }}
              prefix={
                (portfolio?.totalProfitRate || 0) >= 0 ? 
                <ArrowUpOutlined /> : <ArrowDownOutlined />
              }
              suffix="%"
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="오늘 거래"
              value={portfolio?.dailyOrders?.length || 0}
              valueStyle={{ color: '#1890ff', fontSize: 24 }}
              prefix={<DollarOutlined />}
              suffix="건"
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="AI 신뢰도"
              value={75.5}
              precision={1}
              valueStyle={{ color: '#722ed1', fontSize: 24 }}
              prefix={<TrophyOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* 포트폴리오 및 최근 거래 */}
      <Row gutter={[16, 16]}>
        {/* 포트폴리오 현황 */}
        <Col xs={24} lg={12}>
          <Card 
            title="포트폴리오 현황" 
            extra={<Button type="link">자세히 보기</Button>}
          >
            {portfolio?.positions && portfolio.positions.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {portfolio.positions.slice(0, 5).map((position, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: index < 4 ? '1px solid #f0f0f0' : 'none'
                  }}>
                    <div>
                      <Text strong>{position.stockName}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {position.quantity}주 @ ₩{position.averagePrice.toLocaleString()}
                      </Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text 
                        style={{ 
                          color: position.profitRate >= 0 ? '#3f8600' : '#cf1322',
                          fontWeight: 600
                        }}
                      >
                        {position.profitRate >= 0 ? '+' : ''}{position.profitRate.toFixed(2)}%
                      </Text>
                      <br />
                      <Text style={{ fontSize: 12 }}>
                        ₩{position.totalValue.toLocaleString()}
                      </Text>
                    </div>
                  </div>
                ))}
              </Space>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">보유 종목이 없습니다</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* 최근 거래 내역 */}
        <Col xs={24} lg={12}>
          <Card 
            title="최근 거래 내역" 
            extra={<Button type="link">전체 보기</Button>}
          >
            <Table
              dataSource={recentOrders}
              columns={orderColumns}
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
              locale={{
                emptyText: '최근 거래 내역이 없습니다'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* AI 성과 차트 영역 (향후 구현) */}
      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="AI 성과 분석">
            <div style={{ 
              height: 200, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: '#fafafa',
              borderRadius: 8
            }}>
              <Space direction="vertical" style={{ textAlign: 'center' }}>
                <RobotOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                <Text type="secondary">AI 성과 차트 (개발 예정)</Text>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DashboardPage
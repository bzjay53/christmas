import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, Space, Alert, Divider } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

const { Title, Text, Link } = Typography

interface LoginFormValues {
  email: string
  password: string
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      setLoading(true)
      setError(null)
      await login(values.email, values.password)
    } catch (error: any) {
      setError(error.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner tip="로그인 중..." />
  }

  return (
    <div className="login-container">
      <div className="login-content">
        {/* 로고 및 제목 */}
        <div className="login-header">
          <div className="logo">🎄</div>
          <Title level={2} style={{ margin: '16px 0 8px 0', color: '#fff' }}>
            Christmas Trading
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 16 }}>
            AI 기반 자동매매 시스템
          </Text>
        </div>

        {/* 로그인 폼 */}
        <Card 
          className="login-card"
          style={{
            width: '100%',
            maxWidth: 400,
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: '0 0 8px 0' }}>
                로그인
              </Title>
              <Text type="secondary">
                계정에 로그인하여 AI 자동매매를 시작하세요
              </Text>
            </div>

            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                closable
                onClose={() => setError(null)}
              />
            )}

            <Form
              form={form}
              name="login"
              onFinish={handleSubmit}
              autoComplete="off"
              size="large"
              layout="vertical"
            >
              <Form.Item
                name="email"
                label="이메일"
                rules={[
                  { required: true, message: '이메일을 입력해주세요.' },
                  { type: 'email', message: '올바른 이메일 형식을 입력해주세요.' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="이메일을 입력하세요"
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="비밀번호"
                rules={[
                  { required: true, message: '비밀번호를 입력해주세요.' },
                  { min: 6, message: '비밀번호는 최소 6자 이상이어야 합니다.' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="비밀번호를 입력하세요"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{ height: 48, fontSize: 16 }}
                >
                  {loading ? '로그인 중...' : '로그인'}
                </Button>
              </Form.Item>
            </Form>

            <Divider style={{ margin: '16px 0' }}>또는</Divider>

            {/* 데모 계정 정보 */}
            <div style={{ 
              padding: 16, 
              background: '#f8f9fa', 
              borderRadius: 8,
              border: '1px solid #e8e8e8'
            }}>
              <Text strong style={{ fontSize: 14, color: '#1890ff' }}>
                🎯 데모 계정으로 체험하기
              </Text>
              <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
                <div>이메일: demo@christmas-trading.com</div>
                <div>비밀번호: demo123456</div>
              </div>
              <Button
                size="small"
                type="link"
                style={{ padding: 0, height: 'auto', marginTop: 4 }}
                onClick={() => {
                  form.setFieldsValue({
                    email: 'demo@christmas-trading.com',
                    password: 'demo123456'
                  })
                }}
              >
                자동 입력
              </Button>
            </div>

            {/* 추가 링크들 */}
            <div style={{ textAlign: 'center' }}>
              <Space direction="vertical" size="small">
                <Link href="/forgot-password" style={{ fontSize: 14 }}>
                  비밀번호를 잊으셨나요?
                </Link>
                <Text style={{ fontSize: 14, color: '#8c8c8c' }}>
                  계정이 없으신가요?{' '}
                  <Link href="/register">회원가입</Link>
                </Text>
              </Space>
            </div>
          </Space>
        </Card>

        {/* 하단 정보 */}
        <div className="login-footer">
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}>
            © 2025 Christmas Trading. All rights reserved.
          </Text>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .login-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 400px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo {
          font-size: 48px;
          margin-bottom: 16px;
          animation: bounce 2s infinite;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .login-footer {
          margin-top: 32px;
          text-align: center;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }

        @media (max-width: 768px) {
          .login-container {
            padding: 16px;
          }
          
          .logo {
            font-size: 36px;
          }
          
          .login-header {
            margin-bottom: 24px;
          }
        }
      `}</style>
    </div>
  )
}

export default LoginPage
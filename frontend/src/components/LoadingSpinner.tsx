import React from 'react'
import { Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large'
  tip?: string
  spinning?: boolean
  children?: React.ReactNode
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  tip = '로딩 중...',
  spinning = true,
  children,
  className = ''
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />

  if (children) {
    // Wrapper 스타일로 사용
    return (
      <Spin 
        spinning={spinning} 
        tip={tip} 
        size={size}
        indicator={antIcon}
        className={className}
      >
        {children}
      </Spin>
    )
  }

  // 전체 페이지 로딩
  return (
    <div className={`loading-container ${className}`}>
      <div className="loading-content">
        <div className="loading-logo">
          🎄
        </div>
        <Spin 
          size={size} 
          tip={tip}
          indicator={antIcon}
        />
        <div className="loading-text">
          Christmas Trading
        </div>
      </div>
      
      <style jsx>{`
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
        }
        
        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .loading-logo {
          font-size: 48px;
          margin-bottom: 24px;
          animation: bounce 2s infinite;
        }
        
        .loading-text {
          margin-top: 16px;
          font-size: 18px;
          font-weight: 600;
          color: #333;
          letter-spacing: 1px;
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
          .loading-content {
            padding: 24px;
          }
          
          .loading-logo {
            font-size: 36px;
          }
          
          .loading-text {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  )
}

export default LoadingSpinner
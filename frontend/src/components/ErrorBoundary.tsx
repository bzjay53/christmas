import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Result, Button } from 'antd'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })

    // 에러 로그를 서버로 전송 (선택사항)
    this.logErrorToService(error, errorInfo)
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // 에러 로깅 서비스로 전송 (예: Sentry, LogRocket 등)
    try {
      const errorLog = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
      
      // 개발 환경에서는 콘솔에 출력
      if (import.meta.env.DEV) {
        console.group('🚨 Error Boundary Caught Error')
        console.error('Error:', error)
        console.error('Error Info:', errorInfo)
        console.error('Error Log:', errorLog)
        console.groupEnd()
      }
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <Result
            status="error"
            title="앱에서 오류가 발생했습니다"
            subTitle="예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 홈으로 돌아가 보세요."
            extra={[
              <Button type="primary" key="reload" onClick={this.handleReload}>
                페이지 새로고침
              </Button>,
              <Button key="home" onClick={this.handleGoHome}>
                홈으로 돌아가기
              </Button>,
            ]}
          >
            {import.meta.env.DEV && this.state.error && (
              <div className="error-details">
                <details style={{ marginTop: 24, textAlign: 'left' }}>
                  <summary>오류 세부 정보 (개발용)</summary>
                  <pre style={{ 
                    marginTop: 16, 
                    padding: 16, 
                    background: '#f5f5f5', 
                    borderRadius: 4,
                    fontSize: 12,
                    overflow: 'auto',
                    maxHeight: 200
                  }}>
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              </div>
            )}
          </Result>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
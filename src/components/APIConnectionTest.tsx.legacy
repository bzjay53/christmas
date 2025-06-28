// 🔍 한국투자증권 API 연결 테스트 컴포넌트
import React, { useState } from 'react';
import { koreaInvestmentAPI } from '../lib/koreaInvestmentAPI';

interface APITestResult {
  step: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  timestamp?: string;
}

const APIConnectionTest: React.FC = () => {
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<APITestResult[]>([]);

  const addTestResult = (result: APITestResult) => {
    setTestResults(prev => [...prev, { ...result, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runAPITest = async () => {
    setIsTestRunning(true);
    setTestResults([]);

    try {
      // 1단계: 환경변수 확인
      addTestResult({
        step: '1. 환경변수 확인',
        status: 'pending',
        message: '환경변수를 확인하는 중...'
      });

      const hasEnvVars = !!(
        import.meta.env.VITE_KOREA_INVESTMENT_APP_KEY &&
        import.meta.env.VITE_KOREA_INVESTMENT_APP_SECRET
      );

      if (!hasEnvVars) {
        addTestResult({
          step: '1. 환경변수 확인',
          status: 'error',
          message: '❌ VITE_KOREA_INVESTMENT_APP_KEY 또는 VITE_KOREA_INVESTMENT_APP_SECRET이 설정되지 않았습니다.'
        });
        return;
      }

      addTestResult({
        step: '1. 환경변수 확인',
        status: 'success',
        message: '✅ 필요한 환경변수가 모두 설정되어 있습니다.'
      });

      // 2단계: API 인증 테스트
      addTestResult({
        step: '2. API 인증',
        status: 'pending',
        message: '한국투자증권 API 인증을 시도하는 중...'
      });

      try {
        const token = await koreaInvestmentAPI.authenticate();
        addTestResult({
          step: '2. API 인증',
          status: 'success',
          message: `✅ 인증 성공! 토큰 앞 10자리: ${token.substring(0, 10)}...`
        });
      } catch (authError) {
        addTestResult({
          step: '2. API 인증',
          status: 'error',
          message: `❌ 인증 실패: ${authError instanceof Error ? authError.message : '알 수 없는 오류'}`
        });
        return;
      }

      // 3단계: 시세 조회 테스트
      addTestResult({
        step: '3. 시세 조회',
        status: 'pending',
        message: '삼성전자(005930) 시세를 조회하는 중...'
      });

      try {
        const stockData = await koreaInvestmentAPI.getCurrentPrice('005930');
        addTestResult({
          step: '3. 시세 조회',
          status: 'success',
          message: `✅ 시세 조회 성공! ${stockData.name}: ${stockData.current_price.toLocaleString()}원 (${stockData.price_change_percent > 0 ? '+' : ''}${stockData.price_change_percent}%)`
        });
      } catch (priceError) {
        addTestResult({
          step: '3. 시세 조회',
          status: 'error',
          message: `❌ 시세 조회 실패: ${priceError instanceof Error ? priceError.message : '알 수 없는 오류'}`
        });
        return;
      }

      // 4단계: 전체 연결 테스트
      addTestResult({
        step: '4. 전체 테스트',
        status: 'pending',
        message: '전체 API 연결을 테스트하는 중...'
      });

      try {
        const isConnected = await koreaInvestmentAPI.testConnection();
        if (isConnected) {
          addTestResult({
            step: '4. 전체 테스트',
            status: 'success',
            message: '🎉 한국투자증권 API 연결 테스트 완료! 모든 기능이 정상적으로 동작합니다.'
          });
        } else {
          addTestResult({
            step: '4. 전체 테스트',
            status: 'error',
            message: '❌ 연결은 되지만 데이터가 정상적이지 않습니다.'
          });
        }
      } catch (testError) {
        addTestResult({
          step: '4. 전체 테스트',
          status: 'error',
          message: `❌ 전체 테스트 실패: ${testError instanceof Error ? testError.message : '알 수 없는 오류'}`
        });
      }

    } catch (error) {
      addTestResult({
        step: '오류',
        status: 'error',
        message: `❌ 예상치 못한 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      });
    } finally {
      setIsTestRunning(false);
    }
  };

  const getStatusIcon = (status: APITestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: APITestResult['status']) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <div className="api-test-container" style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-primary)',
      borderRadius: '12px',
      padding: '20px',
      margin: '20px',
      maxWidth: '800px'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          color: 'var(--text-primary)',
          margin: 0,
          fontSize: '1.2rem'
        }}>
          🔍 한국투자증권 API 연결 테스트
        </h3>
        <button
          onClick={runAPITest}
          disabled={isTestRunning}
          style={{
            padding: '8px 16px',
            background: isTestRunning ? '#6B7280' : '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isTestRunning ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
        >
          {isTestRunning ? '테스트 중...' : '테스트 시작'}
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="test-results">
          <h4 style={{ 
            color: 'var(--text-secondary)', 
            marginBottom: '15px',
            fontSize: '1rem'
          }}>
            테스트 결과:
          </h4>
          
          {testResults.map((result, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '12px',
                margin: '8px 0',
                background: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '8px',
                borderLeft: `4px solid ${getStatusColor(result.status)}`
              }}
            >
              <span style={{ 
                fontSize: '1.2rem', 
                marginRight: '12px',
                minWidth: '24px'
              }}>
                {getStatusIcon(result.status)}
              </span>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  {result.step}
                </div>
                
                <div style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: '1.4'
                }}>
                  {result.message}
                </div>
                
                {result.timestamp && (
                  <div style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    marginTop: '4px'
                  }}>
                    {result.timestamp}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {testResults.length === 0 && !isTestRunning && (
        <div style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          padding: '40px 20px',
          background: 'rgba(30, 41, 59, 0.3)',
          borderRadius: '8px',
          fontSize: '0.9rem'
        }}>
          "테스트 시작" 버튼을 클릭하여 API 연결 상태를 확인하세요.
        </div>
      )}

      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: 'rgba(16, 185, 129, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(16, 185, 129, 0.3)'
      }}>
        <h4 style={{ 
          color: '#10B981', 
          fontSize: '0.9rem',
          marginBottom: '8px'
        }}>
          💡 참고사항:
        </h4>
        <ul style={{
          color: 'var(--text-secondary)',
          fontSize: '0.8rem',
          lineHeight: '1.4',
          margin: 0,
          paddingLeft: '20px'
        }}>
          <li>이 테스트는 모의투자 API를 사용합니다 (실제 거래 발생하지 않음)</li>
          <li>API 키가 설정되지 않은 경우 .env 파일을 확인하세요</li>
          <li>테스트 실패시 콘솔에서 자세한 오류 내용을 확인할 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
};

export default APIConnectionTest;
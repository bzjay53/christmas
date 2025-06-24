// 🎄 정적 HTML을 정확히 복사한 React 컴포넌트
import React, { useState } from 'react';
import MajorIndicesChartJS from './charts/MajorIndicesChartJS';
import AppleStockChart from './charts/AppleStockChart';
import VolumeChart from './charts/VolumeChart';
import PortfolioChart from './charts/PortfolioChart';
import APIConnectionTest from './APIConnectionTest';
import { safePlaceOrder } from '../lib/stocksService';

const StaticDashboardReact: React.FC = () => {
  const [isTrading, setIsTrading] = useState(false);
  const [stockCode, setStockCode] = useState('005930'); // 삼성전자
  const [quantity, setQuantity] = useState(10);
  const [tradeMessage, setTradeMessage] = useState('');
  const [selectedChart, setSelectedChart] = useState('major'); // 차트 선택 상태
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // 테마 상태

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // 실제 DOM에 테마 클래스 적용
    document.body.className = newTheme === 'light' ? 'light-theme' : 'dark-theme';
    document.documentElement.setAttribute('data-theme', newTheme);
    
    console.log(`🎨 테마 변경: ${newTheme === 'light' ? '☀️ 라이트 모드' : '🌙 다크 모드'}`);
  };

  const handleChartSelect = (chartType: string) => {
    setSelectedChart(chartType);
    console.log(`📊 차트 변경: ${chartType}`);
  };

  const handleTrade = async (orderType: 'buy' | 'sell') => {
    setIsTrading(true);
    setTradeMessage('');

    const userId = 'user_' + Math.random().toString(36).substr(2, 9); // 임시 사용자 ID
    
    try {
      const result = await safePlaceOrder(userId, stockCode, orderType, quantity);
      
      if (result.success) {
        setTradeMessage(`✅ ${result.message}`);
      } else {
        setTradeMessage(`⚠️ ${result.message}`);
        
        // 대안 종목이 있으면 표시
        if (result.alternatives && result.alternatives.length > 0) {
          const altText = result.alternatives.map(alt => 
            `${alt.name}(${alt.symbol})`).join(', ');
          setTradeMessage(prev => prev + `\n💡 대안 종목: ${altText}`);
        }
      }
    } catch (error) {
      setTradeMessage(`❌ 거래 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
    
    setIsTrading(false);
  };

  return (
    <>
      {/* 🔝 최상단 배너 - 주요 기능 버튼들 */}
      <div style={{
        background: theme === 'dark' ? '#1e293b' : '#ffffff',
        borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
        padding: '15px 20px',
        display: 'flex',
        gap: '15px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        zIndex: 1001,
        transition: 'all 0.3s ease'
      }}>
        <button 
          onClick={() => alert('🎯 투자 전략 설정')}
          style={{
            padding: '8px 15px',
            border: 'none',
            borderRadius: '8px',
            background: '#10B981',
            color: 'white',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          🎯 투자 전략
        </button>
        
        <button 
          onClick={() => alert('💎 요금제 업그레이드')}
          style={{
            padding: '8px 15px',
            border: 'none',
            borderRadius: '8px',
            background: '#10B981',
            color: 'white',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          💎 요금제 안내
        </button>
        
        <button 
          onClick={() => alert('📊 백테스트 실행')}
          style={{
            padding: '8px 15px',
            border: 'none',
            borderRadius: '8px',
            background: '#10B981',
            color: 'white',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          📊 백테스트
        </button>
        
        <button 
          onClick={() => alert('🎁 친구 초대 혜택')}
          style={{
            padding: '8px 15px',
            border: 'none',
            borderRadius: '8px',
            background: '#10B981',
            color: 'white',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          🎁 혜택
        </button>
        
        <button 
          onClick={() => alert('📈 주요 종목 현황')}
          style={{
            padding: '8px 15px',
            border: 'none',
            borderRadius: '8px',
            background: '#10B981',
            color: 'white',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          📈 주요 종목
        </button>
        
        <button 
          onClick={() => alert('🛡️ 안전한 거래 시스템')}
          style={{
            padding: '8px 15px',
            border: 'none',
            borderRadius: '8px',
            background: '#10B981',
            color: 'white',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          🛡️ 안전한 거래
        </button>
        
        {/* 테마 토글 버튼 - 배너로 이동 */}
        <button
          onClick={handleThemeToggle}
          style={{
            padding: '8px 15px',
            border: 'none',
            borderRadius: '8px',
            background: theme === 'dark' ? '#374151' : '#F3F4F6',
            color: theme === 'dark' ? '#10B981' : '#374151',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          {theme === 'dark' ? '☀️ 라이트' : '🌙 다크'}
        </button>
      </div>

      {/* Christmas 장식 */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-green-500 via-yellow-500 to-red-500 opacity-30 z-10"></div>
      <div className="fixed top-4 right-4 pointer-events-none z-10 opacity-20">
        <span className="text-2xl">🎄</span>
      </div>
      <div className="fixed bottom-4 left-4 pointer-events-none z-10 opacity-20">
        <span className="text-2xl">🎁</span>
      </div>

      <div className="dashboard" style={{ marginTop: '70px', width: '100%', paddingLeft: '0' }}>
        {/* 메인 콘텐츠 - 전체 화면 활용 */}
        <div className="main-content" style={{ width: '100%', marginLeft: '0' }}>
          {/* 상단 시장 정보 헤더 */}
          <div style={{
            background: theme === 'dark' ? '#1e293b' : '#ffffff',
            borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
            padding: '20px',
            color: theme === 'dark' ? '#E5E7EB' : '#1e293b',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ 
              textAlign: 'center',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              🎄 크리스마스 트레이딩 - 실시간 주식
            </div>
            <div style={{ 
              textAlign: 'center',
              fontSize: '1rem',
              marginBottom: '8px'
            }}>
              📊 3개 종목 | 🔄 오후 6:28:18
            </div>
            <div style={{ 
              textAlign: 'center',
              fontSize: '0.9rem',
              color: '#EF4444',
              marginBottom: '5px'
            }}>
              🔴 장 마감 - 다음날 09:00 개장
            </div>
            <div style={{ 
              textAlign: 'center',
              fontSize: '0.8rem',
              color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
            }}>
              💡 실제 거래시간: 평일 09:00-15:30
            </div>
          </div>

          {/* 포트폴리오 요약 헤더 */}
          <div style={{
            background: theme === 'dark' ? '#374151' : '#f8fafc',
            padding: '15px 20px',
            borderBottom: `1px solid ${theme === 'dark' ? '#4B5563' : '#e2e8f0'}`,
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: theme === 'dark' ? '#10B981' : '#059669'
                }}>
                  🎄 Christmas Portfolio $105,550.91
                </div>
                <div style={{
                  fontSize: '1.1rem',
                  color: '#10B981'
                }}>
                  +$1,575.60 (+1.52%)
                </div>
              </div>
              <div style={{
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                fontSize: '0.9rem'
              }}>
                마지막 업데이트: 오후 1:41:34 | 장중
              </div>
            </div>
          </div>


          {/* 📊 메인 차트 영역 - 이미지 좌표에 맞춘 정확한 레이아웃 */}
          <div className="content-area" style={{ position: 'relative', height: 'calc(100vh - 180px)' }}>
            {/* 주식 그래프 차트 (중앙) */}
            <div className="chart-section">
              <div className="chart-container" style={{ height: '400px' }}>
                <div className="chart-title" style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                  {selectedChart === 'major' && '🌏 주요 지수 (KOSPI, NASDAQ, S&P500)'}
                  {selectedChart === 'kospi' && '📊 KOSPI - 한국 종합주가지수'}
                  {selectedChart === 'nasdaq' && '🇺🇸 NASDAQ - 나스닥 종합지수'}
                  {selectedChart === 'sp500' && '💼 S&P500 - 미국 주요 500개 기업'}
                </div>
                <MajorIndicesChartJS />
              </div>
              
              {/* 하단 작은 차트들 */}
              <div style={{ display: 'flex', gap: '20px', height: '200px' }}>
                <div className="chart-container" style={{ flex: 1 }}>
                  <div className="chart-title">📈 AAPL - Apple Inc.</div>
                  <AppleStockChart />
                </div>
                <div className="chart-container" style={{ flex: 1 }}>
                  <div className="chart-title">📊 거래량</div>
                  <VolumeChart />
                </div>
              </div>
            </div>
          </div>

          {/* 좌측 네비게이션 패널 - 자연스러운 디자인 */}
          <div style={{
            position: 'absolute',
            top: '200px',
            left: '20px',
            width: '200px',
            zIndex: 1000,
            background: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(248, 250, 252, 0.95)',
            borderRight: `2px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              color: '#10B981',
              fontWeight: 'bold',
              textAlign: 'left',
              fontSize: '1.1rem',
              marginBottom: '10px',
              borderBottom: '1px solid #374151',
              paddingBottom: '8px'
            }}>🎄 메뉴</div>
            
            <button 
              onClick={() => alert('📊 대시보드')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '6px',
                background: '#10B981',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '50px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0D9488';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#10B981';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              📊 대시보드
            </button>
            
            <button 
              onClick={() => alert('💼 포트폴리오')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '6px',
                background: 'rgba(55, 65, 81, 0.8)',
                color: '#E5E7EB',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '50px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#10B981';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(55, 65, 81, 0.8)';
                e.currentTarget.style.color = '#E5E7EB';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              💼 포트폴리오
            </button>
            
            <button 
              onClick={() => alert('🤖 AI 추천')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '6px',
                background: 'rgba(55, 65, 81, 0.8)',
                color: '#E5E7EB',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '50px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#10B981';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(55, 65, 81, 0.8)';
                e.currentTarget.style.color = '#E5E7EB';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              🤖 AI 추천
            </button>
            
            <button 
              onClick={() => alert('🔔 알림')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '6px',
                background: 'rgba(55, 65, 81, 0.8)',
                color: '#E5E7EB',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '50px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#10B981';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(55, 65, 81, 0.8)';
                e.currentTarget.style.color = '#E5E7EB';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              🔔 알림
            </button>
            
            <button 
              onClick={() => alert('⚙️ 설정')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '6px',
                background: 'rgba(55, 65, 81, 0.8)',
                color: '#E5E7EB',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '50px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#10B981';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(55, 65, 81, 0.8)';
                e.currentTarget.style.color = '#E5E7EB';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              ⚙️ 설정
            </button>
          </div>

          {/* 좌측 차트 선택 패널 - 자연스러운 디자인 */}
          <div style={{
            position: 'absolute',
            top: '620px',
            left: '20px',
            width: '200px',
            zIndex: 1000,
            background: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(248, 250, 252, 0.95)',
            borderRight: `2px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              color: '#10B981',
              fontWeight: 'bold',
              textAlign: 'left',
              fontSize: '1.1rem',
              marginBottom: '10px',
              borderBottom: '1px solid #374151',
              paddingBottom: '8px'
            }}>📊 차트 선택</div>
            
            <button 
              onClick={() => handleChartSelect('major')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '6px',
                background: selectedChart === 'major' ? '#10B981' : 'rgba(55, 65, 81, 0.8)',
                color: selectedChart === 'major' ? 'white' : '#E5E7EB',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '50px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                boxShadow: selectedChart === 'major' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (selectedChart !== 'major') {
                  e.currentTarget.style.background = '#10B981';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedChart !== 'major') {
                  e.currentTarget.style.background = 'rgba(55, 65, 81, 0.8)';
                  e.currentTarget.style.color = '#E5E7EB';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
            >
              🌏 주요지수
            </button>
            
            <button 
              onClick={() => handleChartSelect('kospi')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '6px',
                background: selectedChart === 'kospi' ? '#10B981' : 'rgba(55, 65, 81, 0.8)',
                color: selectedChart === 'kospi' ? 'white' : '#E5E7EB',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '50px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                boxShadow: selectedChart === 'kospi' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (selectedChart !== 'kospi') {
                  e.currentTarget.style.background = '#10B981';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedChart !== 'kospi') {
                  e.currentTarget.style.background = 'rgba(55, 65, 81, 0.8)';
                  e.currentTarget.style.color = '#E5E7EB';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
            >
              📊 KOSPI
            </button>
            
            <button 
              onClick={() => handleChartSelect('nasdaq')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '6px',
                background: selectedChart === 'nasdaq' ? '#10B981' : 'rgba(55, 65, 81, 0.8)',
                color: selectedChart === 'nasdaq' ? 'white' : '#E5E7EB',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '50px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                boxShadow: selectedChart === 'nasdaq' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (selectedChart !== 'nasdaq') {
                  e.currentTarget.style.background = '#10B981';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedChart !== 'nasdaq') {
                  e.currentTarget.style.background = 'rgba(55, 65, 81, 0.8)';
                  e.currentTarget.style.color = '#E5E7EB';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
            >
              🇺🇸 NASDAQ
            </button>
            
            <button 
              onClick={() => handleChartSelect('sp500')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '6px',
                background: selectedChart === 'sp500' ? '#10B981' : 'rgba(55, 65, 81, 0.8)',
                color: selectedChart === 'sp500' ? 'white' : '#E5E7EB',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '50px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                boxShadow: selectedChart === 'sp500' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (selectedChart !== 'sp500') {
                  e.currentTarget.style.background = '#10B981';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedChart !== 'sp500') {
                  e.currentTarget.style.background = 'rgba(55, 65, 81, 0.8)';
                  e.currentTarget.style.color = '#E5E7EB';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
            >
              💼 S&P500
            </button>
          </div>

          {/* 우측 빠른 거래 패널 - 자연스러운 디자인 */}
          <div style={{
            position: 'absolute',
            top: '200px',
            right: '20px',
            width: '200px',
            zIndex: 1000,
            background: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(248, 250, 252, 0.95)',
            borderLeft: `2px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              color: '#10B981',
              fontWeight: 'bold',
              textAlign: 'left',
              fontSize: '1.1rem',
              marginBottom: '10px',
              borderBottom: '1px solid #374151',
              paddingBottom: '8px'
            }}>빠른 거래</div>
            
            <button 
              onClick={() => handleTrade('buy')}
              disabled={isTrading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '6px',
                background: '#10B981',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: isTrading ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                minHeight: '50px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                opacity: isTrading ? 0.6 : 1,
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!isTrading) {
                  e.currentTarget.style.background = '#0D9488';
                  e.currentTarget.style.transform = 'translateX(-4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isTrading) {
                  e.currentTarget.style.background = '#10B981';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
            >
              💰 {isTrading ? '처리중...' : '매수'}
            </button>
            
            <button 
              onClick={() => handleTrade('sell')}
              disabled={isTrading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '6px',
                background: 'rgba(55, 65, 81, 0.8)',
                color: '#E5E7EB',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: isTrading ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                minHeight: '50px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                opacity: isTrading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isTrading) {
                  e.currentTarget.style.background = '#EF4444';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateX(-4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isTrading) {
                  e.currentTarget.style.background = 'rgba(55, 65, 81, 0.8)';
                  e.currentTarget.style.color = '#E5E7EB';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
            >
              💸 {isTrading ? '처리중...' : '매도'}
            </button>
          </div>


          {/* 테이블 섹션 */}
          <div className="tables-section">
            {/* 보유 종목 */}
            <div className="table-container">
              <div className="table-header">보유 종목</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>종목코드</th>
                    <th>보유주식</th>
                    <th>평균가</th>
                    <th>현재가</th>
                    <th>손익</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>AAPL</td>
                    <td>100</td>
                    <td>$145.30</td>
                    <td className="price-positive">$150.25</td>
                    <td className="price-positive">+$495.00</td>
                  </tr>
                  <tr>
                    <td>MSFT</td>
                    <td>50</td>
                    <td>$375.20</td>
                    <td className="price-positive">$378.85</td>
                    <td className="price-positive">+$182.50</td>
                  </tr>
                  <tr>
                    <td>GOOGL</td>
                    <td>25</td>
                    <td>$140.00</td>
                    <td className="price-negative">$138.45</td>
                    <td className="price-negative">-$38.75</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 최근 주문 */}
            <div className="table-container">
              <div className="table-header">최근 주문</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>종목코드</th>
                    <th>구분</th>
                    <th>수량</th>
                    <th>가격</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>AAPL</td>
                    <td><span style={{background: '#10B981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem'}}>매수</span></td>
                    <td>10</td>
                    <td>$150.00</td>
                    <td><span style={{background: '#10B981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem'}}>체결</span></td>
                  </tr>
                  <tr>
                    <td>MSFT</td>
                    <td><span style={{background: '#EF4444', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem'}}>매도</span></td>
                    <td>5</td>
                    <td>$378.50</td>
                    <td><span style={{background: '#F59E0B', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem'}}>대기</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* API 연결 테스트 섹션 */}
          <div className="api-test-section">
            <APIConnectionTest />
          </div>
        </div>
      </div>
    </>
  );
};

export default StaticDashboardReact;
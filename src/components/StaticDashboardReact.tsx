// 🎄 정적 HTML을 정확히 복사한 React 컴포넌트
import React, { useState, useEffect, useMemo } from 'react';
import MajorIndicesChartJS from './charts/MajorIndicesChartJS';
import AppleStockChart from './charts/AppleStockChart';
import VolumeChart from './charts/VolumeChart';
import PortfolioChart from './charts/PortfolioChart';
import APIConnectionTest from './APIConnectionTest';
import { safePlaceOrder } from '../lib/stocksService';

interface StaticDashboardReactProps {
  isGlobalSnowEnabled?: boolean;
  setIsGlobalSnowEnabled?: (enabled: boolean) => void;
}

const StaticDashboardReact: React.FC<StaticDashboardReactProps> = ({ 
  isGlobalSnowEnabled, 
  setIsGlobalSnowEnabled 
}) => {
  const [isTrading, setIsTrading] = useState(false);
  const [stockCode, setStockCode] = useState('005930'); // 삼성전자
  const [quantity, setQuantity] = useState(10);
  const [tradeMessage, setTradeMessage] = useState('');
  const [selectedChart, setSelectedChart] = useState('major'); // 차트 선택 상태
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // 테마 상태
  const [isSnowEnabled, setIsSnowEnabled] = useState(false); // 눈 효과 상태
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태
  const [showLoginModal, setShowLoginModal] = useState(false); // 로그인 모달 상태
  const [loginForm, setLoginForm] = useState({ email: '', password: '' }); // 로그인 폼
  const [isMobile, setIsMobile] = useState(false); // 모바일 환경 체크

  // 모바일 환경 체크
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleSnowToggle = () => {
    // 로컬 눈 효과와 글로벌 눈 효과 모두 토글
    const newSnowState = !isSnowEnabled;
    setIsSnowEnabled(newSnowState);
    if (setIsGlobalSnowEnabled) {
      setIsGlobalSnowEnabled(newSnowState);
    }
    console.log(`❄️ 눈 효과: ${newSnowState ? '켜짐' : '꺼짐'}`);
  };

  const handleLogin = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
    } else {
      setIsLoggedIn(false);
      setLoginForm({ email: '', password: '' });
      console.log('🚪 로그아웃 완료');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.email && loginForm.password) {
      setIsLoggedIn(true);
      setShowLoginModal(false);
      console.log(`👋 ${loginForm.email}로 로그인 완료`);
    } else {
      alert('이메일과 비밀번호를 입력해주세요.');
    }
  };

  const handleLoginFormChange = (field: 'email' | 'password', value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
  };

  // 눈송이 데이터를 한 번만 생성 (토글 시 동일한 눈송이 유지)
  const snowflakes = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      fontSize: Math.random() * 0.8 + 0.5,
      animationDuration: Math.random() * 8 + 5,
      animationDelay: Math.random() * 5
    }));
  }, []);

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
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, #0f172a, #1e293b)' 
          : 'linear-gradient(135deg, #ffffff, #f8fafc)',
        borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
        padding: isMobile ? '10px 15px' : '15px 20px',
        display: 'flex',
        gap: isMobile ? '8px' : '15px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        zIndex: 1001,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: theme === 'dark' 
          ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
          : '0 4px 20px rgba(0, 0, 0, 0.08)',
        flexDirection: isMobile ? 'column' : 'row',
        maxHeight: isMobile ? '120px' : 'auto',
        overflowY: isMobile ? 'auto' : 'visible'
      }}>
        <button 
          onClick={() => alert('🎯 투자 전략 설정')}
          style={{
            padding: isMobile ? '6px 10px' : '8px 15px',
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
            padding: isMobile ? '6px 10px' : '8px 15px',
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
            padding: isMobile ? '6px 10px' : '8px 15px',
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
            padding: isMobile ? '6px 10px' : '8px 15px',
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
            padding: isMobile ? '6px 10px' : '8px 15px',
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
            padding: isMobile ? '6px 10px' : '8px 15px',
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
            padding: isMobile ? '6px 10px' : '8px 15px',
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

        {/* 눈 효과 토글 버튼 */}
        <button
          onClick={handleSnowToggle}
          style={{
            padding: isMobile ? '6px 10px' : '8px 15px',
            border: 'none',
            borderRadius: '8px',
            background: isSnowEnabled ? '#3B82F6' : '#6B7280',
            color: 'white',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          {isSnowEnabled ? '❄️ 눈 끄기' : '❄️ 눈 켜기'}
        </button>

        {/* 로그인/로그아웃 버튼 */}
        <button
          onClick={handleLogin}
          style={{
            padding: isMobile ? '6px 10px' : '8px 15px',
            border: 'none',
            borderRadius: '8px',
            background: isLoggedIn ? '#EF4444' : '#8B5CF6',
            color: 'white',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          {isLoggedIn ? '🚪 로그아웃' : '👤 로그인'}
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

      {/* 눈 내리는 효과 - 완전히 제어됨 */}
      {isSnowEnabled && (
        <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
          {snowflakes.map((snowflake) => (
            <div
              key={snowflake.id}
              className="absolute text-white opacity-80 snow-particle"
              style={{
                left: `${snowflake.left}%`,
                fontSize: `${snowflake.fontSize}rem`,
                animation: `snowfall ${snowflake.animationDuration}s linear infinite`,
                animationDelay: `${snowflake.animationDelay}s`
              }}
            >
              ❄
            </div>
          ))}
        </div>
      )}
      
      {/* 전역 스타일 - 눈 효과와 스크롤바 */}
      <style>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0.3;
          }
        }
        /* 스크롤바 숨기기 */
        div[style*="overflowY: auto"]::-webkit-scrollbar {
          display: none;
        }
        /* 눈 효과가 꺼졌을 때 확실히 숨김 */
        .snow-particle {
          display: ${isSnowEnabled ? 'block' : 'none'};
        }
      `}</style>

      <div className="dashboard" style={{ marginTop: isMobile ? '200px' : '200px', width: '100%', paddingLeft: '0' }}>
        {/* 메인 콘텐츠 - 전체 화면 활용 */}
        <div className="main-content" style={{ width: '100%', marginLeft: '0' }}>
          {/* 상단 시장 정보 헤더 - 배너와 충분한 간격 확보 */}
          <div style={{
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, #1e293b, #334155)' 
              : 'linear-gradient(135deg, #ffffff, #f1f5f9)',
            borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
            padding: '25px 20px',
            color: theme === 'dark' ? '#E5E7EB' : '#1e293b',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            marginTop: '0px', // 배너와 간격 최소화
            boxShadow: theme === 'dark' 
              ? '0 2px 10px rgba(0, 0, 0, 0.2)' 
              : '0 2px 10px rgba(0, 0, 0, 0.05)'
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
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, #374151, #475569)' 
              : 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
            padding: '15px 20px',
            borderBottom: `1px solid ${theme === 'dark' ? '#4B5563' : '#e2e8f0'}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: theme === 'dark' 
              ? 'inset 0 1px 3px rgba(0, 0, 0, 0.2)' 
              : 'inset 0 1px 3px rgba(0, 0, 0, 0.05)'
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
                fontSize: '0.9rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '4px'
              }}>
                {isLoggedIn && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#10B981',
                    fontWeight: '600'
                  }}>
                    👤 {loginForm.email || 'user@example.com'}님 접속중
                  </div>
                )}
                <div>마지막 업데이트: 오후 1:41:34 | 장중</div>
              </div>
            </div>
          </div>


          {/* 📊 메인 차트 영역 - 전체 화면 최대 활용 */}
          <div style={{ 
            position: 'relative', 
            width: '100%',
            minHeight: 'calc(100vh - 250px)',
            padding: isMobile 
              ? '15px 15px' // 모바일: 사이드바 없이 최소 패딩
              : '20px 320px 20px 260px', // 데스크톱: 좌우 사이드바 공간 확보
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '15px' : '20px'
          }}>
            {/* 메인 실시간 주식 차트 - 전체 화면 최대 활용 */}
            <div style={{
              background: theme === 'dark' 
                ? 'linear-gradient(135deg, #1e293b, #334155)' 
                : 'linear-gradient(135deg, #ffffff, #f8fafc)',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
              borderRadius: '12px',
              padding: isMobile ? '15px' : '30px',
              height: isMobile ? '400px' : '600px', // 모바일에서 더 작은 높이
              width: '100%',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: theme === 'dark' 
                ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                : '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold',
                marginBottom: '20px',
                color: theme === 'dark' ? '#E5E7EB' : '#1e293b'
              }}>
                {selectedChart === 'major' && '🌏 주요 지수 (KOSPI, NASDAQ, S&P500)'}
                {selectedChart === 'kospi' && '📊 KOSPI - 한국 종합주가지수'}
                {selectedChart === 'nasdaq' && '🇺🇸 NASDAQ - 나스닥 종합지수'}
                {selectedChart === 'sp500' && '💼 S&P500 - 미국 주요 500개 기업'}
              </div>
              <div style={{ height: 'calc(100% - 60px)' }}>
                <MajorIndicesChartJS />
              </div>
            </div>
            
            {/* 하단 보조 차트들 - 가로로 배치, 더 큰 크기 */}
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '15px' : '25px', 
              height: isMobile ? 'auto' : '400px'
            }}>
              <div style={{
                flex: 1,
                background: theme === 'dark' 
                  ? 'linear-gradient(135deg, #1e293b, #334155)' 
                  : 'linear-gradient(135deg, #ffffff, #f8fafc)',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                borderRadius: '12px',
                padding: isMobile ? '15px' : '25px',
                height: isMobile ? '300px' : 'auto',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: theme === 'dark' 
                  ? '0 4px 20px rgba(0, 0, 0, 0.25)' 
                  : '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}>
                <div style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: 'bold',
                  marginBottom: '20px',
                  color: theme === 'dark' ? '#E5E7EB' : '#1e293b'
                }}>
                  📈 AAPL - Apple Inc.
                </div>
                <div style={{ height: 'calc(100% - 60px)' }}>
                  <AppleStockChart />
                </div>
              </div>
              <div style={{
                flex: 1,
                background: theme === 'dark' 
                  ? 'linear-gradient(135deg, #1e293b, #334155)' 
                  : 'linear-gradient(135deg, #ffffff, #f8fafc)',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                borderRadius: '12px',
                padding: isMobile ? '15px' : '25px',
                height: isMobile ? '300px' : 'auto',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: theme === 'dark' 
                  ? '0 4px 20px rgba(0, 0, 0, 0.25)' 
                  : '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}>
                <div style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: 'bold',
                  marginBottom: '20px',
                  color: theme === 'dark' ? '#E5E7EB' : '#1e293b'
                }}>
                  📊 거래량
                </div>
                <div style={{ height: 'calc(100% - 60px)' }}>
                  <VolumeChart />
                </div>
              </div>
            </div>
          </div>

          {/* 좌측 통합 사이드바 - 메뉴 + 차트 선택 */}
          {!isMobile && <div style={{
            position: 'fixed',
            top: '280px',
            left: '20px',
            width: '220px',
            zIndex: 1000,
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(51, 65, 85, 0.95))' 
              : 'linear-gradient(135deg, rgba(248, 250, 252, 0.98), rgba(226, 232, 240, 0.95))',
            borderRight: `2px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            backdropFilter: 'blur(15px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: theme === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
              : '0 8px 32px rgba(0, 0, 0, 0.12)',
            maxHeight: 'calc(100vh - 380px)',
            overflowY: 'auto',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none' // IE
          }}>
            {/* 메뉴 섹션 */}
            <div style={{
              color: '#10B981',
              fontWeight: 'bold',
              textAlign: 'left',
              fontSize: '1.1rem',
              marginBottom: '8px',
              borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
              paddingBottom: '8px'
            }}>🎄 메뉴</div>
            
            <button 
              onClick={() => alert('📊 대시보드')}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: 'none',
                borderRadius: '6px',
                background: '#10B981',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '42px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme === 'dark' ? '#059669' : '#0D9488';
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#10B981';
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
              }}
            >
              📊 대시보드
            </button>
            
            <button 
              onClick={() => alert('💼 포트폴리오')}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: 'none',
                borderRadius: '6px',
                background: theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(226, 232, 240, 0.8)',
                color: theme === 'dark' ? '#E5E7EB' : '#1e293b',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '42px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#10B981';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(226, 232, 240, 0.8)';
                e.currentTarget.style.color = theme === 'dark' ? '#E5E7EB' : '#1e293b';
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              💼 포트폴리오
            </button>
            
            <button 
              onClick={() => alert('🤖 AI 추천')}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: 'none',
                borderRadius: '6px',
                background: theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(226, 232, 240, 0.8)',
                color: theme === 'dark' ? '#E5E7EB' : '#1e293b',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '42px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#10B981';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(226, 232, 240, 0.8)';
                e.currentTarget.style.color = theme === 'dark' ? '#E5E7EB' : '#1e293b';
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              🤖 AI 추천
            </button>
            
            <button 
              onClick={() => alert('🔔 알림')}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: 'none',
                borderRadius: '6px',
                background: theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(226, 232, 240, 0.8)',
                color: theme === 'dark' ? '#E5E7EB' : '#1e293b',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '42px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#10B981';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(226, 232, 240, 0.8)';
                e.currentTarget.style.color = theme === 'dark' ? '#E5E7EB' : '#1e293b';
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              🔔 알림
            </button>
            
            <button 
              onClick={() => alert('⚙️ 설정')}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: 'none',
                borderRadius: '6px',
                background: theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(226, 232, 240, 0.8)',
                color: theme === 'dark' ? '#E5E7EB' : '#1e293b',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '42px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#10B981';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(226, 232, 240, 0.8)';
                e.currentTarget.style.color = theme === 'dark' ? '#E5E7EB' : '#1e293b';
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              ⚙️ 설정
            </button>

            {/* 구분선 */}
            <div style={{
              height: '1px',
              background: theme === 'dark' ? '#374151' : '#e2e8f0',
              margin: '12px 0 8px 0'
            }}></div>

            {/* 차트 선택 섹션 */}
            <div style={{
              color: '#10B981',
              fontWeight: 'bold',
              textAlign: 'left',
              fontSize: '1.1rem',
              marginBottom: '8px',
              borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
              paddingBottom: '8px'
            }}>📊 차트 선택</div>
            
            <button 
              onClick={() => handleChartSelect('major')}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: 'none',
                borderRadius: '6px',
                background: selectedChart === 'major' ? '#10B981' : (theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(226, 232, 240, 0.8)'),
                color: selectedChart === 'major' ? 'white' : (theme === 'dark' ? '#E5E7EB' : '#1e293b'),
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '42px',
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
                  e.currentTarget.style.background = theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(226, 232, 240, 0.8)';
                  e.currentTarget.style.color = theme === 'dark' ? '#E5E7EB' : '#1e293b';
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
                padding: '10px 14px',
                border: 'none',
                borderRadius: '6px',
                background: selectedChart === 'kospi' ? '#10B981' : (theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(226, 232, 240, 0.8)'),
                color: selectedChart === 'kospi' ? 'white' : (theme === 'dark' ? '#E5E7EB' : '#1e293b'),
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '42px',
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
                  e.currentTarget.style.background = theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(226, 232, 240, 0.8)';
                  e.currentTarget.style.color = theme === 'dark' ? '#E5E7EB' : '#1e293b';
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
                padding: '10px 14px',
                border: 'none',
                borderRadius: '6px',
                background: selectedChart === 'nasdaq' ? '#10B981' : (theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(226, 232, 240, 0.8)'),
                color: selectedChart === 'nasdaq' ? 'white' : (theme === 'dark' ? '#E5E7EB' : '#1e293b'),
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '42px',
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
                  e.currentTarget.style.background = theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(226, 232, 240, 0.8)';
                  e.currentTarget.style.color = theme === 'dark' ? '#E5E7EB' : '#1e293b';
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
                padding: '10px 14px',
                border: 'none',
                borderRadius: '6px',
                background: selectedChart === 'sp500' ? '#10B981' : (theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(226, 232, 240, 0.8)'),
                color: selectedChart === 'sp500' ? 'white' : (theme === 'dark' ? '#E5E7EB' : '#1e293b'),
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '42px',
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
                  e.currentTarget.style.background = theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(226, 232, 240, 0.8)';
                  e.currentTarget.style.color = theme === 'dark' ? '#E5E7EB' : '#1e293b';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
            >
              💼 S&P500
            </button>
          </div>}

          {/* 우측 통합 사이드바 - 빠른 거래 + 포트폴리오 요약 */}
          {!isMobile && <div style={{
            position: 'fixed',
            top: '200px',
            right: '20px',
            width: '300px',
            zIndex: 1000,
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(51, 65, 85, 0.95))' 
              : 'linear-gradient(135deg, rgba(248, 250, 252, 0.98), rgba(226, 232, 240, 0.95))',
            borderLeft: `2px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backdropFilter: 'blur(15px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            maxHeight: 'calc(100vh - 220px)',
            overflowY: 'auto',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE
            boxShadow: theme === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
              : '0 8px 32px rgba(0, 0, 0, 0.12)'
          }}>
            {/* 빠른 거래 섹션 */}
            <div style={{
              color: '#10B981',
              fontWeight: 'bold',
              textAlign: 'left',
              fontSize: '1.1rem',
              marginBottom: '8px',
              borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
              paddingBottom: '8px'
            }}>💰 빠른 거래</div>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <button 
                onClick={() => handleTrade('buy')}
                disabled={isTrading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#10B981',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: isTrading ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  minHeight: '45px',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isTrading ? 0.6 : 1,
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!isTrading) {
                    e.currentTarget.style.background = theme === 'dark' ? '#059669' : '#0D9488';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isTrading) {
                    e.currentTarget.style.background = '#10B981';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                  }
                }}
              >
                💰 {isTrading ? '처리중...' : '매수'}
              </button>
              
              <button 
                onClick={() => handleTrade('sell')}
                disabled={isTrading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(226, 232, 240, 0.8)',
                  color: theme === 'dark' ? '#E5E7EB' : '#1e293b',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: isTrading ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  minHeight: '45px',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isTrading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isTrading) {
                    e.currentTarget.style.background = theme === 'dark' ? '#DC2626' : '#EF4444';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isTrading) {
                    e.currentTarget.style.background = theme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(226, 232, 240, 0.8)';
                    e.currentTarget.style.color = theme === 'dark' ? '#E5E7EB' : '#1e293b';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                💸 {isTrading ? '처리중...' : '매도'}
              </button>
            </div>

            {/* 구분선 */}
            <div style={{
              height: '1px',
              background: theme === 'dark' ? '#374151' : '#e2e8f0',
              margin: '8px 0'
            }}></div>

            {/* 포트폴리오 요약 섹션 */}
            <div style={{
              color: '#10B981',
              fontWeight: 'bold',
              textAlign: 'left',
              fontSize: '1.1rem',
              marginBottom: '8px',
              borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
              paddingBottom: '8px'
            }}>📊 포트폴리오 요약</div>
            
            {/* 총자산 정보 */}
            <div style={{
              padding: '12px',
              background: theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
              borderRadius: '8px',
              border: `1px solid ${theme === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
              marginBottom: '10px'
            }}>
              <div style={{ fontSize: '0.8rem', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: '4px' }}>총자산</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10B981' }}>$105,550.91</div>
              <div style={{ fontSize: '0.8rem', color: '#10B981' }}>+$1,575.60 (+1.52%)</div>
            </div>

            {/* 투자 종목 요약 */}
            <div style={{
              padding: '12px',
              background: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(248, 250, 252, 0.8)',
              borderRadius: '8px',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
              marginBottom: '10px'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: theme === 'dark' ? '#E5E7EB' : '#1e293b' }}>보유 종목</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>AAPL</span>
                <span style={{ fontSize: '0.75rem', color: '#10B981' }}>100주 (+3.4%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>MSFT</span>
                <span style={{ fontSize: '0.75rem', color: '#10B981' }}>50주 (+1.0%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>GOOGL</span>
                <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>25주 (-1.1%)</span>
              </div>
            </div>

            {/* 오늘 거래 요약 */}
            <div style={{
              padding: '12px',
              background: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(248, 250, 252, 0.8)',
              borderRadius: '8px',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
              marginBottom: '10px'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: theme === 'dark' ? '#E5E7EB' : '#1e293b' }}>오늘 거래</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>매수</span>
                <span style={{ fontSize: '0.75rem', color: '#10B981' }}>2건</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>매도</span>
                <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>1건</span>
              </div>
            </div>

            {/* 빠른 액션 버튼들 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => alert('📊 상세 분석 보기')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#3B82F6',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme === 'dark' ? '#1D4ED8' : '#2563EB';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#3B82F6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                📊 분석
              </button>
              <button 
                onClick={() => alert('📈 AI 추천')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#8B5CF6',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme === 'dark' ? '#6D28D9' : '#7C3AED';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#8B5CF6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                🤖 AI
              </button>
            </div>
          </div>}

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

      {/* 로그인 모달 */}
      {showLoginModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={() => setShowLoginModal(false)}
        >
          <div 
            style={{
              background: theme === 'dark' 
                ? 'linear-gradient(135deg, #1e293b, #334155)' 
                : 'linear-gradient(135deg, #ffffff, #f8fafc)',
              padding: isMobile ? '25px' : '40px',
              borderRadius: '16px',
              width: isMobile ? '320px' : '400px',
              maxWidth: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              textAlign: 'center',
              marginBottom: '30px',
              color: theme === 'dark' ? '#E5E7EB' : '#1e293b'
            }}>
              <h2 style={{ 
                fontSize: '1.8rem', 
                fontWeight: 'bold', 
                marginBottom: '8px',
                color: '#10B981' 
              }}>
                🎄 Christmas Trading
              </h2>
              <p style={{ fontSize: '1rem', opacity: 0.8 }}>
                로그인하여 트레이딩을 시작하세요
              </p>
            </div>

            <form onSubmit={handleLoginSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                }}>
                  이메일
                </label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => handleLoginFormChange('email', e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                    background: theme === 'dark' ? '#374151' : '#f8fafc',
                    color: theme === 'dark' ? '#E5E7EB' : '#1e293b',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#10B981';
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme === 'dark' ? '#374151' : '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                }}>
                  비밀번호
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => handleLoginFormChange('password', e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                    background: theme === 'dark' ? '#374151' : '#f8fafc',
                    color: theme === 'dark' ? '#E5E7EB' : '#1e293b',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#10B981';
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme === 'dark' ? '#374151' : '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  🚀 로그인
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    background: 'transparent',
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#6B7280';
                    e.currentTarget.style.color = theme === 'dark' ? '#E5E7EB' : '#374151';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme === 'dark' ? '#374151' : '#e2e8f0';
                    e.currentTarget.style.color = theme === 'dark' ? '#9CA3AF' : '#6B7280';
                  }}
                >
                  취소
                </button>
              </div>
            </form>

            <div style={{
              textAlign: 'center',
              marginTop: '20px',
              fontSize: '0.9rem',
              color: theme === 'dark' ? '#6B7280' : '#9CA3AF'
            }}>
              <p>계정이 없으신가요? <span style={{ color: '#10B981', cursor: 'pointer' }}>회원가입</span></p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StaticDashboardReact;
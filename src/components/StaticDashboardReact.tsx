// 🎄 정적 HTML을 정확히 복사한 React 컴포넌트
import React, { useState, useEffect, useMemo } from 'react';
import MajorIndicesChartJS from './charts/MajorIndicesChartJS';
import AppleStockChart from './charts/AppleStockChart';
import VolumeChart from './charts/VolumeChart';
import PortfolioChart from './charts/PortfolioChart';
import APIConnectionTest from './APIConnectionTest';
import { safePlaceOrder } from '../lib/stocksService';
import { signIn, signUp, signOut, getCurrentUser, onAuthStateChange, type AuthUser } from '../lib/authService';

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
  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // 테마 상태
  const [isSnowEnabled, setIsSnowEnabled] = useState(false); // 눈 효과 상태
  const [user, setUser] = useState<AuthUser | null>(null); // 로그인된 사용자
  const [showLoginModal, setShowLoginModal] = useState(false); // 로그인 모달 상태
  const [loginForm, setLoginForm] = useState({ email: '', password: '', displayName: '' }); // 로그인 폼
  const [isSignUpMode, setIsSignUpMode] = useState(false); // 회원가입 모드
  const [authLoading, setAuthLoading] = useState(false); // 로그인 처리 중
  const [isMobile, setIsMobile] = useState(false); // 모바일 환경 체크
  
  // 버튼 모달 상태
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [showBacktestModal, setShowBacktestModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [showStocksModal, setShowStocksModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

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

  // Auth 상태 초기화 및 감지
  useEffect(() => {
    const initAuth = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    initAuth();

    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = () => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      handleLogout();
    }
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    const result = await signOut();
    if (result.success) {
      setUser(null);
      setLoginForm({ email: '', password: '', displayName: '' });
      console.log('🚪 로그아웃 완료');
    }
    setAuthLoading(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      alert('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setAuthLoading(true);
    
    try {
      if (isSignUpMode) {
        const result = await signUp({
          email: loginForm.email,
          password: loginForm.password,
          displayName: loginForm.displayName
        });
        
        if (result.success) {
          console.log('🎉 회원가입 성공!');
          alert('회원가입이 완료되었습니다. 이메일을 확인해주세요.');
          setShowLoginModal(false);
          setLoginForm({ email: '', password: '', displayName: '' });
          setIsSignUpMode(false);
        } else {
          alert(`회원가입 실패: ${result.error}`);
        }
      } else {
        const result = await signIn({
          email: loginForm.email,
          password: loginForm.password
        });
        
        if (result.success) {
          console.log(`👋 ${loginForm.email}로 로그인 완료`);
          setShowLoginModal(false);
          setLoginForm({ email: '', password: '', displayName: '' });
        } else {
          alert(`로그인 실패: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('🔐 인증 에러:', error);
      alert('인증 처리 중 오류가 발생했습니다.');
    }
    
    setAuthLoading(false);
  };

  const handleLoginFormChange = (field: 'email' | 'password' | 'displayName', value: string) => {
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
          onClick={() => setShowStrategyModal(true)}
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
          onClick={() => setShowPricingModal(true)}
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
          onClick={() => setShowBacktestModal(true)}
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
          onClick={() => setShowBenefitsModal(true)}
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
          onClick={() => setShowStocksModal(true)}
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
          onClick={() => setShowSecurityModal(true)}
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
          disabled={authLoading}
          style={{
            padding: isMobile ? '6px 10px' : '8px 15px',
            border: 'none',
            borderRadius: '8px',
            background: user ? '#EF4444' : '#8B5CF6',
            color: 'white',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: authLoading ? 'wait' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: authLoading ? 0.7 : 1
          }}
        >
          {authLoading ? '로딩 중...' : (user ? `${user.displayName || user.email.split('@')[0]}` : '로그인')}
        </button>
      </div>

      {/* Christmas 장식 */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-green-500 via-yellow-500 to-red-500 opacity-30 z-10"></div>

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

      <div className="dashboard" style={{ marginTop: isMobile ? '20px' : '20px', width: '100%', paddingLeft: '0' }}>
        {/* 메인 콘텐츠 - 전체 화면 활용 */}
        <div className="main-content" style={{ width: '100%', marginLeft: '0' }}>

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
                  Christmas Portfolio $105,550.91
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
                {user && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#10B981',
                    fontWeight: '600'
                  }}>
                    {user.displayName || user.email.split('@')[0]}님 접속중
                  </div>
                )}
                <div>마지막 업데이트: {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} | 실시간</div>
              </div>
            </div>
          </div>


          {/* 📊 메인 차트 영역 - 전체 화면 최대 활용 */}
          <div style={{ 
            position: 'relative', 
            width: '100%',
            minHeight: 'auto', // 높이 제한 제거하여 표가 보이도록 수정
            padding: isMobile 
              ? '15px 15px' // 모바일: 사이드바 없이 최소 패딩
              : '20px 340px 20px 280px', // 데스크톱: 좌우 사이드바 공간 확보 + 여유 공간
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '15px' : '20px',
            paddingBottom: '50px' // 하단 여백 추가하여 표가 완전히 보이도록
          }}>
            {/* 메인 실시간 주식 차트 - 전체 화면 최대 활용 */}
            <div style={{
              background: theme === 'dark' 
                ? 'linear-gradient(135deg, #1e293b, #334155)' 
                : 'linear-gradient(135deg, #ffffff, #f8fafc)',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
              borderRadius: '12px',
              padding: isMobile ? '15px' : '30px',
              height: isMobile ? '350px' : '500px', // 메인 차트 높이 축소하여 표가 보이도록
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
                {selectedChart === 'major' && '주요 지수 (KOSPI, NASDAQ, S&P500)'}
                {selectedChart === 'kospi' && 'KOSPI - 한국 종합주가지수'}
                {selectedChart === 'nasdaq' && 'NASDAQ - 나스닥 종합지수'}
                {selectedChart === 'sp500' && 'S&P500 - 미국 주요 500개 기업'}
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
              height: isMobile ? 'auto' : '350px' // 하단 차트들 높이 축소
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
                  AAPL - Apple Inc.
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
                  거래량
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
            top: '140px',
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
            }}>메뉴</div>
            
            <button 
              onClick={() => alert('대시보드')}
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
              대시보드
            </button>
            
            <button 
              onClick={() => alert('포트폴리오')}
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
            }}>차트 선택</div>
            
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
              KOSPI
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
            top: '140px',
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
            }}>포트폴리오 요약</div>
            
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
                분석
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
                AI
              </button>
            </div>
          </div>}

          {/* 테이블 섹션 - 명확한 위치와 스타일링 */}
          <div className="tables-section" style={{
            width: '100%',
            maxWidth: '100%',
            padding: isMobile ? '20px 15px' : '20px 300px 20px 300px', // 사이드바 공간 확보
            marginTop: '30px',
            position: 'relative',
            zIndex: 5,
            clear: 'both'
          }}>
            {/* 보유 종목 */}
            <div className="table-container" style={{
              background: theme === 'dark' ? '#1e293b' : '#ffffff',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
              borderRadius: '12px',
              overflow: 'hidden',
              minHeight: '300px',
              width: '100%'
            }}>
              <div className="table-header" style={{
                background: theme === 'dark' ? '#374151' : '#f1f5f9',
                padding: '15px 20px',
                fontWeight: '600',
                color: theme === 'dark' ? '#E5E7EB' : '#475569'
              }}>보유 종목</div>
              <table className="table" style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: theme === 'dark' ? '#1e293b' : '#ffffff',
                color: theme === 'dark' ? '#E5E7EB' : '#1e293b'
              }}>
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
            <div className="table-container" style={{
              background: theme === 'dark' ? '#1e293b' : '#ffffff',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
              borderRadius: '12px',
              overflow: 'hidden',
              minHeight: '300px',
              width: '100%'
            }}>
              <div className="table-header" style={{
                background: theme === 'dark' ? '#374151' : '#f1f5f9',
                padding: '15px 20px',
                fontWeight: '600',
                color: theme === 'dark' ? '#E5E7EB' : '#475569'
              }}>최근 주문</div>
              <table className="table" style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: theme === 'dark' ? '#1e293b' : '#ffffff',
                color: theme === 'dark' ? '#E5E7EB' : '#1e293b'
              }}>
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
                Christmas Trading
              </h2>
              <p style={{ fontSize: '1rem', opacity: 0.8 }}>
                {isSignUpMode ? '새 계정을 만들어 트레이딩을 시작하세요' : '로그인하여 트레이딩을 시작하세요'}
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

              {isSignUpMode && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                  }}>
                    닉네임 (선택사항)
                  </label>
                  <input
                    type="text"
                    value={loginForm.displayName}
                    onChange={(e) => handleLoginFormChange('displayName', e.target.value)}
                    placeholder="표시될 이름"
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
              )}

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
                  disabled={authLoading}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: authLoading ? '#6B7280' : 'linear-gradient(135deg, #10B981, #059669)',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: authLoading ? 'wait' : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: authLoading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!authLoading) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!authLoading) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {authLoading ? '⏳ 처리 중...' : (isSignUpMode ? '🎉 회원가입' : '🚀 로그인')}
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
              <p>
                {isSignUpMode ? '이미 계정이 있으신가요? ' : '계정이 없으신가요? '}
                <span 
                  style={{ color: '#10B981', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => {
                    setIsSignUpMode(!isSignUpMode);
                    setLoginForm({ email: '', password: '', displayName: '' });
                  }}
                >
                  {isSignUpMode ? '로그인' : '회원가입'}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 투자 전략 설정 모달 */}
      {showStrategyModal && (
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
          onClick={() => setShowStrategyModal(false)}
        >
          <div 
            style={{
              background: theme === 'dark' 
                ? 'linear-gradient(135deg, #1e293b, #334155)' 
                : 'linear-gradient(135deg, #ffffff, #f8fafc)',
              padding: isMobile ? '25px' : '40px',
              borderRadius: '16px',
              width: isMobile ? '350px' : '500px',
              maxWidth: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
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
                🎯 투자 전략 설정
              </h2>
              <p style={{ 
                fontSize: '1rem', 
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                marginBottom: '0'
              }}>
                AI 기반 맞춤형 투자 전략을 설정하세요
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 투자 성향 선택 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#E5E7EB' : '#374151',
                  marginBottom: '8px'
                }}>
                  📊 투자 성향
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {['보수적', '중도', '공격적'].map((type) => (
                    <button
                      key={type}
                      style={{
                        padding: '8px 16px',
                        border: `2px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                        borderRadius: '8px',
                        background: 'transparent',
                        color: theme === 'dark' ? '#E5E7EB' : '#374151',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#10B981';
                        e.currentTarget.style.color = '#10B981';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = theme === 'dark' ? '#374151' : '#e2e8f0';
                        e.currentTarget.style.color = theme === 'dark' ? '#E5E7EB' : '#374151';
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* 투자 목표 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#E5E7EB' : '#374151',
                  marginBottom: '8px'
                }}>
                  🎯 투자 목표
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                    background: theme === 'dark' ? '#374151' : '#f8fafc',
                    color: theme === 'dark' ? '#E5E7EB' : '#1e293b',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                >
                  <option value="">목표를 선택하세요</option>
                  <option value="short">단기 수익 (1-3개월)</option>
                  <option value="medium">중기 성장 (6개월-1년)</option>
                  <option value="long">장기 투자 (1년 이상)</option>
                  <option value="pension">노후 준비</option>
                </select>
              </div>

              {/* 투자 금액 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#E5E7EB' : '#374151',
                  marginBottom: '8px'
                }}>
                  💰 투자 가능 금액
                </label>
                <input
                  type="number"
                  placeholder="예: 1000000 (백만원)"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                    background: theme === 'dark' ? '#374151' : '#f8fafc',
                    color: theme === 'dark' ? '#E5E7EB' : '#1e293b',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 관심 섹터 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#E5E7EB' : '#374151',
                  marginBottom: '8px'
                }}>
                  🏭 관심 섹터 (복수 선택 가능)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {['기술주', '금융', '헬스케어', '제조업', '에너지', '소비재'].map((sector) => (
                    <label key={sector} style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      color: theme === 'dark' ? '#E5E7EB' : '#374151'
                    }}>
                      <input 
                        type="checkbox" 
                        style={{ marginRight: '8px' }}
                      />
                      {sector}
                    </label>
                  ))}
                </div>
              </div>

              {/* 버튼 그룹 */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
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
                  onClick={() => {
                    setShowStrategyModal(false);
                    // TODO: 실제 전략 설정 로직 구현
                  }}
                >
                  🚀 전략 적용하기
                </button>
                
                <button
                  onClick={() => setShowStrategyModal(false)}
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
            </div>
          </div>
        </div>
      )}

      {/* 요금제 업그레이드 모달 */}
      {showPricingModal && (
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
          onClick={() => setShowPricingModal(false)}
        >
          <div 
            style={{
              background: theme === 'dark' 
                ? 'linear-gradient(135deg, #1e293b, #334155)' 
                : 'linear-gradient(135deg, #ffffff, #f8fafc)',
              padding: isMobile ? '25px' : '40px',
              borderRadius: '16px',
              width: isMobile ? '350px' : '600px',
              maxWidth: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
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
                💎 프리미엄 요금제
              </h2>
              <p style={{ 
                fontSize: '1rem', 
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                marginBottom: '0'
              }}>
                더 많은 기능과 실시간 데이터로 트레이딩을 업그레이드하세요
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 현재 플랜 */}
              <div style={{
                padding: '20px',
                borderRadius: '12px',
                border: `2px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                background: theme === 'dark' ? '#374151' : '#f8fafc'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    color: theme === 'dark' ? '#E5E7EB' : '#374151',
                    margin: '0'
                  }}>
                    🆓 무료 플랜 (현재)
                  </h3>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#10B981'
                  }}>
                    ₩0/월
                  </span>
                </div>
                <ul style={{
                  margin: '0',
                  paddingLeft: '20px',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  fontSize: '0.9rem'
                }}>
                  <li>기본 차트 및 시세 정보</li>
                  <li>3개 종목 포트폴리오</li>
                  <li>일반 속도 데이터 업데이트</li>
                  <li>기본 투자 전략 추천</li>
                </ul>
              </div>

              {/* 프리미엄 플랜들 */}
              {[
                {
                  title: '🥉 스탠다드',
                  price: '₩29,900',
                  popular: false,
                  features: [
                    '실시간 고속 데이터 (1초 업데이트)',
                    '15개 종목 포트폴리오',
                    'AI 기반 매매 신호',
                    '손익률 상세 분석',
                    '모바일 알림 서비스',
                    '월 100회 백테스트'
                  ]
                },
                {
                  title: '🥈 프로페셔널',
                  price: '₩59,900',
                  popular: true,
                  features: [
                    '실시간 초고속 데이터 (0.1초 업데이트)',
                    '50개 종목 포트폴리오',
                    '고급 AI 투자 전략',
                    '리스크 관리 시스템',
                    '개인 맞춤형 대시보드',
                    '무제한 백테스트',
                    '전담 고객 지원'
                  ]
                },
                {
                  title: '🥇 엔터프라이즈',
                  price: '₩99,900',
                  popular: false,
                  features: [
                    '기관급 실시간 데이터',
                    '무제한 종목 포트폴리오',
                    '프리미엄 AI 알고리즘',
                    '자동 매매 시스템',
                    'API 접근 권한',
                    '고급 분석 도구',
                    '우선 고객 지원',
                    '월간 전문가 리포트'
                  ]
                }
              ].map((plan, index) => (
                <div key={index} style={{
                  padding: '25px',
                  borderRadius: '12px',
                  border: plan.popular 
                    ? '2px solid #10B981' 
                    : `2px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                  background: plan.popular 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))' 
                    : theme === 'dark' ? '#1e293b' : '#ffffff',
                  position: 'relative'
                }}>
                  {plan.popular && (
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#10B981',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      🔥 인기
                    </div>
                  )}
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <h3 style={{
                      fontSize: '1.3rem',
                      fontWeight: '700',
                      color: plan.popular ? '#10B981' : (theme === 'dark' ? '#E5E7EB' : '#374151'),
                      margin: '0'
                    }}>
                      {plan.title}
                    </h3>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                        color: plan.popular ? '#10B981' : (theme === 'dark' ? '#E5E7EB' : '#374151')
                      }}>
                        {plan.price}
                      </span>
                      <div style={{
                        fontSize: '0.8rem',
                        color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                      }}>
                        /월
                      </div>
                    </div>
                  </div>
                  
                  <ul style={{
                    margin: '0 0 20px 0',
                    paddingLeft: '20px',
                    color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
                    fontSize: '0.9rem'
                  }}>
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} style={{ marginBottom: '6px' }}>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      border: 'none',
                      borderRadius: '8px',
                      background: plan.popular 
                        ? 'linear-gradient(135deg, #10B981, #059669)'
                        : theme === 'dark' ? '#374151' : '#f3f4f6',
                      color: plan.popular 
                        ? 'white' 
                        : theme === 'dark' ? '#E5E7EB' : '#374151',
                      fontSize: '1rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (plan.popular) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
                      } else {
                        e.currentTarget.style.background = theme === 'dark' ? '#4B5563' : '#e5e7eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (plan.popular) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      } else {
                        e.currentTarget.style.background = theme === 'dark' ? '#374151' : '#f3f4f6';
                      }
                    }}
                    onClick={() => {
                      setShowPricingModal(false);
                      // TODO: 결제 페이지로 이동 또는 결제 모달 표시
                    }}
                  >
                    {plan.popular ? '🚀 지금 업그레이드' : '플랜 선택'}
                  </button>
                </div>
              ))}

              {/* 닫기 버튼 */}
              <button
                onClick={() => setShowPricingModal(false)}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  background: 'transparent',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  marginTop: '10px'
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
                나중에 하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 백테스트 실행 모달 */}
      {showBacktestModal && (
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
          onClick={() => setShowBacktestModal(false)}
        >
          <div 
            style={{
              background: theme === 'dark' 
                ? 'linear-gradient(135deg, #1e293b, #334155)' 
                : 'linear-gradient(135deg, #ffffff, #f8fafc)',
              padding: isMobile ? '25px' : '40px',
              borderRadius: '16px',
              width: isMobile ? '350px' : '550px',
              maxWidth: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
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
                📊 백테스트 실행
              </h2>
              <p style={{ 
                fontSize: '1rem', 
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                marginBottom: '0'
              }}>
                과거 데이터로 투자 전략의 성과를 시뮬레이션해보세요
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 백테스트 기간 설정 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#E5E7EB' : '#374151',
                  marginBottom: '8px'
                }}>
                  📅 백테스트 기간
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.9rem', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                      시작일
                    </label>
                    <input
                      type="date"
                      defaultValue="2023-01-01"
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                        background: theme === 'dark' ? '#374151' : '#f8fafc',
                        color: theme === 'dark' ? '#E5E7EB' : '#1e293b',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                      종료일
                    </label>
                    <input
                      type="date"
                      defaultValue="2024-12-31"
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                        background: theme === 'dark' ? '#374151' : '#f8fafc',
                        color: theme === 'dark' ? '#E5E7EB' : '#1e293b',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 초기 자본금 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#E5E7EB' : '#374151',
                  marginBottom: '8px'
                }}>
                  💰 초기 자본금
                </label>
                <input
                  type="number"
                  placeholder="예: 10000000 (천만원)"
                  defaultValue="10000000"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                    background: theme === 'dark' ? '#374151' : '#f8fafc',
                    color: theme === 'dark' ? '#E5E7EB' : '#1e293b',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 투자 전략 선택 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#E5E7EB' : '#374151',
                  marginBottom: '8px'
                }}>
                  🎯 투자 전략
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'momentum', name: '모멘텀 전략', desc: '상승 추세 종목 매수' },
                    { id: 'value', name: '가치 투자', desc: '저평가 우량주 장기 보유' },
                    { id: 'technical', name: '기술적 분석', desc: 'RSI, MACD 등 지표 활용' },
                    { id: 'mixed', name: '혼합 전략', desc: '여러 전략 조합' }
                  ].map((strategy) => (
                    <label key={strategy.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#10B981';
                      e.currentTarget.style.background = theme === 'dark' ? '#374151' : '#f0fdf4';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme === 'dark' ? '#374151' : '#e2e8f0';
                      e.currentTarget.style.background = 'transparent';
                    }}
                    >
                      <input 
                        type="radio" 
                        name="strategy"
                        value={strategy.id}
                        style={{ marginRight: '10px' }}
                      />
                      <div>
                        <div style={{
                          fontWeight: '600',
                          color: theme === 'dark' ? '#E5E7EB' : '#374151',
                          fontSize: '0.95rem'
                        }}>
                          {strategy.name}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                        }}>
                          {strategy.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 종목 선택 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#E5E7EB' : '#374151',
                  marginBottom: '8px'
                }}>
                  📈 백테스트 종목
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[
                    '삼성전자', 'LG에너지솔루션', 'SK하이닉스', 
                    'NAVER', '카카오', '현대차'
                  ].map((stock) => (
                    <label key={stock} style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      color: theme === 'dark' ? '#E5E7EB' : '#374151'
                    }}>
                      <input 
                        type="checkbox" 
                        style={{ marginRight: '8px' }}
                        defaultChecked={['삼성전자', 'SK하이닉스'].includes(stock)}
                      />
                      {stock}
                    </label>
                  ))}
                </div>
              </div>

              {/* 실행 버튼 */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => {
                    setShowBacktestModal(false);
                    // TODO: 백테스트 실행 로직 구현
                  }}
                >
                  🚀 백테스트 시작
                </button>
                
                <button
                  onClick={() => setShowBacktestModal(false)}
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

              {/* 백테스트 정보 */}
              <div style={{
                padding: '15px',
                borderRadius: '8px',
                background: theme === 'dark' ? '#374151' : '#f0f9ff',
                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#bae6fd'}`,
                fontSize: '0.85rem',
                color: theme === 'dark' ? '#D1D5DB' : '#0c4a6e'
              }}>
                💡 <strong>백테스트 팁:</strong> 과거 데이터를 기반으로 한 시뮬레이션 결과는 미래 수익을 보장하지 않습니다. 
                실제 투자 전 충분한 검토를 해주세요.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 주요 종목 현황 모달 */}
      {showStocksModal && (
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
          onClick={() => setShowStocksModal(false)}
        >
          <div 
            style={{
              background: theme === 'dark' 
                ? 'linear-gradient(135deg, #1e293b, #334155)' 
                : 'linear-gradient(135deg, #ffffff, #f8fafc)',
              padding: isMobile ? '25px' : '40px',
              borderRadius: '16px',
              width: isMobile ? '350px' : '650px',
              maxWidth: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
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
                📈 주요 종목 현황
              </h2>
              <p style={{ 
                fontSize: '1rem', 
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                marginBottom: '0'
              }}>
                실시간 주요 종목의 가격과 등락률을 확인하세요
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* 시장 지수 */}
              <div style={{
                padding: '20px',
                borderRadius: '12px',
                background: theme === 'dark' ? '#374151' : '#f8fafc',
                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#e2e8f0'}`
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#E5E7EB' : '#374151',
                  marginBottom: '15px',
                  margin: '0 0 15px 0'
                }}>
                  📊 주요 지수
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  {[
                    { name: 'KOSPI', value: '2,485.67', change: '+12.34', rate: '+0.50%', positive: true },
                    { name: 'KOSDAQ', value: '745.23', change: '-3.45', rate: '-0.46%', positive: false },
                    { name: 'KOSPIx200', value: '325.89', change: '+1.23', rate: '+0.38%', positive: true }
                  ].map((index, i) => (
                    <div key={i} style={{
                      textAlign: 'center',
                      padding: '12px',
                      borderRadius: '8px',
                      background: theme === 'dark' ? '#1e293b' : '#ffffff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`
                    }}>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: theme === 'dark' ? '#E5E7EB' : '#374151',
                        marginBottom: '5px'
                      }}>
                        {index.name}
                      </div>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: theme === 'dark' ? '#E5E7EB' : '#1e293b',
                        marginBottom: '3px'
                      }}>
                        {index.value}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: index.positive ? '#10B981' : '#EF4444',
                        fontWeight: '600'
                      }}>
                        {index.change} ({index.rate})
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 인기 종목 */}
              <div style={{
                padding: '20px',
                borderRadius: '12px',
                background: theme === 'dark' ? '#374151' : '#f8fafc',
                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#e2e8f0'}`
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#E5E7EB' : '#374151',
                  marginBottom: '15px',
                  margin: '0 0 15px 0'
                }}>
                  🔥 인기 종목 TOP 10
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { rank: 1, name: '삼성전자', code: '005930', price: '75,000', change: '+1,500', rate: '+2.04%', positive: true },
                    { rank: 2, name: 'LG에너지솔루션', code: '373220', price: '412,500', change: '-8,500', rate: '-2.02%', positive: false },
                    { rank: 3, name: 'SK하이닉스', code: '000660', price: '138,500', change: '+3,500', rate: '+2.59%', positive: true },
                    { rank: 4, name: 'NAVER', code: '035420', price: '189,000', change: '-2,000', rate: '-1.05%', positive: false },
                    { rank: 5, name: '카카오', code: '035720', price: '45,250', change: '+750', rate: '+1.69%', positive: true },
                    { rank: 6, name: '현대차', code: '005380', price: '246,500', change: '+4,500', rate: '+1.86%', positive: true },
                    { rank: 7, name: 'LG화학', code: '051910', price: '367,000', change: '-5,000', rate: '-1.34%', positive: false },
                    { rank: 8, name: '포스코홀딩스', code: '005490', price: '389,500', change: '+2,500', rate: '+0.65%', positive: true }
                  ].map((stock) => (
                    <div key={stock.rank} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: '8px',
                      background: theme === 'dark' ? '#1e293b' : '#ffffff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme === 'dark' ? '#334155' : '#f0f9ff';
                      e.currentTarget.style.borderColor = '#10B981';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = theme === 'dark' ? '#1e293b' : '#ffffff';
                      e.currentTarget.style.borderColor = theme === 'dark' ? '#374151' : '#e2e8f0';
                    }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#10B981',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          {stock.rank}
                        </div>
                        <div>
                          <div style={{
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            color: theme === 'dark' ? '#E5E7EB' : '#374151'
                          }}>
                            {stock.name}
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                          }}>
                            {stock.code}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          color: theme === 'dark' ? '#E5E7EB' : '#1e293b',
                          marginBottom: '2px'
                        }}>
                          {stock.price}원
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: stock.positive ? '#10B981' : '#EF4444',
                          fontWeight: '600'
                        }}>
                          {stock.change} ({stock.rate})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 업종별 현황 */}
              <div style={{
                padding: '20px',
                borderRadius: '12px',
                background: theme === 'dark' ? '#374151' : '#f8fafc',
                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#e2e8f0'}`
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#E5E7EB' : '#374151',
                  marginBottom: '15px',
                  margin: '0 0 15px 0'
                }}>
                  🏭 업종별 현황
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    { sector: '반도체', rate: '+1.8%', positive: true },
                    { sector: '자동차', rate: '+2.1%', positive: true },
                    { sector: '화학', rate: '-0.5%', positive: false },
                    { sector: '금융', rate: '+0.3%', positive: true },
                    { sector: '헬스케어', rate: '-1.2%', positive: false },
                    { sector: '게임', rate: '+3.4%', positive: true }
                  ].map((sector, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px',
                      borderRadius: '6px',
                      background: theme === 'dark' ? '#1e293b' : '#ffffff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`
                    }}>
                      <span style={{
                        fontSize: '0.9rem',
                        color: theme === 'dark' ? '#E5E7EB' : '#374151'
                      }}>
                        {sector.sector}
                      </span>
                      <span style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: sector.positive ? '#10B981' : '#EF4444'
                      }}>
                        {sector.rate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 닫기 버튼 */}
              <button
                onClick={() => setShowStocksModal(false)}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  background: 'transparent',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  marginTop: '10px'
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
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 친구 초대 혜택 모달 */}
      {showBenefitsModal && (
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
          onClick={() => setShowBenefitsModal(false)}
        >
          <div 
            style={{
              background: theme === 'dark' 
                ? 'linear-gradient(135deg, #1e293b, #334155)' 
                : 'linear-gradient(135deg, #ffffff, #f8fafc)',
              padding: isMobile ? '25px' : '40px',
              borderRadius: '16px',
              width: isMobile ? '350px' : '500px',
              maxWidth: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
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
                🎁 친구 초대 혜택
              </h2>
              <p style={{ 
                fontSize: '1rem', 
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                marginBottom: '0'
              }}>
                친구를 초대하고 함께 트레이딩의 즐거움을 나누세요
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 혜택 안내 */}
              <div style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
                border: '2px solid #10B981'
              }}>
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#10B981',
                  marginBottom: '15px',
                  margin: '0 0 15px 0'
                }}>
                  🌟 초대 혜택
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    '친구 1명 초대 시: 프리미엄 1개월 무료',
                    '친구 3명 초대 시: 프리미엄 3개월 무료 + 10만원 거래 크레딧',
                    '친구 5명 초대 시: 프리미엄 6개월 무료 + 50만원 거래 크레딧',
                    '친구 10명 초대 시: 프리미엄 1년 무료 + 100만원 거래 크레딧'
                  ].map((benefit, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.9rem',
                      color: theme === 'dark' ? '#E5E7EB' : '#374151'
                    }}>
                      <span style={{ color: '#10B981', fontSize: '1.1rem' }}>✓</span>
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>

              {/* 초대 코드 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#E5E7EB' : '#374151',
                  marginBottom: '8px'
                }}>
                  🔗 나의 초대 코드
                </label>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    value="CTRADE2024X9K"
                    readOnly
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                      background: theme === 'dark' ? '#374151' : '#f8fafc',
                      color: theme === 'dark' ? '#E5E7EB' : '#1e293b',
                      fontSize: '1rem',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}
                  />
                  <button
                    style={{
                      padding: '12px 20px',
                      border: 'none',
                      borderRadius: '8px',
                      background: '#10B981',
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#059669';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#10B981';
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText('CTRADE2024X9K');
                      // TODO: 복사 완료 토스트 메시지 표시
                    }}
                  >
                    복사
                  </button>
                </div>
                <p style={{
                  fontSize: '0.8rem',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  marginTop: '8px',
                  margin: '8px 0 0 0'
                }}>
                  친구가 가입할 때 이 코드를 입력하면 서로 혜택을 받을 수 있어요!
                </p>
              </div>

              {/* 초대 현황 */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#E5E7EB' : '#374151',
                  marginBottom: '8px'
                }}>
                  📊 현재 초대 현황
                </label>
                <div style={{
                  padding: '15px',
                  borderRadius: '8px',
                  background: theme === 'dark' ? '#374151' : '#f8fafc',
                  border: `1px solid ${theme === 'dark' ? '#4B5563' : '#e2e8f0'}`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <span style={{
                      fontSize: '0.9rem',
                      color: theme === 'dark' ? '#E5E7EB' : '#374151'
                    }}>
                      성공한 초대
                    </span>
                    <span style={{
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#10B981'
                    }}>
                      2명
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: theme === 'dark' ? '#1e293b' : '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: '40%',
                      height: '100%',
                      background: 'linear-gradient(90deg, #10B981, #059669)',
                      borderRadius: '4px'
                    }} />
                  </div>
                  <p style={{
                    fontSize: '0.8rem',
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    marginTop: '8px',
                    margin: '8px 0 0 0'
                  }}>
                    다음 혜택까지 1명 더 초대하세요!
                  </p>
                </div>
              </div>

              {/* 버튼 그룹 */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => {
                    setShowBenefitsModal(false);
                    // TODO: 친구 초대 공유 기능 구현
                  }}
                >
                  🚀 친구 초대하기
                </button>
                
                <button
                  onClick={() => setShowBenefitsModal(false)}
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
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 안전한 거래 시스템 모달 */}
      {showSecurityModal && (
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
          onClick={() => setShowSecurityModal(false)}
        >
          <div 
            style={{
              background: theme === 'dark' 
                ? 'linear-gradient(135deg, #1e293b, #334155)' 
                : 'linear-gradient(135deg, #ffffff, #f8fafc)',
              padding: isMobile ? '25px' : '40px',
              borderRadius: '16px',
              width: isMobile ? '350px' : '550px',
              maxWidth: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
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
                🛡️ 안전한 거래 시스템
              </h2>
              <p style={{ 
                fontSize: '1rem', 
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                marginBottom: '0'
              }}>
                Christmas Trading의 보안 시스템과 안전장치를 소개합니다
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 보안 기능들 */}
              {[
                {
                  icon: '🔐',
                  title: '256비트 SSL 암호화',
                  desc: '모든 데이터 전송을 최고 수준의 암호화로 보호합니다',
                  color: '#3B82F6'
                },
                {
                  icon: '🔒',
                  title: '2단계 인증 (2FA)',
                  desc: 'SMS, 이메일, 앱 기반 다중 인증으로 계정을 보호합니다',
                  color: '#10B981'
                },
                {
                  icon: '🏦',
                  title: '자금 보호 시스템',
                  desc: '고객 자금은 신탁 계좌에 별도 보관되어 완전히 보호됩니다',
                  color: '#8B5CF6'
                },
                {
                  icon: '⚡',
                  title: '실시간 이상 거래 탐지',
                  desc: 'AI 기반 시스템이 24/7 이상 거래 패턴을 모니터링합니다',
                  color: '#F59E0B'
                },
                {
                  icon: '🛑',
                  title: '손실 제한 시스템',
                  desc: '자동 손절매, 일일 거래 한도 등으로 과도한 손실을 방지합니다',
                  color: '#EF4444'
                },
                {
                  icon: '🔍',
                  title: '규제 준수 및 감사',
                  desc: '금융당국 규제를 완전히 준수하며 정기적인 외부 감사를 받습니다',
                  color: '#6B7280'
                }
              ].map((feature, index) => (
                <div key={index} style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: theme === 'dark' ? '#374151' : '#f8fafc',
                  border: `1px solid ${theme === 'dark' ? '#4B5563' : '#e2e8f0'}`,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = feature.color;
                  e.currentTarget.style.background = theme === 'dark' ? '#1e293b' : '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme === 'dark' ? '#4B5563' : '#e2e8f0';
                  e.currentTarget.style.background = theme === 'dark' ? '#374151' : '#f8fafc';
                }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '15px'
                  }}>
                    <div style={{
                      fontSize: '2rem',
                      lineHeight: 1
                    }}>
                      {feature.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: feature.color,
                        marginBottom: '8px',
                        margin: '0 0 8px 0'
                      }}>
                        {feature.title}
                      </h3>
                      <p style={{
                        fontSize: '0.9rem',
                        color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
                        lineHeight: '1.5',
                        margin: '0'
                      }}>
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* 인증서 및 라이선스 */}
              <div style={{
                padding: '20px',
                borderRadius: '12px',
                background: theme === 'dark' ? '#1e293b' : '#f0fdf4',
                border: `2px solid ${theme === 'dark' ? '#10B981' : '#bbf7d0'}`
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#10B981',
                  marginBottom: '15px',
                  margin: '0 0 15px 0'
                }}>
                  🏆 인증 및 라이선스
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    'ISO 27001 정보보안',
                    'PCI DSS 결제보안',
                    '금융감독원 허가',
                    'KISA 개인정보보호'
                  ].map((cert, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.85rem',
                      color: theme === 'dark' ? '#E5E7EB' : '#374151'
                    }}>
                      <span style={{ color: '#10B981', fontSize: '1rem' }}>✓</span>
                      {cert}
                    </div>
                  ))}
                </div>
              </div>

              {/* 닫기 버튼 */}
              <button
                onClick={() => setShowSecurityModal(false)}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  background: 'transparent',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  marginTop: '10px'
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
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StaticDashboardReact;
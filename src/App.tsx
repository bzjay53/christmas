import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { CryptoCard } from './components/crypto/CryptoCard';
import { TradingButtons } from './components/crypto/TradingButtons';
import { LiveChart } from './components/crypto/LiveChart';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthButton } from './components/auth/AuthButton';
import { TradingPage } from './pages/TradingPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { TradingHistoryPage } from './pages/TradingHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import type { CryptoData } from './types/crypto';
import { safePlaceOrder } from './lib/stocksService';
import './App.css';

// 알림 타입 정의
interface Notification {
  id: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
}

// 포트폴리오 타입 정의
interface Portfolio {
  totalValue: number;
  totalChange: number;
  totalChangePercent: number;
  holdings: Array<{
    symbol: string;
    amount: number;
    value: number;
    change: number;
    changePercent: number;
  }>;
}

// 배경 효과 컴포넌트 (이모지 제거)
const BackgroundEffect: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 opacity-50" />
  );
};


// 포트폴리오 요약 컴포넌트
const PortfolioSummary: React.FC<{ portfolio: Portfolio }> = ({ portfolio }) => {
  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg">
      <h3 className="text-green-400 text-xl font-bold mb-4">
        총 포트폴리오 가치
      </h3>
      
      <div className="mb-6">
        <div className="text-white text-3xl font-bold">
          ${portfolio.totalValue.toLocaleString()}
        </div>
        <div className={`text-lg font-semibold ${
          portfolio.totalChangePercent >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {portfolio.totalChangePercent >= 0 ? '+' : ''}${portfolio.totalChange.toFixed(2)} ({portfolio.totalChangePercent.toFixed(2)}%)
        </div>
      </div>
      
      <div className="space-y-3">
        {portfolio.holdings.map((holding) => (
          <div key={holding.symbol} className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
            <div>
              <div className="text-white font-semibold">{holding.symbol}</div>
              <div className="text-gray-400 text-sm">{holding.amount} coins</div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold">${holding.value.toLocaleString()}</div>
              <div className={`text-sm font-semibold ${
                holding.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {holding.changePercent >= 0 ? '+' : ''}{holding.changePercent.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 메인 대시보드 컴포넌트 (내부에서 useAuth 사용)
function MainDashboard() {
  const { user, profile, signOut, showLoginModal } = useAuth();
  const location = useLocation();
  
  // 현재 경로에 따라 활성 메뉴 결정
  const getActiveMenu = () => {
    switch (location.pathname) {
      case '/portfolio': return '포트폴리오';
      case '/history': return '거래내역';
      case '/settings': return '설정';
      default: return '현물트레이딩';
    }
  };
  
  const activeMenu = getActiveMenu();
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([
    {
      symbol: 'BTCUSDT',
      name: 'Bitcoin (BTC)',
      price: 43250.00,
      change: 1250.00,
      changePercent: 2.98,
      volume: 28500000000,
      high24h: 44100,
      low24h: 41800
    },
    {
      symbol: 'ETHUSDT',
      name: 'Ethereum (ETH)',
      price: 2580.50,
      change: -45.00,
      changePercent: -1.72,
      volume: 15200000000,
      high24h: 2650,
      low24h: 2520
    },
    {
      symbol: 'BNBUSDT',
      name: 'Binance Coin (BNB)',
      price: 315.75,
      change: 12.30,
      changePercent: 4.05,
      volume: 890000000,
      high24h: 320,
      low24h: 298
    }
  ]);

  const [portfolio] = useState<Portfolio>({
    totalValue: 105550.91,
    totalChange: 1575.60,
    totalChangePercent: 1.52,
    holdings: [
      { symbol: 'BTCUSDT', amount: 1.25, value: 54062.50, change: 1562.50, changePercent: 2.98 },
      { symbol: 'ETHUSDT', amount: 15.5, value: 39997.75, change: -697.50, changePercent: -1.72 },
      { symbol: 'BNBUSDT', amount: 35.2, value: 11114.40, change: 432.96, changePercent: 4.05 }
    ]
  });


  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 실시간 데이터 업데이트 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      setCryptoData(prevData => prevData.map(crypto => {
        // 랜덤 가격 변동 (-2% ~ +2%)
        const changePercent = (Math.random() - 0.5) * 4;
        const newPrice = crypto.price * (1 + changePercent / 100);
        const priceChange = newPrice - crypto.price;
        
        return {
          ...crypto,
          price: newPrice,
          change: priceChange,
          changePercent: (priceChange / crypto.price) * 100,
          volume: crypto.volume + (Math.random() - 0.5) * 1000000000
        };
      }));
      
      setLastUpdate(new Date());
    }, 5000); // 5초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  // 메뉴 핸들러 - 현재 AppRouter.tsx에서 처리됨
  const handleMenuClick = useCallback((menuItem: string) => {
    switch (menuItem) {
      case '로그인':
        if (user) {
          signOut();
        } else {
          showLoginModal();
        }
        break;
      case '24/7 글로벌 거래':
        alert('🌍 24시간 글로벌 거래가 활성화되어 있습니다!\n실시간으로 전 세계 암호화폐 시장에 접근할 수 있습니다.');
        break;
      default:
        break;
    }
  }, [user, signOut, showLoginModal]);

  // 실제 거래 함수들
  const handleBuy = useCallback(async (symbol: string) => {
    if (!user) {
      showLoginModal();
      return;
    }

    setIsLoading(true);
    
    try {
      const selectedCrypto = cryptoData.find(c => c.symbol === symbol);
      if (!selectedCrypto) return;

      // 실제 거래 처리 (충돌 방지 포함)
      const result = await safePlaceOrder(
        user.id,
        symbol,
        'buy',
        0.01, // 0.01 코인 구매
        selectedCrypto.price,
        profile?.subscription_tier || 'free'
      );

      if (result.success) {
        playTradeEffect('buy');
        alert(`✅ 매수 주문 완료!\n${symbol} 0.01 코인을 $${selectedCrypto.price.toFixed(2)}에 구매했습니다.`);
      } else {
        alert(`❌ 거래 실패\n${result.message}`);
      }
    } catch (error) {
      console.error('매수 오류:', error);
      alert('거래 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, cryptoData, showLoginModal]);

  const handleSell = useCallback(async (symbol: string) => {
    if (!user) {
      showLoginModal();
      return;
    }

    setIsLoading(true);
    
    try {
      const selectedCrypto = cryptoData.find(c => c.symbol === symbol);
      if (!selectedCrypto) return;

      // 실제 거래 처리 (충돌 방지 포함)
      const result = await safePlaceOrder(
        user.id,
        symbol,
        'sell',
        0.01, // 0.01 코인 판매
        selectedCrypto.price,
        profile?.subscription_tier || 'free'
      );

      if (result.success) {
        playTradeEffect('sell');
        alert(`✅ 매도 주문 완료!\n${symbol} 0.01 코인을 $${selectedCrypto.price.toFixed(2)}에 판매했습니다.`);
      } else {
        alert(`❌ 거래 실패\n${result.message}`);
      }
    } catch (error) {
      console.error('매도 오류:', error);
      alert('거래 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, cryptoData, showLoginModal]);

  // 거래 효과 (이모지 제거)
  const playTradeEffect = (type: 'buy' | 'sell') => {
    // 간단한 플래시 효과
    const flashColor = type === 'buy' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${flashColor};
      z-index: 9999;
      pointer-events: none;
      opacity: 1;
      transition: opacity 0.5s ease-out;
    `;
    document.body.appendChild(flash);
    
    setTimeout(() => {
      flash.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(flash)) {
          document.body.removeChild(flash);
        }
      }, 500);
    }, 100);
  };

  // 현재 시간과 크리스마스까지 남은 일수
  const daysUntilChristmas = Math.ceil((new Date('2025-12-25').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative">
      <BackgroundEffect />
      
      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* 헤더 */}
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold">
              Binance Dashboard v1
            </h1>
            <AuthButton />
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 text-sm mb-2">
              <div className="text-green-400 font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Market Open
              </div>
              <div className="text-gray-400">Real-time Data</div>
            </div>
            <div className="text-gray-400 text-xs">
              Last Update: {lastUpdate.toLocaleTimeString('ko-KR')}
            </div>
          </div>
        </header>


        {/* 메인 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          
          {/* 암호화폐 카드들 */}
          <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cryptoData.map(crypto => (
              <CryptoCard 
                key={crypto.symbol} 
                crypto={crypto}
                onClick={() => setSelectedSymbol(crypto.symbol)}
                className={selectedSymbol === crypto.symbol ? 'ring-2 ring-green-400' : ''}
              />
            ))}
          </div>
          
          {/* 트레이딩 패널 */}
          <div className="lg:col-span-3">
            <TradingButtons 
              symbol={selectedSymbol}
              onBuy={() => handleBuy(selectedSymbol)}
              onSell={() => handleSell(selectedSymbol)}
              disabled={isLoading}
            />
          </div>
          
          {/* 메뉴 패널 */}
          <div className="lg:col-span-3 bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-blue-400 text-xl font-bold">
                메뉴
              </h3>
              <div className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                Navigation
              </div>
            </div>
            
            <div className="space-y-2">
              <div 
                onClick={() => handleMenuClick('현물트레이딩')}
                className={`group font-semibold flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                  activeMenu === '현물트레이딩' 
                    ? 'text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg border border-blue-400/50' 
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-blue-400 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activeMenu === '현물트레이딩' ? 'bg-white' : 'bg-gray-500 group-hover:bg-blue-400'
                  }`}></div>
                  <span>현물트레이딩</span>
                </div>
                {activeMenu === '현물트레이딩' && (
                  <div className="text-xs bg-white/20 px-2 py-1 rounded">활성</div>
                )}
              </div>

              <div 
                onClick={() => handleMenuClick('포트폴리오')}
                className={`group font-semibold flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                  activeMenu === '포트폴리오' 
                    ? 'text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg border border-blue-400/50' 
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-blue-400 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activeMenu === '포트폴리오' ? 'bg-white' : 'bg-gray-500 group-hover:bg-blue-400'
                  }`}></div>
                  <span>포트폴리오</span>
                </div>
                {activeMenu === '포트폴리오' && (
                  <div className="text-xs bg-white/20 px-2 py-1 rounded">활성</div>
                )}
              </div>

              <div 
                onClick={() => handleMenuClick('거래내역')}
                className={`group font-semibold flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                  activeMenu === '거래내역' 
                    ? 'text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg border border-blue-400/50' 
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-blue-400 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activeMenu === '거래내역' ? 'bg-white' : 'bg-gray-500 group-hover:bg-blue-400'
                  }`}></div>
                  <span>거래내역</span>
                </div>
                {activeMenu === '거래내역' && (
                  <div className="text-xs bg-white/20 px-2 py-1 rounded">활성</div>
                )}
              </div>

              <hr className="border-gray-700 my-3" />

              <div 
                onClick={() => handleMenuClick('로그인')}
                className="group text-gray-300 flex items-center justify-between p-3 hover:bg-gray-700/50 rounded-lg transition-all cursor-pointer hover:text-green-400 border border-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full group-hover:bg-green-400"></div>
                  <span>{user ? '로그아웃' : '로그인'}</span>
                </div>
                {user && <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded">({profile?.subscription_tier})</span>}
              </div>

              <div 
                onClick={() => handleMenuClick('설정')}
                className={`group font-semibold flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                  activeMenu === '설정' 
                    ? 'text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg border border-blue-400/50' 
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-blue-400 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activeMenu === '설정' ? 'bg-white' : 'bg-gray-500 group-hover:bg-blue-400'
                  }`}></div>
                  <span>설정</span>
                </div>
                {activeMenu === '설정' && (
                  <div className="text-xs bg-white/20 px-2 py-1 rounded">활성</div>
                )}
              </div>

              <hr className="border-gray-700 my-3" />

              <div 
                onClick={() => handleMenuClick('24/7 글로벌 거래')}
                className="group text-yellow-400 flex items-center justify-between p-3 hover:bg-yellow-500/10 rounded-lg transition-all cursor-pointer hover:text-yellow-300 border border-yellow-500/20 hover:border-yellow-400/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span>24/7 글로벌 거래</span>
                </div>
                <div className="text-xs bg-yellow-500/20 px-2 py-1 rounded">LIVE</div>
              </div>
            </div>
          </div>
        </div>

        {/* 포트폴리오 및 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          
          {/* 포트폴리오 요약 */}
          <div className="lg:col-span-5">
            <PortfolioSummary portfolio={portfolio} />
          </div>
          
          {/* 실시간 차트 */}
          <div className="lg:col-span-7">
            <LiveChart 
              symbol={selectedSymbol} 
              height={400}
              config={{ interval: '1m', type: 'line', indicators: [], theme: 'dark' }}
            />
          </div>
        </div>

        {/* 메뉴 연결선 및 선택된 메뉴 표시 */}
        <div className="relative mb-6">
          {/* 연결선 */}
          <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 w-px h-8 bg-gradient-to-b from-blue-400 to-transparent"></div>
          <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 w-3 h-3 bg-blue-400 rounded-full animate-pulse -translate-y-1"></div>
          
          {/* 선택된 메뉴 표시 박스 */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-4 border border-blue-500/30 relative">
            {/* 위쪽 화살표 */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rotate-45 border-t border-l border-blue-400/50"></div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <h2 className="text-white font-bold text-xl">
                  현재 선택: <span className="text-blue-400">{activeMenu}</span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-blue-400 text-sm">활성 메뉴</div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              </div>
            </div>
            
            {/* 메뉴별 설명 */}
            <div className="mt-3 text-gray-300 text-sm">
              {activeMenu === '현물트레이딩' && '암호화폐 현물 거래, AI 트레이딩, 매매 전략을 관리합니다.'}
              {activeMenu === '포트폴리오' && '보유 중인 암호화폐 자산과 투자 성과를 확인합니다.'}
              {activeMenu === '거래내역' && '과거 거래 기록과 수익률을 분석합니다.'}
              {activeMenu === '설정' && '계정 정보, 거래 설정, 알림 설정을 관리합니다.'}
            </div>
          </div>
        </div>

        {/* 메뉴별 콘텐츠 렌더링 */}
        <div className="border-l-4 border-blue-400 pl-6 ml-4">
          {activeMenu === '현물트레이딩' && (
            <div className="space-y-8">
              {/* AI 자동 매매 대시보드 - 현재 AppRouter.tsx에서 처리됨 */}
              {/*
              <div className="relative">
                <div className="absolute -left-8 top-4 w-3 h-3 bg-blue-400 rounded-full"></div>
                <AITradingDashboard selectedSymbol={selectedSymbol} />
              </div>
              */}

              {/* 매매 전략 시스템 - 현재 AppRouter.tsx에서 처리됨 */}
              {/*
              <div className="relative">
                <div className="absolute -left-8 top-4 w-3 h-3 bg-blue-400 rounded-full"></div>
                <TradingStrategies 
                selectedSymbol={selectedSymbol} 
                onStrategySelect={(strategy) => {
                  // 전략 적용 로직은 TradingPage.tsx에서 처리됨
                }}
              />
            </div>
              */}

              {/* 리스크 관리 시스템 - 현재 AppRouter.tsx에서 처리됨 */}
              {/*
              <div className="relative">
                <div className="absolute -left-8 top-4 w-3 h-3 bg-blue-400 rounded-full"></div>
                <RiskManagement 
                  selectedSymbol={selectedSymbol}
                  currentPortfolioValue={portfolio.totalValue}
                />
              </div>
              */}
            </div>
          )}

          {activeMenu === '포트폴리오' && (
            <div className="relative">
              <div className="absolute -left-8 top-4 w-3 h-3 bg-blue-400 rounded-full"></div>
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h2 className="text-white font-bold text-xl mb-6">📊 내 포트폴리오</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <h3 className="text-green-400 font-semibold mb-3">보유 자산</h3>
                  <div className="space-y-2">
                    {portfolio.holdings.map((holding) => (
                      <div key={holding.symbol} className="flex justify-between items-center">
                        <span className="text-gray-300">{holding.symbol}</span>
                        <span className="text-white font-bold">{holding.amount} 코인</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <h3 className="text-blue-400 font-semibold mb-3">투자 성과</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">총 투자금액:</span>
                      <span className="text-white">${(portfolio.totalValue - portfolio.totalChange).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">현재 가치:</span>
                      <span className="text-white">${portfolio.totalValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">손익:</span>
                      <span className={portfolio.totalChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {portfolio.totalChange >= 0 ? '+' : ''}${portfolio.totalChange.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          )}

          {activeMenu === '거래내역' && (
            <div className="relative">
              <div className="absolute -left-8 top-4 w-3 h-3 bg-blue-400 rounded-full"></div>
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h2 className="text-white font-bold text-xl mb-6">📋 거래 내역</h2>
              {user ? (
                <div className="space-y-3">
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-green-400 font-semibold">매수</span>
                        <span className="text-gray-300 ml-2">BTCUSDT 0.01</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white">$432.50</div>
                        <div className="text-gray-400 text-xs">2025-06-29 09:30</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-gray-400 py-8">
                    더 많은 거래 내역을 보려면 실제 거래를 진행해보세요.
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">거래 내역을 보려면 로그인이 필요합니다.</p>
                  <button 
                    onClick={showLoginModal}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-500"
                  >
                    로그인하기
                  </button>
                </div>
              )}
            </div>
            </div>
          )}

          {activeMenu === '설정' && (
            <div className="relative">
              <div className="absolute -left-8 top-4 w-3 h-3 bg-blue-400 rounded-full"></div>
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h2 className="text-white font-bold text-xl mb-6">⚙️ 설정</h2>
              {user ? (
                <div className="space-y-6">
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <h3 className="text-blue-400 font-semibold mb-3">계정 정보</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">이메일:</span>
                        <span className="text-white">{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">구독 플랜:</span>
                        <span className="text-green-400 font-semibold">{profile?.subscription_tier?.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">가입일:</span>
                        <span className="text-white">{new Date(user.created_at || '').toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <h3 className="text-yellow-400 font-semibold mb-3">거래 설정</h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="text-blue-600" defaultChecked />
                        <span className="text-gray-300">실시간 알림 받기</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="text-blue-600" defaultChecked />
                        <span className="text-gray-300">AI 매매 신호 알림</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="text-blue-600" />
                        <span className="text-gray-300">고위험 거래 경고</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">설정을 변경하려면 로그인이 필요합니다.</p>
                  <button 
                    onClick={showLoginModal}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-500"
                  >
                    로그인하기
                  </button>
                </div>
              )}
            </div>
            </div>
          )}
        </div>

        {/* 인기 코인 TOP 10 테이블 */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg mb-8">
          <h3 className="text-orange-400 font-bold text-xl mb-6 flex items-center gap-2">
            인기 코인 TOP 10
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-gray-700">
                  <th className="text-left py-2">순위</th>
                  <th className="text-left py-2">코인명</th>
                  <th className="text-right py-2">가격</th>
                  <th className="text-right py-2">변동률</th>
                  <th className="text-right py-2">거래량</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { rank: 1, name: 'Bitcoin', code: 'BTC', price: '$43,250', change: '+$1,275', rate: '+3.04%', positive: true },
                  { rank: 2, name: 'Ethereum', code: 'ETH', price: '$2,485', change: '-$125', rate: '-4.78%', positive: false },
                  { rank: 3, name: 'Binance Coin', code: 'BNB', price: '$315', change: '+$18', rate: '+6.05%', positive: true }
                ].map((coin) => (
                  <tr key={coin.rank} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                    <td className="py-3">{coin.rank}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {coin.code.slice(0, 2)}
                        </div>
                        <span className="text-white font-semibold">{coin.name}</span>
                        <span className="text-gray-400 text-xs">({coin.code})</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-white font-bold">
                      {coin.price}
                    </td>
                    <td className={`py-3 text-right font-bold ${
                      coin.positive ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {coin.rate}
                    </td>
                    <td className="py-3 text-right text-gray-400">
                      {coin.positive ? '2.4B' : '1.8B'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 시장 지수 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 shadow-lg">
            <h4 className="text-blue-400 font-bold mb-2">시장 지수</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Crypto Index</span>
                <span className="text-green-400 font-bold">+3.1%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bitcoin Dom.</span>
                <span className="text-white font-bold">42.5%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 shadow-lg">
            <h4 className="text-green-400 font-bold mb-2">DeFi Index</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">DeFi Index</span>
                <span className="text-green-400 font-bold">+5.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total TVL</span>
                <span className="text-white font-bold">$45.2B</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 shadow-lg">
            <h4 className="text-red-400 font-bold mb-2">GameFi Index</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">GameFi Index</span>
                <span className="text-red-400 font-bold">-1.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Market Cap</span>
                <span className="text-white font-bold">$8.7B</span>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <footer className="text-center bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-lg p-6">
          <div className="text-blue-400 text-lg font-bold mb-2">
            Powered by Binance API
          </div>
          <div className="text-gray-400 text-sm">
            © 2025 Binance Dashboard. Real-time crypto trading platform.
          </div>
        </footer>
      </div>
    </div>
  );
}

// 메인 App 컴포넌트
function App() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
}

export default App;
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

// 배경 효과 컴포넌트
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

// 메인 대시보드 컴포넌트
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
  
  // 상태 관리
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
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 특별 메뉴 핸들러
  const handleSpecialMenuClick = useCallback((menuItem: string) => {
    switch (menuItem) {
      case '로그인':
        if (user) {
          signOut();
        } else {
          showLoginModal();
        }
        break;
      case '24/7 글로벌 거래':
        alert('🌍 24시간 글로벌 거래가 활성화되어 있습니다!\\n실시간으로 전 세계 암호화폐 시장에 접근할 수 있습니다.');
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

      const result = await safePlaceOrder(
        user.id,
        symbol,
        'buy',
        0.01,
        selectedCrypto.price,
        profile?.subscription_tier || 'free'
      );

      if (result.success) {
        playTradeEffect('buy');
        alert(`✅ 매수 주문 완료!\\n${symbol} 0.01 코인을 $${selectedCrypto.price.toFixed(2)}에 구매했습니다.`);
      } else {
        alert(`❌ 거래 실패\\n${result.message}`);
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

      const result = await safePlaceOrder(
        user.id,
        symbol,
        'sell',
        0.01,
        selectedCrypto.price,
        profile?.subscription_tier || 'free'
      );

      if (result.success) {
        playTradeEffect('sell');
        alert(`✅ 매도 주문 완료!\\n${symbol} 0.01 코인을 $${selectedCrypto.price.toFixed(2)}에 판매했습니다.`);
      } else {
        alert(`❌ 거래 실패\\n${result.message}`);
      }
    } catch (error) {
      console.error('매도 오류:', error);
      alert('거래 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, cryptoData, showLoginModal]);

  // 거래 효과
  const playTradeEffect = (type: 'buy' | 'sell') => {
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
          
          {/* 개선된 메뉴 패널 */}
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
              <Link
                to="/"
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
              </Link>

              <Link
                to="/portfolio"
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
              </Link>

              <Link
                to="/history"
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
              </Link>

              <hr className="border-gray-700 my-3" />

              <div 
                onClick={() => handleSpecialMenuClick('로그인')}
                className="group text-gray-300 flex items-center justify-between p-3 hover:bg-gray-700/50 rounded-lg transition-all cursor-pointer hover:text-green-400 border border-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full group-hover:bg-green-400"></div>
                  <span>{user ? '로그아웃' : '로그인'}</span>
                </div>
                {user && <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded">({profile?.subscription_tier})</span>}
              </div>

              <Link
                to="/settings"
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
              </Link>

              <hr className="border-gray-700 my-3" />

              <div 
                onClick={() => handleSpecialMenuClick('24/7 글로벌 거래')}
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

        {/* 라우터 기반 페이지 콘텐츠 */}
        <Routes>
          <Route path="/" element={<TradingPage selectedSymbol={selectedSymbol} portfolio={portfolio} />} />
          <Route path="/portfolio" element={<PortfolioPage portfolio={portfolio} />} />
          <Route path="/history" element={<TradingHistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>

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
function AppRouter() {
  return (
    <AuthProvider>
      <Router>
        <MainDashboard />
      </Router>
    </AuthProvider>
  );
}

export default AppRouter;
import React, { useState, useEffect, useCallback } from 'react';
import { CryptoCard } from './components/crypto/CryptoCard';
import { TradingButtons } from './components/crypto/TradingButtons';
import { LiveChart } from './components/crypto/LiveChart';
import { AuthProvider } from './contexts/AuthContext';
import { AuthButton } from './components/auth/AuthButton';
import { AITradingDashboard } from './components/ai/AITradingDashboard';
import { TradingStrategies } from './components/trading/TradingStrategies';
import { RiskManagement } from './components/risk/RiskManagement';
import type { CryptoData } from './types/crypto';
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

function App() {
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
    }, 5000); // 5초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  // 거래 함수들
  const handleBuy = useCallback((symbol: string) => {
    setIsLoading(true);
    
    // 모의 거래 처리
    setTimeout(() => {
      setIsLoading(false);
      playTradeEffect('buy');
    }, 1500);
  }, []);

  const handleSell = useCallback((symbol: string) => {
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      playTradeEffect('sell');
    }, 1500);
  }, []);

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
    <AuthProvider>
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
            <h3 className="text-blue-400 text-xl font-bold mb-6">
              메뉴
            </h3>
            <div className="space-y-3">
              <div className="text-blue-400 font-semibold flex items-center gap-3 p-2 bg-blue-500/10 rounded-lg">
                <span>현물트레이딩</span>
              </div>
              <div className="text-gray-300 flex items-center gap-3 p-2 hover:bg-gray-700/30 rounded-lg transition-colors cursor-pointer">
                <span>포트폴리오</span>
              </div>
              <div className="text-gray-300 flex items-center gap-3 p-2 hover:bg-gray-700/30 rounded-lg transition-colors cursor-pointer">
                <span>거래내역</span>
              </div>
              <div className="text-gray-300 flex items-center gap-3 p-2 hover:bg-gray-700/30 rounded-lg transition-colors cursor-pointer">
                <span>로그인</span>
              </div>
              <div className="text-gray-300 flex items-center gap-3 p-2 hover:bg-gray-700/30 rounded-lg transition-colors cursor-pointer">
                <span>설정</span>
              </div>
              <div className="text-yellow-400 flex items-center gap-3 p-2 hover:bg-yellow-500/10 rounded-lg transition-colors cursor-pointer">
                <span>24/7 글로벌 거래</span>
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

        {/* AI 자동 매매 대시보드 */}
        <div className="mb-8">
          <AITradingDashboard selectedSymbol={selectedSymbol} />
        </div>

        {/* 매매 전략 시스템 */}
        <div className="mb-8">
          <TradingStrategies 
            selectedSymbol={selectedSymbol} 
            onStrategySelect={(strategy) => {
              console.log('선택된 전략:', strategy);
            }}
          />
        </div>

        {/* 리스크 관리 시스템 */}
        <div className="mb-8">
          <RiskManagement 
            selectedSymbol={selectedSymbol}
            currentPortfolioValue={portfolio.totalValue}
          />
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
    </AuthProvider>
  );
}

export default App;
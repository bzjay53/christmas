import React, { useState, useEffect, useCallback } from 'react';
import { CryptoCard } from './components/trading/CryptoCard';
import { TradingButtons } from './components/trading/TradingButtons';
import { LiveChart } from './components/charts/LiveChart';
import { PortfolioSummary } from './components/ui/PortfolioSummary';
import { binanceAPI } from './services/binanceAPI';
import { CryptoData, Portfolio, Notification } from './types';
import './App.css';

// 눈 내리는 컴포넌트
const SnowEffect: React.FC = () => {
  const snowflakes = ['❄️', '⭐', '🎄', '❄️', '⭐', '❄️', '🎁', '❄️', '⭐'];
  
  return (
    <div className="christmas-bg">
      {snowflakes.map((flake, index) => (
        <div key={index} className="snowflake">
          {flake}
        </div>
      ))}
    </div>
  );
};

// 알림 컴포넌트
const NotificationBar: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (notifications.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % notifications.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [notifications.length]);
  
  if (notifications.length === 0) return null;
  
  const current = notifications[currentIndex];
  
  return (
    <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-2 mb-4 animate-pulse">
      <div className="text-green-400 text-sm font-semibold">
        🔔 {current.title}: {current.message}
      </div>
    </div>
  );
};

function App() {
  // 상태 관리
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([
    {
      symbol: 'BTCUSDT',
      name: '🎄 Bitcoin',
      price: 43250.00,
      change: 1250.00,
      changePercent: 2.98,
      volume: 28500000000,
      high24h: 44100,
      low24h: 41800,
      icon: '🎄'
    },
    {
      symbol: 'ETHUSDT',
      name: '❄️ Ethereum',
      price: 2580.50,
      change: -45.00,
      changePercent: -1.72,
      volume: 15200000000,
      high24h: 2650,
      low24h: 2520,
      icon: '❄️'
    },
    {
      symbol: 'BNBUSDT',
      name: '⭐ Binance Coin',
      price: 315.75,
      change: 12.30,
      changePercent: 4.05,
      volume: 890000000,
      high24h: 320,
      low24h: 298,
      icon: '⭐'
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

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'SUCCESS',
      title: '🎁 Christmas Bonus',
      message: 'AI 거래로 $127.50 수익 달성!',
      timestamp: Date.now(),
      isRead: false
    },
    {
      id: '2',
      type: 'INFO',
      title: '📈 Market Alert',
      message: 'BTC가 $44,000 저항선 돌파 시도 중',
      timestamp: Date.now() - 60000,
      isRead: false
    }
  ]);

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
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'SUCCESS',
        title: '🎁 매수 주문 완료',
        message: `${symbol} 매수 주문이 성공적으로 처리되었습니다!`,
        timestamp: Date.now(),
        isRead: false
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
      setIsLoading(false);
      
      // 크리스마스 효과
      playTradeEffect('buy');
    }, 1500);
  }, []);

  const handleSell = useCallback((symbol: string) => {
    setIsLoading(true);
    
    setTimeout(() => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'SUCCESS',
        title: '❄️ 매도 주문 완료',
        message: `${symbol} 매도 주문이 성공적으로 처리되었습니다!`,
        timestamp: Date.now(),
        isRead: false
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
      setIsLoading(false);
      
      playTradeEffect('sell');
    }, 1500);
  }, []);

  // 거래 효과
  const playTradeEffect = (type: 'buy' | 'sell') => {
    // 화면에 일시적 효과 표시
    const effect = document.createElement('div');
    effect.className = `fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl z-50 pointer-events-none animate-bounce`;
    effect.textContent = type === 'buy' ? '🎁' : '❄️';
    document.body.appendChild(effect);
    
    setTimeout(() => {
      document.body.removeChild(effect);
    }, 2000);
  };

  // 현재 시간과 크리스마스까지 남은 일수
  const daysUntilChristmas = Math.ceil((new Date('2025-12-25').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-red-900/20 text-white relative overflow-hidden">
      {/* 눈 내리는 효과 */}
      <SnowEffect />
      
      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="christmas-logo text-6xl font-bold font-christmas mb-4">
            🎄 Christmas Crypto Trading 🎄
          </h1>
          <div className="flex items-center justify-center gap-4 text-lg mb-2">
            <div className="text-green-400 font-semibold flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              🟢 Santa's Market is Open
            </div>
            <div className="text-blue-400">🌍 24/7 북극 거래소</div>
          </div>
          <div className="text-yellow-300 text-sm">
            ⏰ 크리스마스까지 <span className="font-bold text-yellow-400">{daysUntilChristmas}일</span> 남음!
          </div>
          <div className="text-gray-400 text-xs mt-2">
            마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
          </div>
        </header>

        {/* 알림 바 */}
        <NotificationBar notifications={notifications} />

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
          
          {/* 크리스마스 메뉴 패널 */}
          <div className="lg:col-span-3 crypto-card rounded-xl p-6 glow-gold">
            <h3 className="text-yellow-400 text-xl font-bold mb-6 flex items-center gap-2">
              🎅 Santa's Menu
            </h3>
            <div className="space-y-4">
              <div className="text-green-400 font-semibold flex items-center gap-3 p-2 bg-green-500/10 rounded-lg">
                🏠 <span>워크샵 대시보드</span>
              </div>
              <div className="text-gray-300 flex items-center gap-3 p-2 hover:bg-gray-700/30 rounded-lg transition-colors cursor-pointer">
                🎁 <span>선물 포트폴리오</span>
              </div>
              <div className="text-gray-300 flex items-center gap-3 p-2 hover:bg-gray-700/30 rounded-lg transition-colors cursor-pointer">
                📊 <span>루돌프 거래내역</span>
              </div>
              <div className="text-gray-300 flex items-center gap-3 p-2 hover:bg-gray-700/30 rounded-lg transition-colors cursor-pointer">
                🔐 <span>엘프 로그인</span>
              </div>
              <div className="text-gray-300 flex items-center gap-3 p-2 hover:bg-gray-700/30 rounded-lg transition-colors cursor-pointer">
                ⚙️ <span>썰매 설정</span>
              </div>
              <div className="text-red-400 flex items-center gap-3 p-2 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer">
                🌍 <span>북극 글로벌 거래</span>
              </div>
              <div className="text-yellow-400 flex items-center gap-3 p-2 hover:bg-yellow-500/10 rounded-lg transition-colors cursor-pointer">
                ⭐ <span>크리스마스 스페셜</span>
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
            <LiveChart symbol={selectedSymbol} height={400} />
          </div>
        </div>

        {/* 하단 정보 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          
          <div className="crypto-card rounded-xl p-6">
            <h3 className="text-orange-400 font-bold mb-4 flex items-center gap-2">
              🎄 BTC - 크리스마스 트리
            </h3>
            <div className="h-24 bg-gray-800/50 rounded flex items-center justify-center">
              <div className="text-green-400 text-3xl animate-float">📈</div>
            </div>
            <div className="text-sm text-gray-400 mt-2">
              현재: ${cryptoData[0]?.price.toLocaleString()}
            </div>
          </div>
          
          <div className="crypto-card rounded-xl p-6">
            <h3 className="text-purple-400 font-bold mb-4 flex items-center gap-2">
              ❄️ 눈사람 거래량
            </h3>
            <div className="h-24 bg-gray-800/50 rounded flex items-center justify-center">
              <div className="text-blue-400 text-3xl animate-pulse">📊</div>
            </div>
            <div className="text-sm text-gray-400 mt-2">
              24h: 2.4B USDT
            </div>
          </div>
          
          <div className="lg:col-span-2 crypto-card rounded-xl p-6">
            <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2">
              ⭐ 크리스마스 시장 지수
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-400">🎄 Christmas Crypto Index</span>
                <span className="text-green-400 font-bold">+2.1%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-400">🎅 Bitcoin Santa Dom.</span>
                <span className="text-white font-bold">42.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-400">🎁 DeFi Gift Index</span>
                <span className="text-green-400 font-bold">+5.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-400">❄️ Winter GameFi Index</span>
                <span className="text-red-400 font-bold">-1.2%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 크리스마스 인기 코인 테이블 */}
        <div className="crypto-card rounded-xl p-6 mb-8">
          <h3 className="text-yellow-400 font-bold text-xl mb-6 flex items-center gap-2">
            🔥 Santa's Hot Coins TOP 10 🎄
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-gray-700">
                  <th className="text-left py-2">순위</th>
                  <th className="text-left py-2">크리스마스 코인</th>
                  <th className="text-right py-2">가격</th>
                  <th className="text-right py-2">변동률</th>
                  <th className="text-right py-2">거래량</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {cryptoData.map((crypto, index) => (
                  <tr key={crypto.symbol} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                    <td className="py-3">{index + 1}</td>
                    <td className="py-3 flex items-center gap-2">
                      <span className="text-lg">{crypto.icon}</span>
                      <span className="text-white font-semibold">{crypto.name}</span>
                    </td>
                    <td className="py-3 text-right text-white font-bold">
                      ${crypto.price.toLocaleString()}
                    </td>
                    <td className={`py-3 text-right font-bold ${
                      crypto.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {crypto.changePercent >= 0 ? '+' : ''}{crypto.changePercent.toFixed(2)}%
                    </td>
                    <td className="py-3 text-right text-gray-400">
                      {crypto.volume ? `${(crypto.volume / 1e9).toFixed(1)}B` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 크리스마스 푸터 */}
        <footer className="text-center bg-gradient-to-r from-green-600/20 to-red-600/20 rounded-lg p-6">
          <div className="text-yellow-400 text-lg font-bold mb-2">
            🎄 Powered by Binance Christmas API 🎄
          </div>
          <div className="text-green-300 mb-4">
            Ho Ho Ho! 메리 크리스마스 & 해피 트레이딩! 🎅✨
          </div>
          <div className="text-gray-400 text-sm">
            © 2025 Christmas Crypto Trading. Made with ❤️ and 🎄
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
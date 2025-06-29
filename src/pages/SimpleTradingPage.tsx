import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SimpleTradingPageProps {
  selectedSymbol: string;
  portfolio: any;
}

export function SimpleTradingPage({ selectedSymbol, portfolio }: SimpleTradingPageProps) {
  const { user, showLoginModal } = useAuth();
  const [amount, setAmount] = useState(100);
  const [isTrading, setIsTrading] = useState(false);

  // 샘플 암호화폐 데이터
  const cryptos = [
    { symbol: 'BTCUSDT', name: 'Bitcoin', price: 43250, change: 2.98 },
    { symbol: 'ETHUSDT', name: 'Ethereum', price: 2580, change: -1.72 },
    { symbol: 'BNBUSDT', name: 'Binance Coin', price: 315, change: 4.05 },
  ];

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!user) {
      showLoginModal();
      return;
    }

    setIsTrading(true);
    // 거래 시뮬레이션
    setTimeout(() => {
      alert(`${type === 'buy' ? '매수' : '매도'} 주문이 완료되었습니다!`);
      setIsTrading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">암호화폐 거래</h1>
        <p className="text-gray-300">실시간 암호화폐 가격으로 거래하세요</p>
      </div>

      {/* 암호화폐 리스트 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cryptos.map((crypto) => (
          <div key={crypto.symbol} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-white font-bold">{crypto.name}</h3>
                <p className="text-gray-400 text-sm">{crypto.symbol}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">${crypto.price.toLocaleString()}</p>
                <p className={`text-sm font-medium ${
                  crypto.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {crypto.change >= 0 ? '+' : ''}{crypto.change}%
                </p>
              </div>
            </div>
            
            {/* 거래 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => handleTrade('buy')}
                disabled={isTrading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
              >
                {isTrading ? '처리중...' : '매수'}
              </button>
              <button
                onClick={() => handleTrade('sell')}
                disabled={isTrading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
              >
                {isTrading ? '처리중...' : '매도'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 거래 설정 */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600">
        <h2 className="text-white font-bold text-xl mb-4">거래 설정</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-300 text-sm mb-2">거래 금액 (USDT)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              min="10"
              max="10000"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">계정 상태</label>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${user ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-white">
                {user ? '로그인됨' : '로그인 필요'}
              </span>
            </div>
          </div>
        </div>

        {!user && (
          <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <p className="text-yellow-200 text-sm">
              실제 거래를 위해서는 로그인이 필요합니다. 로그인 후 개인 Binance API 키를 설정해주세요.
            </p>
          </div>
        )}
      </div>

      {/* 간단한 차트 영역 */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600">
        <h2 className="text-white font-bold text-xl mb-4">시장 동향</h2>
        <div className="text-center py-8">
          <p className="text-gray-400">실시간 차트는 개발 중입니다</p>
          <p className="text-gray-500 text-sm mt-2">
            현재는 기본 가격 정보만 제공됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
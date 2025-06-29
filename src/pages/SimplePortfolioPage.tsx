import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SimplePortfolioPageProps {
  portfolio: any;
}

export function SimplePortfolioPage({ portfolio }: SimplePortfolioPageProps) {
  const { user, showLoginModal } = useAuth();

  // 샘플 포트폴리오 데이터
  const holdings = [
    { symbol: 'BTCUSDT', name: 'Bitcoin', amount: 0.1, value: 4325, change: 2.98 },
    { symbol: 'ETHUSDT', name: 'Ethereum', amount: 2.0, value: 5161, change: -1.72 },
    { symbol: 'BNBUSDT', name: 'Binance Coin', amount: 10.5, value: 3307, change: 4.05 },
  ];

  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
  const totalChange = holdings.reduce((sum, holding) => sum + (holding.value * holding.change / 100), 0);
  const totalChangePercent = (totalChange / totalValue) * 100;

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-white mb-4">내 포트폴리오</h1>
        <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-600">
          <p className="text-gray-300 mb-4">포트폴리오를 보려면 로그인이 필요합니다</p>
          <button
            onClick={showLoginModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">내 포트폴리오</h1>
        <p className="text-gray-300">보유 자산 현황을 확인하세요</p>
      </div>

      {/* 총 자산 요약 */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-300 mb-2">총 자산 가치</h2>
          <div className="text-4xl font-bold text-white mb-2">
            ${totalValue.toLocaleString()}
          </div>
          <div className={`text-lg font-medium ${
            totalChangePercent >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {totalChangePercent >= 0 ? '+' : ''}${totalChange.toFixed(2)} ({totalChangePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* 보유 자산 목록 */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600">
        <h2 className="text-white font-bold text-xl mb-4">보유 자산</h2>
        <div className="space-y-4">
          {holdings.map((holding) => (
            <div key={holding.symbol} className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h3 className="text-white font-semibold">{holding.name}</h3>
                <p className="text-gray-400 text-sm">{holding.amount} {holding.symbol.replace('USDT', '')}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">${holding.value.toLocaleString()}</p>
                <p className={`text-sm font-medium ${
                  holding.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {holding.change >= 0 ? '+' : ''}{holding.change}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 자산 배분 */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600">
        <h2 className="text-white font-bold text-xl mb-4">자산 배분</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {holdings.map((holding) => {
            const percentage = (holding.value / totalValue * 100).toFixed(1);
            return (
              <div key={holding.symbol} className="text-center p-4 bg-gray-700/50 rounded-lg">
                <h3 className="text-white font-semibold mb-2">{holding.name}</h3>
                <div className="text-2xl font-bold text-blue-400">{percentage}%</div>
                <p className="text-gray-400 text-sm">${holding.value.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 수익률 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600 text-center">
          <h3 className="text-gray-300 text-sm mb-1">총 투자금</h3>
          <p className="text-white font-bold text-lg">${(totalValue - totalChange).toLocaleString()}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600 text-center">
          <h3 className="text-gray-300 text-sm mb-1">총 수익</h3>
          <p className={`font-bold text-lg ${totalChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600 text-center">
          <h3 className="text-gray-300 text-sm mb-1">수익률</h3>
          <p className={`font-bold text-lg ${totalChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
}
import React from 'react';

interface PortfolioPageProps {
  portfolio: any;
}

export function PortfolioPage({ portfolio }: PortfolioPageProps) {
  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl p-6 border border-green-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">내 포트폴리오</h1>
            <p className="text-gray-300">보유 중인 암호화폐 자산과 투자 성과를 확인합니다.</p>
          </div>
          <div className="text-right">
            <div className="text-green-400 text-sm">총 자산 가치</div>
            <div className="text-white font-bold text-2xl">${portfolio.totalValue.toLocaleString()}</div>
            <div className={`text-sm font-semibold ${
              portfolio.totalChangePercent >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {portfolio.totalChangePercent >= 0 ? '+' : ''}{portfolio.totalChangePercent.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* 포트폴리오 상세 */}
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h3 className="text-green-400 font-semibold mb-3">보유 자산</h3>
            <div className="space-y-3">
              {portfolio.holdings.map((holding: any) => (
                <div key={holding.symbol} className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                  <div>
                    <div className="text-white font-semibold">{holding.symbol}</div>
                    <div className="text-gray-400 text-sm">{holding.amount} 코인</div>
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

          <div className="bg-gray-800/30 rounded-lg p-4">
            <h3 className="text-blue-400 font-semibold mb-3">투자 성과</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-3 bg-gray-700/30 rounded-lg">
                <span className="text-gray-400">총 투자금액:</span>
                <span className="text-white font-bold">${(portfolio.totalValue - portfolio.totalChange).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-700/30 rounded-lg">
                <span className="text-gray-400">현재 가치:</span>
                <span className="text-white font-bold">${portfolio.totalValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-700/30 rounded-lg">
                <span className="text-gray-400">총 손익:</span>
                <span className={`font-bold ${portfolio.totalChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolio.totalChange >= 0 ? '+' : ''}${portfolio.totalChange.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-700/30 rounded-lg">
                <span className="text-gray-400">수익률:</span>
                <span className={`font-bold ${portfolio.totalChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolio.totalChangePercent >= 0 ? '+' : ''}{portfolio.totalChangePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 자산 배분 차트 영역 */}
        <div className="mt-6 bg-gray-800/30 rounded-lg p-4">
          <h3 className="text-purple-400 font-semibold mb-3">자산 배분</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {portfolio.holdings.map((holding: any) => {
              const percentage = (holding.value / portfolio.totalValue * 100).toFixed(1);
              return (
                <div key={holding.symbol} className="text-center">
                  <div className="text-white font-semibold">{holding.symbol}</div>
                  <div className="text-2xl font-bold text-blue-400">{percentage}%</div>
                  <div className="text-gray-400 text-sm">${holding.value.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, PieChart, BarChart3, RefreshCw } from 'lucide-react';
import { PortfolioSummaryProps, Holding } from '../../types';

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ 
  portfolio, 
  className = '' 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [showDetails, setShowDetails] = useState(false);

  const isPositive = portfolio.totalChangePercent > 0;
  const isSignificantChange = Math.abs(portfolio.totalChangePercent) > 5;

  // 값 변화 시 애니메이션 트리거
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [portfolio.totalValue, portfolio.totalChange]);

  // 포맷팅 함수들
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercent = (percent: number): string => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // 모의 상세 데이터
  const detailedStats = {
    '24h': {
      high: portfolio.totalValue + 2500,
      low: portfolio.totalValue - 1800,
      trades: 23,
      fees: 12.50
    },
    '7d': {
      high: portfolio.totalValue + 8500,
      low: portfolio.totalValue - 5200,
      trades: 156,
      fees: 89.30
    },
    '30d': {
      high: portfolio.totalValue + 15000,
      low: portfolio.totalValue - 8900,
      trades: 678,
      fees: 324.80
    }
  };

  const currentStats = detailedStats[timeframe];

  return (
    <div className={`
      crypto-card rounded-xl p-6 relative overflow-hidden
      ${isPositive ? 'glow-green' : 'glow-red'}
      ${isAnimating ? (isPositive ? 'price-up' : 'price-down') : ''}
      ${className}
    `}>
      {/* 배경 그라디언트 */}
      <div className={`
        absolute inset-0 opacity-10 bg-gradient-to-br
        ${isPositive ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600'}
      `} />
      
      {/* 헤더 */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Wallet className="text-green-400" size={24} />
            </div>
            <div>
              <h2 className="text-white text-lg font-bold">
                🎁 Santa's Portfolio
              </h2>
              <p className="text-gray-400 text-sm">
                Christmas Trading Account
              </p>
            </div>
          </div>
          
          {/* 새로고침 버튼 */}
          <button 
            onClick={() => setIsAnimating(true)}
            className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors"
          >
            <RefreshCw size={16} className="text-gray-400" />
          </button>
        </div>

        {/* 총 가치 */}
        <div className="mb-6">
          <div className="text-gray-400 text-sm mb-2 flex items-center gap-2">
            <span>총 포트폴리오 가치</span>
            {isSignificantChange && (
              <span className={`
                px-2 py-1 rounded-full text-xs font-bold animate-pulse
                ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
              `}>
                {isPositive ? '🔥 HOT' : '❄️ COLD'}
              </span>
            )}
          </div>
          
          <div className="text-white text-4xl font-bold font-crypto mb-2">
            {formatCurrency(portfolio.totalValue)}
          </div>
          
          <div className={`
            flex items-center gap-2 text-lg font-semibold
            ${isPositive ? 'text-green-400' : 'text-red-400'}
          `}>
            <span className="text-2xl">
              {isPositive ? '🎄' : '❄️'}
            </span>
            <span>{formatCurrency(Math.abs(portfolio.totalChange))}</span>
            <span>({formatPercent(portfolio.totalChangePercent)})</span>
            <span className="text-base">
              {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </span>
          </div>
        </div>

        {/* 시간대 선택 */}
        <div className="flex gap-2 mb-4">
          {(['24h', '7d', '30d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`
                px-3 py-1 rounded-lg text-sm font-semibold transition-all
                ${timeframe === period 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}
              `}
            >
              {period}
            </button>
          ))}
        </div>

        {/* 상세 통계 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">최고값 ({timeframe})</div>
            <div className="text-green-400 font-bold">
              {formatCurrency(currentStats.high)}
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">최저값 ({timeframe})</div>
            <div className="text-red-400 font-bold">
              {formatCurrency(currentStats.low)}
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">거래 횟수</div>
            <div className="text-white font-bold">
              {currentStats.trades}건
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">수수료</div>
            <div className="text-yellow-400 font-bold">
              ${currentStats.fees}
            </div>
          </div>
        </div>

        {/* 보유 자산 요약 */}
        {portfolio.holdings && portfolio.holdings.length > 0 && (
          <div className="border-t border-gray-700/50 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <PieChart size={16} />
                주요 보유 자산
              </h3>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-green-400 text-sm hover:text-green-300 transition-colors"
              >
                {showDetails ? '접기' : '더보기'}
              </button>
            </div>
            
            <div className={`space-y-2 ${showDetails ? 'max-h-96' : 'max-h-32'} overflow-hidden transition-all duration-300`}>
              {portfolio.holdings.map((holding, index) => (
                <div key={holding.symbol} className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {index === 0 ? '🎄' : index === 1 ? '❄️' : index === 2 ? '⭐' : '🎁'}
                    </span>
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {holding.symbol}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {holding.amount.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-white font-semibold text-sm">
                      {formatCurrency(holding.value)}
                    </div>
                    <div className={`text-xs font-semibold ${
                      holding.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatPercent(holding.changePercent)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 빠른 액션 버튼들 */}
        <div className="grid grid-cols-3 gap-2 mt-6">
          <button className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1">
            <BarChart3 size={14} />
            분석
          </button>
          <button className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1">
            <TrendingUp size={14} />
            리밸런스
          </button>
          <button className="bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 text-yellow-400 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1">
            <Wallet size={14} />
            입출금
          </button>
        </div>

        {/* 성과 지표 */}
        <div className="mt-6 pt-4 border-t border-gray-700/50">
          <div className="text-gray-400 text-sm mb-2">🎯 크리스마스 목표 달성률</div>
          <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-1000 relative"
              style={{ width: `${Math.min((portfolio.totalValue / 120000) * 100, 100)}%` }}
            >
              <div className="absolute right-0 top-0 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>현재: {formatCurrency(portfolio.totalValue)}</span>
            <span>목표: $120,000</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummary;
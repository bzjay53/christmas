import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { CryptoCardProps } from '../../../types';

export const CryptoCard: React.FC<CryptoCardProps> = ({ 
  crypto, 
  onClick, 
  className = '' 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevPrice, setPrevPrice] = useState(crypto.price);

  const isPositive = crypto.changePercent > 0;
  const isNeutral = crypto.changePercent === 0;

  // 가격 변화 애니메이션
  useEffect(() => {
    if (crypto.price !== prevPrice) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      setPrevPrice(crypto.price);
      return () => clearTimeout(timer);
    }
  }, [crypto.price, prevPrice]);

  // 가격 포맷팅
  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    return price.toFixed(4);
  };

  // 퍼센트 포맷팅
  const formatPercent = (percent: number): string => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // 변화량 포맷팅
  const formatChange = (change: number): string => {
    return `${change >= 0 ? '+' : ''}$${Math.abs(change).toFixed(2)}`;
  };

  // 볼륨 포맷팅
  const formatVolume = (volume?: number): string => {
    if (!volume) return 'N/A';
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toFixed(0);
  };

  return (
    <div 
      className={`
        crypto-card rounded-xl p-6 cursor-pointer
        transform transition-all duration-300 hover:scale-105
        ${isPositive ? 'glow-green' : isNeutral ? 'glow-gold' : 'glow-red'}
        ${isAnimating ? (isPositive ? 'price-up' : 'price-down') : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl animate-float">
            {crypto.icon || '🪙'}
          </div>
          <div>
            <h3 className="text-white font-bold text-lg font-crypto">
              {crypto.name}
            </h3>
            <p className="text-gray-400 text-sm font-mono">
              {crypto.symbol}
            </p>
          </div>
        </div>
        
        {/* 상태 표시기 */}
        <div className={`
          flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold
          ${isPositive ? 'bg-green-500/20 text-green-400' : 
            isNeutral ? 'bg-yellow-500/20 text-yellow-400' : 
            'bg-red-500/20 text-red-400'}
        `}>
          {isPositive ? <TrendingUp size={12} /> : 
           isNeutral ? <Activity size={12} /> : 
           <TrendingDown size={12} />}
          LIVE
        </div>
      </div>

      {/* 가격 정보 */}
      <div className="space-y-3">
        {/* 현재 가격 */}
        <div className="text-white text-3xl font-bold font-crypto">
          ${formatPrice(crypto.price)}
        </div>

        {/* 변화량 */}
        <div className={`
          flex items-center gap-2 text-lg font-semibold
          ${isPositive ? 'text-green-400' : 
            isNeutral ? 'text-yellow-400' : 
            'text-red-400'}
        `}>
          <span className="text-xl">
            {isPositive ? '🎄' : isNeutral ? '⭐' : '❄️'}
          </span>
          <span>{formatPercent(crypto.changePercent)}</span>
          <span className="text-sm text-gray-400">
            ({formatChange(crypto.change)})
          </span>
        </div>

        {/* 24시간 고가/저가 */}
        {crypto.high24h && crypto.low24h && (
          <div className="flex justify-between text-sm text-gray-400">
            <div>
              <span className="text-green-400">↗ High:</span>
              <span className="ml-1">${formatPrice(crypto.high24h)}</span>
            </div>
            <div>
              <span className="text-red-400">↘ Low:</span>
              <span className="ml-1">${formatPrice(crypto.low24h)}</span>
            </div>
          </div>
        )}

        {/* 거래량 */}
        {crypto.volume && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
            <span className="text-gray-400 text-sm">24h Volume:</span>
            <span className="text-white font-semibold">
              {formatVolume(crypto.volume)}
            </span>
          </div>
        )}

        {/* 진행률 바 (변화율 기반) */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Change</span>
            <span>{Math.abs(crypto.changePercent).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`
                h-2 rounded-full transition-all duration-500
                ${isPositive ? 'bg-gradient-to-r from-green-500 to-green-400' : 
                  'bg-gradient-to-r from-red-500 to-red-400'}
              `}
              style={{ 
                width: `${Math.min(Math.abs(crypto.changePercent) * 10, 100)}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* 호버 효과 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
    </div>
  );
};

export default CryptoCard;
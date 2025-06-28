import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Bot, Settings, Star, Shield, Sword } from 'lucide-react';
import { TradingButtonsProps } from '../../types';

export const TradingButtons: React.FC<TradingButtonsProps> = ({ 
  symbol, 
  onBuy, 
  onSell, 
  disabled = false 
}) => {
  const [aiProfit, setAiProfit] = useState(127.50);
  const [aiPercent, setAiPercent] = useState(2.55);
  const [aiTime, setAiTime] = useState({ hours: 2, minutes: 30 });
  const [strategy, setStrategy] = useState<'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE'>('BALANCED');
  const [isAIActive, setIsAIActive] = useState(true);

  // AI 수익률 실시간 업데이트 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAIActive) {
        setAiProfit(prev => prev + (Math.random() - 0.4) * 2);
        setAiPercent(prev => prev + (Math.random() - 0.4) * 0.1);
        setAiTime(prev => ({
          hours: prev.hours,
          minutes: prev.minutes + 1 > 59 ? 0 : prev.minutes + 1
        }));
      }
    }, 30000); // 30초마다 업데이트

    return () => clearInterval(interval);
  }, [isAIActive]);

  const strategyConfig = {
    CONSERVATIVE: { icon: '🛡️', name: '루돌프', color: 'blue' },
    BALANCED: { icon: '⚖️', name: '산타', color: 'green' },
    AGGRESSIVE: { icon: '⚔️', name: '엘프', color: 'red' }
  };

  const currentStrategy = strategyConfig[strategy];

  const handleBuyClick = () => {
    if (!disabled) {
      // 크리스마스 사운드 효과 (선택사항)
      playChristmasSound('buy');
      onBuy();
    }
  };

  const handleSellClick = () => {
    if (!disabled) {
      playChristmasSound('sell');
      onSell();
    }
  };

  const playChristmasSound = (type: 'buy' | 'sell') => {
    // 실제 사운드 파일이 있다면 재생
    try {
      const audio = new Audio(`/sounds/christmas-${type}.mp3`);
      audio.volume = 0.3;
      audio.play().catch(() => {}); // 사운드 재생 실패 시 무시
    } catch (error) {
      // 사운드 파일이 없어도 에러 없이 진행
    }
  };

  const toggleAI = () => {
    setIsAIActive(!isAIActive);
    if (!isAIActive) {
      // AI 재시작 시 타이머 리셋
      setAiTime({ hours: 0, minutes: 0 });
    }
  };

  const cycleStrategy = () => {
    const strategies: ('CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE')[] = ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'];
    const currentIndex = strategies.indexOf(strategy);
    const nextIndex = (currentIndex + 1) % strategies.length;
    setStrategy(strategies[nextIndex]);
  };

  return (
    <div className="bg-green-900/30 backdrop-blur-sm rounded-xl p-6 border border-green-500/30 shadow-lg glow-green">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white text-xl font-bold flex items-center gap-2">
          🎁 Christmas Trading
        </h3>
        <div className="text-green-400 text-sm font-mono">
          {symbol}
        </div>
      </div>
      
      {/* 주문 버튼들 */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleBuyClick}
          disabled={disabled}
          className="trading-button flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
        >
          <TrendingUp size={20} />
          <span className="text-lg">🎄 BUY</span>
        </button>
        
        <button
          onClick={handleSellClick}
          disabled={disabled}
          className="trading-button flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
        >
          <TrendingDown size={20} />
          <span className="text-lg">❄️ SELL</span>
        </button>
      </div>
      
      {/* AI 자동 거래 섹션 */}
      <div className="border-t border-green-500/30 pt-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-green-400 text-lg font-semibold flex items-center gap-2">
            <Bot size={20} />
            🤖 Santa's AI Trading
          </h4>
          <button
            onClick={toggleAI}
            className={`
              px-3 py-1 rounded-full text-xs font-bold transition-all
              ${isAIActive 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}
            `}
          >
            {isAIActive ? 'ON' : 'OFF'}
          </button>
        </div>
        
        {isAIActive ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>🟢 Ho Ho Ho! ({aiTime.hours}시간 {aiTime.minutes}분)</span>
            </div>
            
            <div className="bg-green-500/10 rounded-lg p-3">
              <div className="text-green-400 text-lg font-bold">
                🎅 수익률: +${aiProfit.toFixed(2)} (+{aiPercent.toFixed(2)}%)
              </div>
              <div className="text-green-300 text-sm mt-1">
                오늘의 선물: +$45.20 (12건 거래)
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-sm py-2">
            AI 자동 거래가 비활성화되어 있습니다
          </div>
        )}
      </div>
      
      {/* 전략 선택 */}
      <div className="border-t border-green-500/30 pt-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white text-sm font-semibold">🎯 전략 선택:</h4>
          <button
            onClick={cycleStrategy}
            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
          >
            변경
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentStrategy.icon}</span>
          <span className={`
            text-sm font-semibold
            ${currentStrategy.color === 'blue' ? 'text-blue-400' :
              currentStrategy.color === 'green' ? 'text-green-400' :
              'text-red-400'}
          `}>
            {currentStrategy.name} 전략
          </span>
        </div>
        
        <div className="mt-2 text-xs text-gray-400">
          {strategy === 'CONSERVATIVE' && '안전한 수익 추구 | 낮은 위험'}
          {strategy === 'BALANCED' && '균형잡힌 포트폴리오 | 중간 위험'}
          {strategy === 'AGGRESSIVE' && '높은 수익 추구 | 높은 위험'}
        </div>
      </div>
      
      {/* 빠른 설정 */}
      <div className="border-t border-green-500/30 pt-6 mb-6">
        <h4 className="text-gray-400 text-sm font-semibold mb-3 flex items-center gap-2">
          <Settings size={16} />
          빠른 설정
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded transition-colors text-gray-300">
            $100 주문
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded transition-colors text-gray-300">
            $500 주문
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded transition-colors text-gray-300">
            스탑로스 5%
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded transition-colors text-gray-300">
            익절 10%
          </button>
        </div>
      </div>
      
      {/* 프리미엄 기능 */}
      <div className="border-t border-green-500/30 pt-6">
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Star className="text-yellow-400" size={20} />
            <h4 className="text-yellow-400 text-sm font-semibold">
              ⭐ Christmas Premium
            </h4>
          </div>
          <div className="text-gray-300 text-sm mb-3">
            월 $9.99 | 🎄 특별 혜택
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>• 🚀 고급 AI 분석</div>
            <div>• 📊 실시간 시장 신호</div>
            <div>• 🔔 프리미엄 알림</div>
            <div>• 🎁 크리스마스 보너스</div>
          </div>
          <button className="w-full mt-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold py-2 px-4 rounded-lg transition-all text-sm">
            업그레이드 🎅
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradingButtons;
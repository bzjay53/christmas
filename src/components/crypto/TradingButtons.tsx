import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Bot, Settings, Star } from 'lucide-react';
import type { TradingButtonsProps } from '../../types/crypto';

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
    CONSERVATIVE: { name: 'Conservative', color: 'blue' },
    BALANCED: { name: 'Balanced', color: 'green' },
    AGGRESSIVE: { name: 'Aggressive', color: 'red' }
  };

  const currentStrategy = strategyConfig[strategy];

  const handleBuyClick = () => {
    if (!disabled) {
      onBuy();
    }
  };

  const handleSellClick = () => {
    if (!disabled) {
      onSell();
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
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white text-xl font-bold">
          빠른 트레이딩
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
          <span className="text-lg">BUY</span>
        </button>
        
        <button
          onClick={handleSellClick}
          disabled={disabled}
          className="trading-button flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
        >
          <TrendingDown size={20} />
          <span className="text-lg">SELL</span>
        </button>
      </div>
      
      {/* AI 자동 거래 섹션 */}
      <div className="border-t border-gray-700/50 pt-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-green-400 text-lg font-semibold flex items-center gap-2">
            <Bot size={20} />
            AI 자동 거래
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
              <span>Active ({aiTime.hours}h {aiTime.minutes}m)</span>
            </div>
            
            <div className="bg-green-500/10 rounded-lg p-3">
              <div className="text-green-400 text-lg font-bold">
                Profit: +${aiProfit.toFixed(2)} (+{aiPercent.toFixed(2)}%)
              </div>
              <div className="text-green-300 text-sm mt-1">
                Today's trades: +$45.20 (12 orders)
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-sm py-2">
            AI auto-trading is disabled
          </div>
        )}
      </div>
      
      {/* 전략 선택 */}
      <div className="border-t border-gray-700/50 pt-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white text-sm font-semibold">Strategy:</h4>
          <button
            onClick={cycleStrategy}
            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
          >
            Change
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            currentStrategy.color === 'blue' ? 'bg-blue-400' :
            currentStrategy.color === 'green' ? 'bg-green-400' :
            'bg-red-400'
          }`}></div>
          <span className={`
            text-sm font-semibold
            ${currentStrategy.color === 'blue' ? 'text-blue-400' :
              currentStrategy.color === 'green' ? 'text-green-400' :
              'text-red-400'}
          `}>
            {currentStrategy.name} Strategy
          </span>
        </div>
        
        <div className="mt-2 text-xs text-gray-400">
          {strategy === 'CONSERVATIVE' && 'Safe profit pursuit | Low risk'}
          {strategy === 'BALANCED' && 'Balanced portfolio | Medium risk'}
          {strategy === 'AGGRESSIVE' && 'High profit pursuit | High risk'}
        </div>
      </div>
      
      {/* 빠른 설정 */}
      <div className="border-t border-gray-700/50 pt-6 mb-6">
        <h4 className="text-gray-400 text-sm font-semibold mb-3 flex items-center gap-2">
          <Settings size={16} />
          Quick Settings
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded transition-colors text-gray-300">
            $100 Order
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded transition-colors text-gray-300">
            $500 Order
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded transition-colors text-gray-300">
            Stop Loss 5%
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded transition-colors text-gray-300">
            Take Profit 10%
          </button>
        </div>
      </div>
      
      {/* 프리미엄 기능 */}
      <div className="border-t border-gray-700/50 pt-6">
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Star className="text-yellow-400" size={20} />
            <h4 className="text-yellow-400 text-sm font-semibold">
              Premium Features
            </h4>
          </div>
          <div className="text-gray-300 text-sm mb-3">
            $9.99/month | Special Benefits
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>• Advanced AI Analysis</div>
            <div>• Real-time Market Signals</div>
            <div>• Premium Notifications</div>
            <div>• Extended Portfolio Tools</div>
          </div>
          <button className="w-full mt-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold py-2 px-4 rounded-lg transition-all text-sm">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradingButtons;
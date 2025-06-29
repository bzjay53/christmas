import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, Target, Shield, TrendingUp, Zap, Calendar, BarChart3, Settings } from 'lucide-react';

// 매매 전략 타입 정의
export interface TradingStrategy {
  id: string;
  name: string;
  type: 'scalping' | 'short_term' | 'medium_term' | 'long_term';
  risk_level: 'aggressive' | 'neutral' | 'defensive';
  description: string;
  timeframe: string;
  profit_target: number;
  stop_loss: number;
  success_rate: number;
  avg_profit: number;
  min_tier: 'free' | 'basic' | 'premium' | 'vip';
}

interface TradingStrategiesProps {
  selectedSymbol: string;
  onStrategySelect: (strategy: TradingStrategy) => void;
}

export function TradingStrategies({ selectedSymbol, onStrategySelect }: TradingStrategiesProps) {
  const { profile, hasPermission } = useAuth();
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'scalping' | 'short_term' | 'medium_term' | 'long_term'>('all');

  // 매매 전략 데이터
  const strategies: TradingStrategy[] = [
    {
      id: 'scalping_aggressive',
      name: '초단타 스캘핑',
      type: 'scalping',
      risk_level: 'aggressive',
      description: '1-5분 차트를 이용한 초단타 매매. 높은 수익률과 높은 리스크',
      timeframe: '1-5분',
      profit_target: 0.5,
      stop_loss: 0.3,
      success_rate: 68,
      avg_profit: 0.8,
      min_tier: 'basic'
    },
    {
      id: 'scalping_neutral',
      name: '안전 스캘핑',
      type: 'scalping',
      risk_level: 'neutral',
      description: '보수적인 스캘핑 전략. 안정적인 수익 추구',
      timeframe: '5-15분',
      profit_target: 0.3,
      stop_loss: 0.2,
      success_rate: 75,
      avg_profit: 0.4,
      min_tier: 'basic'
    },
    {
      id: 'short_aggressive',
      name: '공격적 단기매매',
      type: 'short_term',
      risk_level: 'aggressive',
      description: '4시간 이내 매매완료. 기술적 분석 기반 공격적 전략',
      timeframe: '1-4시간',
      profit_target: 2.0,
      stop_loss: 1.5,
      success_rate: 62,
      avg_profit: 2.8,
      min_tier: 'basic'
    },
    {
      id: 'short_neutral',
      name: '균형 단기매매',
      type: 'short_term',
      risk_level: 'neutral',
      description: '리스크와 수익의 균형을 맞춘 단기 매매 전략',
      timeframe: '2-6시간',
      profit_target: 1.5,
      stop_loss: 1.0,
      success_rate: 71,
      avg_profit: 1.8,
      min_tier: 'basic'
    },
    {
      id: 'medium_defensive',
      name: '안전 중기투자',
      type: 'medium_term',
      risk_level: 'defensive',
      description: '1주일 내 매매완료. 펀더멘털 분석 중심의 안전한 전략',
      timeframe: '1-7일',
      profit_target: 5.0,
      stop_loss: 3.0,
      success_rate: 78,
      avg_profit: 6.5,
      min_tier: 'premium'
    },
    {
      id: 'medium_aggressive',
      name: '공격적 중기투자',
      type: 'medium_term',
      risk_level: 'aggressive',
      description: '높은 수익률을 목표로 하는 공격적 중기 투자 전략',
      timeframe: '3-14일',
      profit_target: 8.0,
      stop_loss: 5.0,
      success_rate: 65,
      avg_profit: 11.2,
      min_tier: 'premium'
    },
    {
      id: 'long_defensive',
      name: '장기 가치투자',
      type: 'long_term',
      risk_level: 'defensive',
      description: '한 달 이상 보유. 프로젝트 가치 분석 기반 장기 투자',
      timeframe: '1개월+',
      profit_target: 15.0,
      stop_loss: 10.0,
      success_rate: 82,
      avg_profit: 24.5,
      min_tier: 'vip'
    },
    {
      id: 'long_growth',
      name: '성장주 장기투자',
      type: 'long_term',
      risk_level: 'neutral',
      description: '성장 가능성이 높은 코인 중심의 장기 투자 전략',
      timeframe: '2-6개월',
      profit_target: 25.0,
      stop_loss: 15.0,
      success_rate: 75,
      avg_profit: 35.8,
      min_tier: 'vip'
    }
  ];

  // 필터링된 전략들
  const filteredStrategies = strategies.filter(strategy => 
    activeFilter === 'all' || strategy.type === activeFilter
  );

  // 전략 타입별 아이콘
  const getStrategyIcon = (type: string) => {
    switch (type) {
      case 'scalping': return <Zap className="text-yellow-400" size={20} />;
      case 'short_term': return <Clock className="text-blue-400" size={20} />;
      case 'medium_term': return <Calendar className="text-green-400" size={20} />;
      case 'long_term': return <BarChart3 className="text-purple-400" size={20} />;
      default: return <Target className="text-gray-400" size={20} />;
    }
  };

  // 리스크 레벨별 색상
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'aggressive': return 'text-red-400 bg-red-500/20';
      case 'neutral': return 'text-yellow-400 bg-yellow-500/20';
      case 'defensive': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  // 전략 타입별 이름
  const getStrategyTypeName = (type: string) => {
    const names = {
      scalping: '초단타',
      short_term: '단기',
      medium_term: '중기',
      long_term: '장기'
    };
    return names[type as keyof typeof names] || type;
  };

  // 리스크 레벨별 이름
  const getRiskLevelName = (risk: string) => {
    const names = {
      aggressive: '공격형',
      neutral: '중립형',
      defensive: '방어형'
    };
    return names[risk as keyof typeof names] || risk;
  };

  // 구독 티어 확인
  const canUseStrategy = (strategy: TradingStrategy) => {
    if (!profile) return false;
    
    const tierLevels = { free: 0, basic: 1, premium: 2, vip: 3 };
    const userLevel = tierLevels[profile.subscription_tier];
    const requiredLevel = tierLevels[strategy.min_tier];
    
    return userLevel >= requiredLevel;
  };

  const handleStrategySelect = (strategy: TradingStrategy) => {
    if (!canUseStrategy(strategy)) {
      return;
    }
    
    setSelectedStrategy(strategy);
    onStrategySelect(strategy);
  };

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Target className="text-blue-400" size={24} />
          <h2 className="text-white font-bold text-xl">매매 전략</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>선택된 코인:</span>
          <span className="text-white font-medium">{selectedSymbol}</span>
        </div>
      </div>

      {/* 필터 버튼들 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: '전체', icon: Target },
          { key: 'scalping', label: '초단타', icon: Zap },
          { key: 'short_term', label: '단기', icon: Clock },
          { key: 'medium_term', label: '중기', icon: Calendar },
          { key: 'long_term', label: '장기', icon: BarChart3 }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeFilter === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* 전략 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStrategies.map((strategy) => {
          const canUse = canUseStrategy(strategy);
          const isSelected = selectedStrategy?.id === strategy.id;
          
          return (
            <div
              key={strategy.id}
              onClick={() => handleStrategySelect(strategy)}
              className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10'
                  : canUse
                  ? 'border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50'
                  : 'border-gray-800 bg-gray-800/20 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* 전략 헤더 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStrategyIcon(strategy.type)}
                  <div>
                    <h3 className="text-white font-semibold">{strategy.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-400 text-xs">
                        {getStrategyTypeName(strategy.type)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(strategy.risk_level)}`}>
                        {getRiskLevelName(strategy.risk_level)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {!canUse && (
                  <div className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded">
                    {strategy.min_tier.toUpperCase()}+
                  </div>
                )}
              </div>

              {/* 전략 설명 */}
              <p className="text-gray-300 text-sm mb-4">{strategy.description}</p>

              {/* 전략 지표들 */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  <span className="text-gray-400">기간:</span>
                  <span className="text-white font-medium">{strategy.timeframe}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-green-400" />
                  <span className="text-gray-400">목표:</span>
                  <span className="text-green-400 font-medium">+{strategy.profit_target}%</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-red-400" />
                  <span className="text-gray-400">손절:</span>
                  <span className="text-red-400 font-medium">-{strategy.stop_loss}%</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-blue-400" />
                  <span className="text-gray-400">성공률:</span>
                  <span className="text-blue-400 font-medium">{strategy.success_rate}%</span>
                </div>
              </div>

              {/* 평균 수익률 */}
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">평균 수익률</span>
                  <span className="text-green-400 font-bold">+{strategy.avg_profit}%</span>
                </div>
              </div>

              {/* 선택된 전략 표시 */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 구독 업그레이드 안내 */}
      {profile?.subscription_tier === 'free' && (
        <div className="mt-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
          <div className="flex items-center gap-3">
            <Settings className="text-yellow-400" size={20} />
            <div>
              <h4 className="text-yellow-400 font-semibold">더 많은 매매 전략 이용하기</h4>
              <p className="text-gray-300 text-sm">
                Basic 플랜 이상에서 전문적인 매매 전략을 이용하실 수 있습니다.
              </p>
            </div>
          </div>
          <button className="mt-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-4 py-2 rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-all">
            플랜 업그레이드
          </button>
        </div>
      )}

      {/* 선택된 전략 상세 정보 */}
      {selectedStrategy && (
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-blue-400 font-semibold mb-2">선택된 전략: {selectedStrategy.name}</h4>
          <p className="text-gray-300 text-sm mb-3">{selectedStrategy.description}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">이 전략으로 {selectedSymbol} 매매를 시작합니다.</span>
            <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500 transition-colors">
              전략 적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TradingStrategies;
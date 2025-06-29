import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { aiTradingService, type AITradingStrategy, type TradingSignal, type AIAnalysis } from '../../services/aiTradingService';
import { Bot, TrendingUp, TrendingDown, Minus, AlertCircle, Settings, Play, Pause, Target, Shield } from 'lucide-react';

interface AITradingDashboardProps {
  selectedSymbol: string;
}

export function AITradingDashboard({ selectedSymbol }: AITradingDashboardProps) {
  const { user, profile, hasPermission } = useAuth();
  const [strategies, setStrategies] = useState<AITradingStrategy[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'strategies' | 'signals'>('dashboard');

  // AI 기능 접근 권한 확인
  const hasAIAccess = hasPermission('basicAI') || hasPermission('advancedAI') || hasPermission('autoTrading');

  useEffect(() => {
    if (user && hasAIAccess) {
      loadUserData();
    }
  }, [user, hasAIAccess]);

  const loadUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [userStrategies, activeSignals] = await Promise.all([
        aiTradingService.getUserStrategies(user.id),
        aiTradingService.getActiveSignals(selectedSymbol)
      ]);
      
      setStrategies(userStrategies);
      setSignals(activeSignals);
    } catch (error) {
      console.error('AI 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 구독 티어에 따른 AI 기능 제한 안내
  const renderAccessLimitation = () => {
    if (!profile) return null;

    const tierFeatures = {
      free: '기본 AI 분석은 Basic 플랜 이상에서 이용 가능합니다.',
      basic: 'AI 매매 신호 및 기본 자동화 기능을 이용할 수 있습니다.',
      premium: '고급 AI 전략 및 완전 자동 매매가 가능합니다.',
      vip: '모든 AI 기능과 개인 맞춤 AI 전략을 이용할 수 있습니다.'
    };

    if (!hasAIAccess) {
      return (
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-500/30">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-yellow-400" size={24} />
            <h3 className="text-yellow-400 font-bold text-lg">AI 기능 업그레이드 필요</h3>
          </div>
          <p className="text-gray-300 mb-4">
            {tierFeatures[profile.subscription_tier]}
          </p>
          <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-6 py-3 rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-all">
            플랜 업그레이드
          </button>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-4 border border-green-500/30">
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <Bot size={16} />
          <span>{tierFeatures[profile.subscription_tier]}</span>
        </div>
      </div>
    );
  };

  // AI 분석 대시보드
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* 접근 권한 안내 */}
      {renderAccessLimitation()}
      
      {hasAIAccess && (
        <>
          {/* AI 분석 현황 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">활성 전략</span>
                <Bot className="text-blue-400" size={16} />
              </div>
              <div className="text-white text-2xl font-bold">{strategies.length}</div>
              <div className="text-green-400 text-xs">+2 신규 추가</div>
            </div>
            
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">활성 신호</span>
                <Target className="text-green-400" size={16} />
              </div>
              <div className="text-white text-2xl font-bold">{signals.length}</div>
              <div className="text-yellow-400 text-xs">실시간 분석중</div>
            </div>
            
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">AI 신뢰도</span>
                <Shield className="text-purple-400" size={16} />
              </div>
              <div className="text-white text-2xl font-bold">87%</div>
              <div className="text-green-400 text-xs">+5% 개선</div>
            </div>
          </div>

          {/* 실시간 AI 신호 */}
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-400" size={20} />
              실시간 AI 신호 ({selectedSymbol})
            </h3>
            
            {signals.length > 0 ? (
              <div className="space-y-3">
                {signals.slice(0, 3).map((signal) => (
                  <div key={signal.id} className="bg-gray-800/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {signal.signal_type === 'buy' ? (
                          <TrendingUp className="text-green-400" size={16} />
                        ) : signal.signal_type === 'sell' ? (
                          <TrendingDown className="text-red-400" size={16} />
                        ) : (
                          <Minus className="text-gray-400" size={16} />
                        )}
                        <span className={`font-semibold text-sm ${
                          signal.signal_type === 'buy' ? 'text-green-400' : 
                          signal.signal_type === 'sell' ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {signal.signal_type.toUpperCase()}
                        </span>
                        <span className="text-gray-400 text-xs">
                          신뢰도: {Math.round(signal.confidence_score * 100)}%
                        </span>
                      </div>
                      <span className="text-white text-sm font-mono">
                        ${signal.price_target?.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-gray-300 text-xs">{signal.analysis_summary}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bot className="mx-auto text-gray-600 mb-3" size={48} />
                <p className="text-gray-400">현재 {selectedSymbol}에 대한 활성 신호가 없습니다.</p>
                <p className="text-gray-500 text-sm">AI가 시장을 분석하고 있습니다...</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  // 전략 관리 탭
  const renderStrategies = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-bold text-lg">AI 매매 전략</h3>
        <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all flex items-center gap-2">
          <Bot size={16} />
          새 전략 생성
        </button>
      </div>
      
      {strategies.length > 0 ? (
        <div className="grid gap-4">
          {strategies.map((strategy) => (
            <div key={strategy.id} className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-white font-semibold">{strategy.strategy_name}</h4>
                  <p className="text-gray-400 text-sm">{strategy.symbol}</p>
                </div>
                <div className="flex items-center gap-2">
                  {strategy.is_active ? (
                    <div className="flex items-center gap-1 text-green-400 text-xs">
                      <Play size={12} />
                      활성
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <Pause size={12} />
                      비활성
                    </div>
                  )}
                  <button className="text-gray-400 hover:text-white">
                    <Settings size={16} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">전략 유형</span>
                  <p className="text-white font-medium">{strategy.strategy_type}</p>
                </div>
                <div>
                  <span className="text-gray-400">리스크</span>
                  <p className="text-white font-medium">{strategy.risk_level}</p>
                </div>
                <div>
                  <span className="text-gray-400">손절라인</span>
                  <p className="text-white font-medium">{strategy.stop_loss_percent}%</p>
                </div>
                <div>
                  <span className="text-gray-400">익절라인</span>
                  <p className="text-white font-medium">{strategy.take_profit_percent}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Bot className="mx-auto text-gray-600 mb-4" size={64} />
          <h4 className="text-gray-400 text-lg mb-2">AI 매매 전략이 없습니다</h4>
          <p className="text-gray-500 text-sm mb-6">
            AI가 시장을 분석하여 자동으로 매매할 전략을 생성해보세요.
          </p>
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all">
            첫 번째 전략 생성하기
          </button>
        </div>
      )}
    </div>
  );

  // 신호 히스토리 탭
  const renderSignals = () => (
    <div className="space-y-6">
      <h3 className="text-white font-bold text-lg">AI 매매 신호 히스토리</h3>
      
      {signals.length > 0 ? (
        <div className="space-y-3">
          {signals.map((signal) => (
            <div key={signal.id} className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    signal.signal_type === 'buy' ? 'bg-green-400' : 
                    signal.signal_type === 'sell' ? 'bg-red-400' : 'bg-gray-400'
                  }`}></div>
                  <div>
                    <span className="text-white font-medium">{signal.symbol}</span>
                    <span className={`ml-2 text-sm ${
                      signal.signal_type === 'buy' ? 'text-green-400' : 
                      signal.signal_type === 'sell' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {signal.signal_type.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">${signal.price_target?.toFixed(2)}</div>
                  <div className="text-gray-400 text-xs">
                    {Math.round(signal.confidence_score * 100)}% 신뢰도
                  </div>
                </div>
              </div>
              <p className="text-gray-300 text-sm mt-2">{signal.analysis_summary}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Target className="mx-auto text-gray-600 mb-4" size={64} />
          <h4 className="text-gray-400 text-lg mb-2">매매 신호 히스토리가 없습니다</h4>
          <p className="text-gray-500 text-sm">
            AI가 분석한 매매 신호들이 여기에 표시됩니다.
          </p>
        </div>
      )}
    </div>
  );

  if (!hasAIAccess && profile?.subscription_tier === 'free') {
    return (
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        {renderAccessLimitation()}
      </div>
    );
  }

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Bot className="text-blue-400" size={24} />
        <h2 className="text-white font-bold text-xl">AI 자동 매매</h2>
        {loading && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
        )}
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex space-x-1 mb-6 bg-gray-800/50 rounded-lg p-1">
        {[
          { id: 'dashboard', label: '대시보드', icon: TrendingUp },
          { id: 'strategies', label: '전략', icon: Settings },
          { id: 'signals', label: '신호', icon: Target }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
              activeTab === id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'strategies' && renderStrategies()}
      {activeTab === 'signals' && renderSignals()}
    </div>
  );
}

export default AITradingDashboard;
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, AlertTriangle, TrendingDown, DollarSign, Percent, Target, Settings, Activity } from 'lucide-react';

// 리스크 프로필 타입 정의
export interface RiskProfile {
  id: string;
  name: string;
  type: 'aggressive' | 'neutral' | 'defensive';
  description: string;
  max_position_size: number; // 포트폴리오 대비 최대 포지션 크기 (%)
  max_daily_loss: number; // 일일 최대 손실 한도 (%)
  stop_loss_default: number; // 기본 손절라인 (%)
  take_profit_default: number; // 기본 익절라인 (%)
  max_open_positions: number; // 최대 동시 포지션 수
  risk_reward_ratio: number; // 리스크 대비 수익 비율
  volatility_threshold: number; // 변동성 임계값 (%)
  correlation_limit: number; // 연관성 제한 (동일 섹터 최대 비중 %)
}

interface RiskManagementProps {
  selectedSymbol: string;
  currentPortfolioValue: number;
}

export function RiskManagement({ selectedSymbol, currentPortfolioValue }: RiskManagementProps) {
  const { profile, hasPermission } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<RiskProfile | null>(null);
  const [customSettings, setCustomSettings] = useState({
    stopLoss: 5,
    takeProfit: 10,
    positionSize: 10,
    maxDailyLoss: 5
  });
  const [riskMetrics, setRiskMetrics] = useState({
    currentRisk: 0,
    dailyPnL: 0,
    openPositions: 0,
    portfolioVaR: 0 // Value at Risk
  });

  // 리스크 프로필 데이터
  const riskProfiles: RiskProfile[] = [
    {
      id: 'defensive',
      name: '방어형 (안전우선)',
      type: 'defensive',
      description: '자본 보존을 최우선으로 하는 보수적 접근. 낮은 리스크, 안정적 수익 추구',
      max_position_size: 5,
      max_daily_loss: 2,
      stop_loss_default: 3,
      take_profit_default: 6,
      max_open_positions: 3,
      risk_reward_ratio: 1.5,
      volatility_threshold: 15,
      correlation_limit: 30
    },
    {
      id: 'neutral',
      name: '중립형 (균형추구)',
      type: 'neutral',
      description: '리스크와 수익의 균형을 추구. 적당한 리스크로 꾸준한 수익 창출',
      max_position_size: 10,
      max_daily_loss: 5,
      stop_loss_default: 5,
      take_profit_default: 10,
      max_open_positions: 5,
      risk_reward_ratio: 2.0,
      volatility_threshold: 25,
      correlation_limit: 40
    },
    {
      id: 'aggressive',
      name: '공격형 (수익추구)',
      type: 'aggressive',
      description: '높은 수익률을 위해 큰 리스크 감수. 활발한 매매로 수익 극대화',
      max_position_size: 20,
      max_daily_loss: 10,
      stop_loss_default: 8,
      take_profit_default: 15,
      max_open_positions: 8,
      risk_reward_ratio: 2.5,
      volatility_threshold: 40,
      correlation_limit: 60
    }
  ];

  // 모의 리스크 메트릭 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setRiskMetrics({
        currentRisk: Math.random() * 100,
        dailyPnL: (Math.random() - 0.5) * 1000,
        openPositions: Math.floor(Math.random() * 5),
        portfolioVaR: Math.random() * 5000
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 리스크 프로필별 색상
  const getRiskColor = (type: string) => {
    switch (type) {
      case 'aggressive': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'neutral': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'defensive': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  // 리스크 레벨 아이콘
  const getRiskIcon = (type: string) => {
    switch (type) {
      case 'aggressive': return <AlertTriangle className="text-red-400" size={20} />;
      case 'neutral': return <Target className="text-yellow-400" size={20} />;
      case 'defensive': return <Shield className="text-green-400" size={20} />;
      default: return <Settings className="text-gray-400" size={20} />;
    }
  };

  // 포지션 크기 계산
  const calculatePositionSize = (percentage: number) => {
    return (currentPortfolioValue * percentage) / 100;
  };

  // 리스크 프로필 선택
  const handleProfileSelect = (profile: RiskProfile) => {
    setSelectedProfile(profile);
    setCustomSettings({
      stopLoss: profile.stop_loss_default,
      takeProfit: profile.take_profit_default,
      positionSize: profile.max_position_size,
      maxDailyLoss: profile.max_daily_loss
    });
  };

  // 접근 권한 확인
  const hasRiskManagement = hasPermission('basicAI') || profile?.subscription_tier !== 'free';

  if (!hasRiskManagement) {
    return (
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="text-center">
          <Shield className="mx-auto text-gray-600 mb-4" size={48} />
          <h3 className="text-gray-400 text-lg mb-2">리스크 관리 도구</h3>
          <p className="text-gray-500 text-sm mb-4">
            Basic 플랜 이상에서 전문적인 리스크 관리 도구를 이용하실 수 있습니다.
          </p>
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all">
            플랜 업그레이드
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="text-blue-400" size={24} />
          <h2 className="text-white font-bold text-xl">리스크 관리</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>포트폴리오:</span>
          <span className="text-white font-medium">${currentPortfolioValue.toLocaleString()}</span>
        </div>
      </div>

      {/* 현재 리스크 메트릭 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-xs">현재 리스크</span>
            <Activity className="text-blue-400" size={14} />
          </div>
          <div className="text-white font-bold">{riskMetrics.currentRisk.toFixed(1)}%</div>
        </div>
        
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-xs">일일 손익</span>
            <DollarSign className={riskMetrics.dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'} size={14} />
          </div>
          <div className={`font-bold ${riskMetrics.dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {riskMetrics.dailyPnL >= 0 ? '+' : ''}${riskMetrics.dailyPnL.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-xs">열린 포지션</span>
            <Target className="text-yellow-400" size={14} />
          </div>
          <div className="text-white font-bold">{riskMetrics.openPositions}</div>
        </div>
        
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-xs">VaR (95%)</span>
            <TrendingDown className="text-red-400" size={14} />
          </div>
          <div className="text-red-400 font-bold">${riskMetrics.portfolioVaR.toFixed(0)}</div>
        </div>
      </div>

      {/* 리스크 프로필 선택 */}
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-4">리스크 프로필 선택</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {riskProfiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => handleProfileSelect(profile)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedProfile?.id === profile.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : `border-gray-700 bg-gray-800/30 hover:border-gray-600 ${getRiskColor(profile.type).split(' ')[2]}/5`
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {getRiskIcon(profile.type)}
                <div>
                  <h4 className="text-white font-semibold">{profile.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(profile.type)}`}>
                    {profile.type.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-3">{profile.description}</p>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">최대 포지션:</span>
                  <span className="text-white">{profile.max_position_size}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">일일 손실 한도:</span>
                  <span className="text-white">{profile.max_daily_loss}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">기본 손절:</span>
                  <span className="text-white">{profile.stop_loss_default}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 커스텀 설정 */}
      {selectedProfile && (
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-4">세부 설정 조정</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <Percent size={14} className="inline mr-1" />
                손절라인 (%)
              </label>
              <input
                type="number"
                value={customSettings.stopLoss}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, stopLoss: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                min="1"
                max="20"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <Target size={14} className="inline mr-1" />
                익절라인 (%)
              </label>
              <input
                type="number"
                value={customSettings.takeProfit}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, takeProfit: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                min="1"
                max="50"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <DollarSign size={14} className="inline mr-1" />
                포지션 크기 (%)
              </label>
              <input
                type="number"
                value={customSettings.positionSize}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, positionSize: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                min="1"
                max={selectedProfile.max_position_size}
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <AlertTriangle size={14} className="inline mr-1" />
                일일 손실 한도 (%)
              </label>
              <input
                type="number"
                value={customSettings.maxDailyLoss}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, maxDailyLoss: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                min="1"
                max={selectedProfile.max_daily_loss}
              />
            </div>
          </div>
        </div>
      )}

      {/* 계산된 리스크 지표 */}
      {selectedProfile && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-blue-400 font-semibold mb-3">계산된 리스크 지표</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400 block">포지션 크기</span>
              <span className="text-white font-bold">
                ${calculatePositionSize(customSettings.positionSize).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">최대 손실액</span>
              <span className="text-red-400 font-bold">
                ${(calculatePositionSize(customSettings.positionSize) * customSettings.stopLoss / 100).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">목표 수익액</span>
              <span className="text-green-400 font-bold">
                ${(calculatePositionSize(customSettings.positionSize) * customSettings.takeProfit / 100).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">리스크/수익 비율</span>
              <span className="text-white font-bold">
                1:{(customSettings.takeProfit / customSettings.stopLoss).toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <span className="text-gray-400">
              이 설정으로 {selectedSymbol} 매매 시 리스크가 적용됩니다.
            </span>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors">
              설정 저장
            </button>
          </div>
        </div>
      )}

      {/* 리스크 경고 */}
      {riskMetrics.currentRisk > 70 && (
        <div className="mt-4 bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-400" size={20} />
            <div>
              <h4 className="text-red-400 font-semibold">높은 리스크 경고</h4>
              <p className="text-gray-300 text-sm">
                현재 포트폴리오 리스크가 {riskMetrics.currentRisk.toFixed(1)}%로 높습니다. 
                포지션 축소를 고려해보세요.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RiskManagement;
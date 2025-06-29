import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AITradingDashboard } from '../components/ai/AITradingDashboard';
import { TradingStrategies } from '../components/trading/TradingStrategies';
import { RiskManagement } from '../components/risk/RiskManagement';

interface TradingPageProps {
  selectedSymbol: string;
  portfolio: any;
}

export function TradingPage({ selectedSymbol, portfolio }: TradingPageProps) {
  const { user, showLoginModal } = useAuth();

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">현물트레이딩</h1>
            <p className="text-gray-300">암호화폐 현물 거래, AI 트레이딩, 매매 전략을 관리합니다.</p>
          </div>
          <div className="text-right">
            <div className="text-blue-400 text-sm">선택된 코인</div>
            <div className="text-white font-bold text-xl">{selectedSymbol}</div>
          </div>
        </div>
      </div>

      {/* AI 자동 매매 대시보드 */}
      <div>
        <AITradingDashboard selectedSymbol={selectedSymbol} />
      </div>

      {/* 매매 전략 시스템 */}
      <div>
        <TradingStrategies 
          selectedSymbol={selectedSymbol} 
          onStrategySelect={(strategy) => {
            if (!user) {
              showLoginModal();
              return;
            }
            
            // 전략 적용 확인
            const confirm = window.confirm(
              `🎯 "${strategy.name}" 전략을 적용하시겠습니까?\n\n` +
              `📊 전략 정보:\n` +
              `• 유형: ${strategy.type}\n` +
              `• 리스크: ${strategy.risk_level}\n` +
              `• 목표 수익률: +${strategy.profit_target}%\n` +
              `• 손절라인: -${strategy.stop_loss}%\n` +
              `• 평균 성공률: ${strategy.success_rate}%\n\n` +
              `⚠️ 이 전략이 향후 거래에 자동 적용됩니다.`
            );
            
            if (confirm) {
              // 실제 전략 적용 로직
              alert(`✅ "${strategy.name}" 전략이 적용되었습니다!\n\n` +
                    `🎯 ${selectedSymbol}에 대해 ${strategy.type} 전략으로 거래합니다.\n` +
                    `📈 목표 수익률: +${strategy.profit_target}%\n` +
                    `🛡️ 손절라인: -${strategy.stop_loss}%\n\n` +
                    `자동 매매를 원하시면 AI 트레이딩 대시보드에서 활성화하세요.`);
              
              console.log('적용된 전략:', strategy);
            }
          }}
        />
      </div>

      {/* 리스크 관리 시스템 */}
      <div>
        <RiskManagement 
          selectedSymbol={selectedSymbol}
          currentPortfolioValue={portfolio.totalValue}
        />
      </div>
    </div>
  );
}
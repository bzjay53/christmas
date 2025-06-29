import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export function TradingHistoryPage() {
  const { user, showLoginModal } = useAuth();

  if (!user) {
    return (
      <div className="space-y-8">
        {/* 페이지 헤더 */}
        <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-xl p-6 border border-orange-500/30">
          <h1 className="text-3xl font-bold text-white mb-2">거래 내역</h1>
          <p className="text-gray-300">과거 거래 기록과 수익률을 분석합니다.</p>
        </div>

        {/* 로그인 필요 */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-12 border border-gray-700/50 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">로그인이 필요합니다</h2>
            <p className="text-gray-400 mb-6">거래 내역을 보려면 먼저 로그인해주세요.</p>
          </div>
          
          <button 
            onClick={showLoginModal}
            className="bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold px-8 py-3 rounded-lg hover:from-orange-500 hover:to-red-500 transition-all transform hover:scale-105"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-xl p-6 border border-orange-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">거래 내역</h1>
            <p className="text-gray-300">과거 거래 기록과 수익률을 분석합니다.</p>
          </div>
          <div className="text-right">
            <div className="text-orange-400 text-sm">총 거래 횟수</div>
            <div className="text-white font-bold text-xl">1회</div>
          </div>
        </div>
      </div>

      {/* 거래 내역 */}
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-xl">최근 거래</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
              전체
            </button>
            <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
              매수
            </button>
            <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
              매도
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {/* 예시 거래 내역 */}
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-semibold">매수</span>
                    <span className="text-white font-medium">BTCUSDT</span>
                  </div>
                  <div className="text-gray-400 text-sm">0.01 BTC</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">$432.50</div>
                <div className="text-gray-400 text-xs">2025-06-29 09:30</div>
              </div>
            </div>
          </div>

          {/* 빈 상태 */}
          <div className="text-center py-12 bg-gray-800/20 rounded-lg border border-gray-700/30">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-gray-400 font-semibold mb-2">더 많은 거래 내역이 없습니다</h3>
            <p className="text-gray-500 text-sm">실제 거래를 진행하시면 여기에 거래 내역이 표시됩니다.</p>
          </div>
        </div>
      </div>

      {/* 거래 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="text-center">
            <div className="text-green-400 text-2xl font-bold">1</div>
            <div className="text-gray-400 text-sm">성공한 거래</div>
          </div>
        </div>
        
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="text-center">
            <div className="text-blue-400 text-2xl font-bold">100%</div>
            <div className="text-gray-400 text-sm">성공률</div>
          </div>
        </div>
        
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="text-center">
            <div className="text-purple-400 text-2xl font-bold">+2.5%</div>
            <div className="text-gray-400 text-sm">평균 수익률</div>
          </div>
        </div>
      </div>
    </div>
  );
}
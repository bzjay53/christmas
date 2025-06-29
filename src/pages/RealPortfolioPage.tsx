import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createRealPortfolioService, type RealPortfolio } from '../lib/realPortfolioService';
import { RefreshCw, DollarSign, TrendingUp, TrendingDown, AlertCircle, Wallet } from 'lucide-react';

export function RealPortfolioPage() {
  const { user, showLoginModal } = useAuth();
  const [portfolio, setPortfolio] = useState<RealPortfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // 실제 포트폴리오 데이터 로드
  const loadPortfolio = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      console.log('실제 포트폴리오 데이터 로드 시작...');
      const portfolioService = createRealPortfolioService(user.id);
      const result = await portfolioService.getCompletePortfolio();

      if (result.error) {
        setError(result.error);
        setPortfolio(null);
      } else {
        setPortfolio(result.data!);
        setLastRefresh(new Date());
        console.log('포트폴리오 데이터 로드 완료:', result.data);
      }
    } catch (err) {
      console.error('포트폴리오 로드 실패:', err);
      setError('포트폴리오 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (user) {
      loadPortfolio();
    }
  }, [user]);

  // 새로고침 버튼 핸들러
  const handleRefresh = () => {
    loadPortfolio();
  };

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-white mb-4">내 포트폴리오</h1>
        <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-600">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-gray-300 mb-4">실제 포트폴리오를 보려면 로그인이 필요합니다</p>
          <button
            onClick={showLoginModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">실제 포트폴리오</h1>
          <p className="text-gray-300">바이낸스 계정의 실제 자산 현황</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* 마지막 업데이트 시간 */}
      {lastRefresh && (
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            마지막 업데이트: {lastRefresh.toLocaleString()}
          </p>
        </div>
      )}

      {/* 로딩 상태 */}
      {loading && (
        <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-600 text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">실제 바이낸스 계정 정보를 불러오는 중...</p>
        </div>
      )}

      {/* 오류 상태 */}
      {error && !loading && (
        <div className="bg-red-500/20 rounded-lg p-6 border border-red-500/50">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h3 className="text-red-400 font-semibold">연결 오류</h3>
          </div>
          <p className="text-red-200 mb-4">{error}</p>
          {error.includes('API 키') && (
            <div className="bg-red-400/20 rounded-lg p-4 border border-red-400/30">
              <p className="text-red-200 text-sm mb-2">해결 방법:</p>
              <ul className="text-red-200 text-sm space-y-1">
                <li>• 설정 페이지에서 바이낸스 API 키를 등록하세요</li>
                <li>• API 키에 SPOT 거래 권한이 있는지 확인하세요</li>
                <li>• API 키가 활성화되어 있는지 확인하세요</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 포트폴리오 데이터 */}
      {portfolio && !loading && (
        <>
          {/* 총 자산 요약 */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-300 mb-2">총 자산 가치</h2>
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="w-8 h-8 text-green-400" />
                <div className="text-4xl font-bold text-white">
                  ${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className={`text-lg font-medium ${
                portfolio.totalChangePercent >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {portfolio.totalChangePercent >= 0 ? (
                  <TrendingUp className="w-5 h-5 inline mr-1" />
                ) : (
                  <TrendingDown className="w-5 h-5 inline mr-1" />
                )}
                {portfolio.totalChangePercent >= 0 ? '+' : ''}${portfolio.totalChange.toFixed(2)} ({portfolio.totalChangePercent.toFixed(2)}%)
              </div>
            </div>

            {/* 계정 정보 */}
            {portfolio.accountInfo && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-600">
                <div className="text-center">
                  <p className="text-gray-400 text-sm">거래 권한</p>
                  <p className={`font-semibold ${portfolio.accountInfo.canTrade ? 'text-green-400' : 'text-red-400'}`}>
                    {portfolio.accountInfo.canTrade ? '활성' : '비활성'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Maker 수수료</p>
                  <p className="text-white font-semibold">{(portfolio.accountInfo.makerCommission / 100).toFixed(2)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Taker 수수료</p>
                  <p className="text-white font-semibold">{(portfolio.accountInfo.takerCommission / 100).toFixed(2)}%</p>
                </div>
              </div>
            )}
          </div>

          {/* 보유 자산 목록 */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-6 h-6 text-blue-400" />
              <h2 className="text-white font-bold text-xl">보유 자산</h2>
              <span className="text-gray-400 text-sm">({portfolio.balances.length}개 자산)</span>
            </div>
            
            {portfolio.balances.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">보유 중인 자산이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {portfolio.balances
                  .sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0))
                  .map((balance) => (
                  <div key={balance.asset} className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h3 className="text-white font-semibold">{balance.asset}</h3>
                      <p className="text-gray-400 text-sm">
                        보유: {balance.total.toFixed(8)} 
                        {balance.locked > 0 && (
                          <span className="text-yellow-400 ml-2">
                            (잠김: {balance.locked.toFixed(8)})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">
                        ${(balance.usdValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {((balance.usdValue || 0) / portfolio.totalValue * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 자산 분석 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600 text-center">
              <h3 className="text-gray-300 text-sm mb-1">총 자산 수</h3>
              <p className="text-white font-bold text-lg">{portfolio.balances.length}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600 text-center">
              <h3 className="text-gray-300 text-sm mb-1">가장 큰 자산</h3>
              <p className="text-white font-bold text-lg">
                {portfolio.balances.length > 0 
                  ? portfolio.balances.reduce((max, current) => 
                      (current.usdValue || 0) > (max.usdValue || 0) ? current : max
                    ).asset
                  : '-'
                }
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600 text-center">
              <h3 className="text-gray-300 text-sm mb-1">마지막 업데이트</h3>
              <p className="text-white font-bold text-lg">
                {portfolio.lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
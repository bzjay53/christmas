// 🎄 정적 HTML을 정확히 복사한 React 컴포넌트
import React, { useState } from 'react';
import MajorIndicesChartJS from './charts/MajorIndicesChartJS';
import AppleStockChart from './charts/AppleStockChart';
import VolumeChart from './charts/VolumeChart';
import PortfolioChart from './charts/PortfolioChart';
import APIConnectionTest from './APIConnectionTest';
import { safePlaceOrder } from '../lib/stocksService';

const StaticDashboardReact: React.FC = () => {
  const [isTrading, setIsTrading] = useState(false);
  const [stockCode, setStockCode] = useState('005930'); // 삼성전자
  const [quantity, setQuantity] = useState(10);
  const [tradeMessage, setTradeMessage] = useState('');

  const handleTrade = async (orderType: 'buy' | 'sell') => {
    setIsTrading(true);
    setTradeMessage('');

    const userId = 'user_' + Math.random().toString(36).substr(2, 9); // 임시 사용자 ID
    
    try {
      const result = await safePlaceOrder(userId, stockCode, orderType, quantity);
      
      if (result.success) {
        setTradeMessage(`✅ ${result.message}`);
      } else {
        setTradeMessage(`⚠️ ${result.message}`);
        
        // 대안 종목이 있으면 표시
        if (result.alternatives && result.alternatives.length > 0) {
          const altText = result.alternatives.map(alt => 
            `${alt.name}(${alt.symbol})`).join(', ');
          setTradeMessage(prev => prev + `\n💡 대안 종목: ${altText}`);
        }
      }
    } catch (error) {
      setTradeMessage(`❌ 거래 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
    
    setIsTrading(false);
  };

  return (
    <>
      {/* Christmas 장식 */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-green-500 via-yellow-500 to-red-500 opacity-30 z-10"></div>
      <div className="fixed top-4 right-4 pointer-events-none z-10 opacity-20">
        <span className="text-2xl">🎄</span>
      </div>
      <div className="fixed bottom-4 left-4 pointer-events-none z-10 opacity-20">
        <span className="text-2xl">🎁</span>
      </div>

      <div className="dashboard">
        {/* 사이드바 - 정적 HTML과 동일 */}
        <div className="sidebar">
          <div className="logo">🎄 Christmas Trading</div>
          <nav>
            <div className="nav-item active">📊 대시보드</div>
            <div className="nav-item">💼 포트폴리오</div>
            <div className="nav-item">🤖 AI 추천</div>
            <div className="nav-item">🔔 알림</div>
            <div className="nav-item">⚙️ 설정</div>
          </nav>
        </div>

        {/* 메인 콘텐츠 - 정적 HTML과 동일 */}
        <div className="main-content">
          {/* 헤더 */}
          <div className="header">
            <div className="portfolio-summary">
              <div>
                <div className="portfolio-value">🎄 Christmas Portfolio $105,550.91</div>
                <div className="portfolio-change">+$1,575.60 (+1.52%)</div>
              </div>
            </div>
            <div style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>
              마지막 업데이트: 오후 1:41:34 | 장중
            </div>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="content-area">
            {/* 차트 섹션 */}
            <div className="chart-section">
              {/* 메인 주요 지수 차트 */}
              <div className="chart-container">
                <div className="chart-title">🌏 주요 지수 (KOSPI, NASDAQ, S&P500)</div>
                <MajorIndicesChartJS />
              </div>
              
              {/* Apple 주식 차트 */}
              <div className="chart-container" style={{ height: '250px' }}>
                <div className="chart-title">📈 AAPL - Apple Inc. $150.25 (+2.45%)</div>
                <AppleStockChart />
              </div>
              
              {/* 거래량 차트 */}
              <div className="chart-container" style={{ height: '200px' }}>
                <div className="chart-title">📊 거래량</div>
                <VolumeChart />
              </div>
            </div>

            {/* 사이드 패널들 */}
            <div className="sidebar-panels">
              {/* 투자 전략 선택 */}
              <div className="panel">
                <div className="panel-title">🎯 투자 전략</div>
                <div className="strategy-selection">
                  <button className="strategy-btn aggressive">🔥 공격형</button>
                  <button className="strategy-btn neutral active">⚖️ 중립형</button>
                  <button className="strategy-btn defensive">🛡️ 방어형</button>
                </div>
                <div className="strategy-info">
                  <small>현재: 중립형 (RSI 14, MACD 12,26,9)</small>
                </div>
              </div>

              {/* 요금제 안내 (개선된 색상) */}
              <div className="panel pricing-panel">
                <div className="panel-title">💎 요금제 안내</div>
                <div className="pricing-card basic">
                  <div className="pricing-tier">기본 플랜</div>
                  <div className="pricing-price">무료</div>
                  <div className="pricing-features">
                    <div>• 모의투자</div>
                    <div>• 기본 차트</div>
                  </div>
                </div>
                <div className="pricing-card premium">
                  <div className="pricing-tier">프리미엄</div>
                  <div className="pricing-price">월 29,000원</div>
                  <div className="pricing-features">
                    <div>• 실시간 AI 분석</div>
                    <div>• 자동 거래</div>
                    <div>• 백테스트</div>
                  </div>
                  <button className="upgrade-btn">업그레이드</button>
                </div>
              </div>

              {/* 백테스트 패널 */}
              <div className="panel">
                <div className="panel-title">📊 백테스트</div>
                <div className="backtest-controls">
                  <button className="btn btn-backtest" onClick={() => alert('백테스트 기능을 실행합니다!')}>
                    전략 백테스트
                  </button>
                  <button className="btn btn-backtest" onClick={() => alert('과거 성과를 분석합니다!')}>
                    성과 분석
                  </button>
                  <button className="btn btn-backtest" onClick={() => alert('최적화를 진행합니다!')}>
                    전략 최적화
                  </button>
                </div>
                <div className="backtest-result">
                  <small>최근 백테스트: +12.5% (30일)</small>
                </div>
              </div>

              {/* 친구초대 & 쿠폰 */}
              <div className="panel">
                <div className="panel-title">🎁 혜택</div>
                <div className="benefit-section">
                  <button className="btn btn-referral" onClick={() => alert('준비 중입니다! 곧 출시될 예정입니다.')}>
                    친구 초대하기
                  </button>
                  <div className="referral-info">
                    <small>친구 1명당 10,000원 적립</small>
                  </div>
                  <input 
                    type="text" 
                    placeholder="쿠폰 코드 입력" 
                    className="coupon-input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        alert('현재 유효한 쿠폰이 없습니다. 곧 이벤트를 진행할 예정입니다!');
                      }
                    }}
                  />
                  <button className="btn btn-coupon" onClick={() => alert('현재 유효한 쿠폰이 없습니다!')}>
                    쿠폰 적용
                  </button>
                </div>
              </div>

              {/* 주요 종목 */}
              <div className="panel">
                <div className="panel-title">주요 종목</div>
                <div className="market-item">
                  <span>AAPL</span>
                  <span className="price-positive">$150.25 (+1.67%)</span>
                </div>
                <div className="market-item">
                  <span>MSFT</span>
                  <span className="price-positive">$378.85 (+0.82%)</span>
                </div>
                <div className="market-item">
                  <span>GOOGL</span>
                  <span className="price-negative">$138.45 (-0.45%)</span>
                </div>
                <div className="market-item">
                  <span>TSLA</span>
                  <span className="price-positive">$245.75 (+2.73%)</span>
                </div>
              </div>

              {/* 포트폴리오 성과 차트 */}
              <div className="panel">
                <div className="panel-title">📈 포트폴리오 성과</div>
                <div className="chart-container-small">
                  <PortfolioChart />
                </div>
              </div>

              {/* 빠른 거래 (동시 거래 방지 시스템 적용) */}
              <div className="panel">
                <div className="panel-title">🎁 안전한 거래</div>
                <div className="quick-trade">
                  <button 
                    className="btn btn-buy" 
                    onClick={() => handleTrade('buy')}
                    disabled={isTrading}
                  >
                    {isTrading ? '처리중...' : '매수'}
                  </button>
                  <button 
                    className="btn btn-sell" 
                    onClick={() => handleTrade('sell')}
                    disabled={isTrading}
                  >
                    {isTrading ? '처리중...' : '매도'}
                  </button>
                </div>
                <div className="input-group">
                  <label>종목코드</label>
                  <input 
                    type="text" 
                    placeholder="005930" 
                    value={stockCode}
                    onChange={(e) => setStockCode(e.target.value)}
                    disabled={isTrading}
                  />
                </div>
                <div className="input-group">
                  <label>수량</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    disabled={isTrading}
                  />
                </div>
                <div className="input-group">
                  <label>가격</label>
                  <input type="text" placeholder="시장가" defaultValue="시장가" disabled />
                </div>
                
                {/* 거래 결과 메시지 */}
                {tradeMessage && (
                  <div style={{
                    padding: '10px',
                    marginTop: '10px',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    backgroundColor: tradeMessage.includes('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    border: tradeMessage.includes('✅') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                    color: tradeMessage.includes('✅') ? '#10B981' : '#F59E0B',
                    whiteSpace: 'pre-line'
                  }}>
                    {tradeMessage}
                  </div>
                )}
                
                <button 
                  className="btn btn-buy" 
                  style={{ width: '100%', marginTop: '10px' }}
                  onClick={() => handleTrade('buy')}
                  disabled={isTrading}
                >
                  {isTrading ? '거래 처리중...' : '🛡️ 안전한 매수 주문'}
                </button>
              </div>
            </div>
          </div>

          {/* 테이블 섹션 */}
          <div className="tables-section">
            {/* 보유 종목 */}
            <div className="table-container">
              <div className="table-header">보유 종목</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>종목코드</th>
                    <th>보유주식</th>
                    <th>평균가</th>
                    <th>현재가</th>
                    <th>손익</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>AAPL</td>
                    <td>100</td>
                    <td>$145.30</td>
                    <td className="price-positive">$150.25</td>
                    <td className="price-positive">+$495.00</td>
                  </tr>
                  <tr>
                    <td>MSFT</td>
                    <td>50</td>
                    <td>$375.20</td>
                    <td className="price-positive">$378.85</td>
                    <td className="price-positive">+$182.50</td>
                  </tr>
                  <tr>
                    <td>GOOGL</td>
                    <td>25</td>
                    <td>$140.00</td>
                    <td className="price-negative">$138.45</td>
                    <td className="price-negative">-$38.75</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 최근 주문 */}
            <div className="table-container">
              <div className="table-header">최근 주문</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>종목코드</th>
                    <th>구분</th>
                    <th>수량</th>
                    <th>가격</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>AAPL</td>
                    <td><span style={{background: '#10B981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem'}}>매수</span></td>
                    <td>10</td>
                    <td>$150.00</td>
                    <td><span style={{background: '#10B981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem'}}>체결</span></td>
                  </tr>
                  <tr>
                    <td>MSFT</td>
                    <td><span style={{background: '#EF4444', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem'}}>매도</span></td>
                    <td>5</td>
                    <td>$378.50</td>
                    <td><span style={{background: '#F59E0B', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem'}}>대기</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* API 연결 테스트 섹션 */}
          <div className="api-test-section">
            <APIConnectionTest />
          </div>
        </div>
      </div>
    </>
  );
};

export default StaticDashboardReact;
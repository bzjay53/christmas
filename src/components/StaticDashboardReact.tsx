// 🎄 정적 HTML을 정확히 복사한 React 컴포넌트
import React from 'react';
import MajorIndicesChartJS from './charts/MajorIndicesChartJS';
import AppleStockChart from './charts/AppleStockChart';
import VolumeChart from './charts/VolumeChart';
import PortfolioChart from './charts/PortfolioChart';

const StaticDashboardReact: React.FC = () => {
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

              {/* 빠른 거래 */}
              <div className="panel">
                <div className="panel-title">🎁 빠른 거래</div>
                <div className="quick-trade">
                  <button className="btn btn-buy">매수</button>
                  <button className="btn btn-sell">매도</button>
                </div>
                <div className="input-group">
                  <label>종목코드</label>
                  <input type="text" placeholder="AAPL" defaultValue="AAPL" />
                </div>
                <div className="input-group">
                  <label>수량</label>
                  <input type="number" placeholder="0" defaultValue="10" />
                </div>
                <div className="input-group">
                  <label>가격</label>
                  <input type="text" placeholder="시장가" defaultValue="시장가" />
                </div>
                <button className="btn btn-buy" style={{ width: '100%' }}>매수 주문하기</button>
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
        </div>
      </div>
    </>
  );
};

export default StaticDashboardReact;
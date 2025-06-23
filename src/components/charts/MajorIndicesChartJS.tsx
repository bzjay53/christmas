// 📊 Major Indices Chart using Chart.js - Live API Data
import React, { useState, useEffect, useMemo } from 'react';
import ChartJSWrapper from './ChartJSWrapper';
import { getMarketData } from '../../services/api';

interface MajorIndicesChartJSProps {
  height?: number;
}

const MajorIndicesChartJS: React.FC<MajorIndicesChartJSProps> = ({ 
  height = 300 
}) => {
  const [marketData, setMarketData] = useState({
    kospi: [2580, 2595, 2610, 2625, 2640, 2655, 2670], // fallback
    nasdaq: [17800, 17850, 17900, 17950, 18000, 18050, 18100], // fallback
    sp500: [5950, 5960, 5970, 5980, 5990, 6000, 6010], // fallback
    loading: true,
    lastUpdated: null as string | null,
    dataSource: 'fallback' as 'live' | 'fallback'
  });

  // 🔄 실시간 데이터 로드
  useEffect(() => {
    const loadMarketData = async () => {
      try {
        console.log('🔄 Fetching live market data...');
        
        // 병렬로 모든 마켓 데이터 가져오기
        const [kospiResponse, nasdaqResponse, sp500Response] = await Promise.allSettled([
          getMarketData.kospi(),
          getMarketData.nasdaq(), 
          getMarketData.sp500()
        ]);

        const newData = { ...marketData };
        let hasLiveData = false;

        if (kospiResponse.status === 'fulfilled') {
          newData.kospi = kospiResponse.value.data;
          if (kospiResponse.value.source === 'live') hasLiveData = true;
          console.log('✅ KOSPI data loaded:', kospiResponse.value.source);
        }

        if (nasdaqResponse.status === 'fulfilled') {
          newData.nasdaq = nasdaqResponse.value.data;
          if (nasdaqResponse.value.source === 'live') hasLiveData = true;
          console.log('✅ NASDAQ data loaded:', nasdaqResponse.value.source);
        }

        if (sp500Response.status === 'fulfilled') {
          newData.sp500 = sp500Response.value.data;
          if (sp500Response.value.source === 'live') hasLiveData = true;
          console.log('✅ S&P500 data loaded:', sp500Response.value.source);
        }

        setMarketData({
          ...newData,
          loading: false,
          lastUpdated: new Date().toISOString(),
          dataSource: hasLiveData ? 'live' : 'fallback'
        });

        console.log(`📊 Market data loaded from ${hasLiveData ? 'live API' : 'fallback'}`);
        
      } catch (error) {
        console.error('❌ Failed to load market data:', error);
        setMarketData(prev => ({
          ...prev,
          loading: false,
          dataSource: 'fallback'
        }));
      }
    };

    loadMarketData();

    // 🔄 5분마다 데이터 갱신
    const interval = setInterval(loadMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 차트 데이터 생성
  const chartData = useMemo(() => ({
    labels: ['12/18', '12/19', '12/20', '12/21', '12/22', '12/23', '12/24'],
    datasets: [
      {
        label: `KOSPI ${marketData.dataSource === 'live' ? '🔴' : '📊'}`,
        data: marketData.kospi,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      },
      {
        label: `NASDAQ ${marketData.dataSource === 'live' ? '🔴' : '📊'}`,
        data: marketData.nasdaq,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: `S&P500 ${marketData.dataSource === 'live' ? '🔴' : '📊'}`,
        data: marketData.sp500,
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4
      }
    ]
  }), [marketData]);

  // static-test.html과 정확히 동일한 옵션
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#E5E7EB' }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        borderColor: '#374151',
        borderWidth: 1,
        titleColor: '#E5E7EB',
        bodyColor: '#E5E7EB',
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString('ko-KR')}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: '#374151' },
        ticks: { color: '#9CA3AF' }
      },
      y: {
        grid: { color: '#374151' },
        ticks: { 
          color: '#9CA3AF',
          callback: function(value: any) {
            return value.toLocaleString('ko-KR');
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  }), []);

  // 실시간 지수 정보 (차트 데이터 기반)
  const indicesInfo = useMemo(() => [
    { 
      name: 'KOSPI', 
      value: marketData.kospi[marketData.kospi.length - 1] || 2670, 
      change: marketData.kospi.length > 1 ? marketData.kospi[marketData.kospi.length - 1] - marketData.kospi[marketData.kospi.length - 2] : 15.2,
      changePercent: marketData.kospi.length > 1 ? 
        ((marketData.kospi[marketData.kospi.length - 1] - marketData.kospi[marketData.kospi.length - 2]) / marketData.kospi[marketData.kospi.length - 2] * 100) : 0.57,
      color: '#10B981' 
    },
    { 
      name: 'NASDAQ', 
      value: marketData.nasdaq[marketData.nasdaq.length - 1] || 18100, 
      change: marketData.nasdaq.length > 1 ? marketData.nasdaq[marketData.nasdaq.length - 1] - marketData.nasdaq[marketData.nasdaq.length - 2] : 85.4,
      changePercent: marketData.nasdaq.length > 1 ? 
        ((marketData.nasdaq[marketData.nasdaq.length - 1] - marketData.nasdaq[marketData.nasdaq.length - 2]) / marketData.nasdaq[marketData.nasdaq.length - 2] * 100) : 0.47,
      color: '#3B82F6' 
    },
    { 
      name: 'S&P500', 
      value: marketData.sp500[marketData.sp500.length - 1] || 6010, 
      change: marketData.sp500.length > 1 ? marketData.sp500[marketData.sp500.length - 1] - marketData.sp500[marketData.sp500.length - 2] : 12.8,
      changePercent: marketData.sp500.length > 1 ? 
        ((marketData.sp500[marketData.sp500.length - 1] - marketData.sp500[marketData.sp500.length - 2]) / marketData.sp500[marketData.sp500.length - 2] * 100) : 0.21,
      color: '#F59E0B' 
    }
  ], [marketData]);

  return (
    <div className="w-full">
      {/* 실시간 데이터 연동 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-white">
            🌏 주요 지수 (KOSPI, NASDAQ, S&P500)
          </h3>
          {marketData.loading && (
            <div className="flex items-center space-x-1 text-xs text-blue-400">
              <div className="animate-spin rounded-full h-3 w-3 border border-blue-400 border-t-transparent"></div>
              <span>로딩중...</span>
            </div>
          )}
          {!marketData.loading && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              marketData.dataSource === 'live' 
                ? 'bg-green-900 text-green-400' 
                : 'bg-yellow-900 text-yellow-400'
            }`}>
              {marketData.dataSource === 'live' ? '🔴 실시간' : '📊 샘플'}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4 text-sm">
          {indicesInfo.map((index) => (
            <div key={index.name} className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: index.color }}
              ></div>
              <span className="text-slate-300">{index.name}</span>
              <span 
                className={`font-medium ${
                  index.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* static-test.html과 동일한 차트 컨테이너 */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <ChartJSWrapper
          type="line"
          data={chartData}
          options={chartOptions}
          height={height}
          className="w-full"
        />
      </div>

      {/* static-test.html과 동일한 하단 요약 */}
      <div className="mt-3 grid grid-cols-3 gap-4">
        {indicesInfo.map((index) => (
          <div key={index.name} className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">{index.name}</span>
              <div className="text-right">
                <div className="text-white font-medium">
                  {index.value.toLocaleString('ko-KR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
                <div 
                  className={`text-sm ${
                    index.change >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)} 
                  ({index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MajorIndicesChartJS;
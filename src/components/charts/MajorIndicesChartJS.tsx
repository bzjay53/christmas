// 📊 Major Indices Chart using Chart.js - static-test.html 정확한 복사
import React, { useMemo } from 'react';
import ChartJSWrapper from './ChartJSWrapper';

interface MajorIndicesChartJSProps {
  height?: number;
}

const MajorIndicesChartJS: React.FC<MajorIndicesChartJSProps> = ({ 
  height = 300 
}) => {
  // static-test.html과 정확히 동일한 데이터
  const chartData = useMemo(() => ({
    labels: ['12/18', '12/19', '12/20', '12/21', '12/22', '12/23', '12/24'],
    datasets: [
      {
        label: 'KOSPI',
        data: [2580, 2595, 2610, 2625, 2640, 2655, 2670],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      },
      {
        label: 'NASDAQ',
        data: [17800, 17850, 17900, 17950, 18000, 18050, 18100],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'S&P500',
        data: [5950, 5960, 5970, 5980, 5990, 6000, 6010],
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4
      }
    ]
  }), []);

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

  // static-test.html과 동일한 지수 정보
  const indicesInfo = [
    { name: 'KOSPI', value: 2670, change: 15.2, changePercent: 0.57, color: '#10B981' },
    { name: 'NASDAQ', value: 18100, change: 85.4, changePercent: 0.47, color: '#3B82F6' },
    { name: 'S&P500', value: 6010, change: 12.8, changePercent: 0.21, color: '#F59E0B' }
  ];

  return (
    <div className="w-full">
      {/* static-test.html과 동일한 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          🌏 주요 지수 (KOSPI, NASDAQ, S&P500)
        </h3>
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
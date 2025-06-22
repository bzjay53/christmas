import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { MarketIndex } from '../../types/market';

interface MajorIndicesChartProps {
  indices: MarketIndex[];
  height?: number;
  showGrid?: boolean;
  animated?: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    dataKey: string;
    value: number;
  }>;
  label?: string;
}

interface ChartDataFormatted {
  timestamp: string;
  date: string;
  KOSPI?: number;
  NASDAQ?: number;
  'S&P500'?: number;
}

const MajorIndicesChart: React.FC<MajorIndicesChartProps> = ({
  indices,
  height = 300,
  showGrid = true,
  animated = true
}) => {
  // 데이터 변환: 각 지수의 히스토리를 하나의 차트 데이터로 합치기
  const chartData = useMemo(() => {
    if (!indices || indices.length === 0) return [];

    // 모든 타임스탬프 수집
    const allTimestamps = new Set<string>();
    indices.forEach(index => {
      index.history.forEach(point => {
        allTimestamps.add(point.timestamp);
      });
    });

    // 타임스탬프 정렬
    const sortedTimestamps = Array.from(allTimestamps).sort();

    // 각 타임스탬프별로 모든 지수 값 매핑
    return sortedTimestamps.map(timestamp => {
      const dataPoint: ChartDataFormatted = {
        timestamp,
        date: new Date(timestamp).toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric'
        })
      };

      indices.forEach(index => {
        const point = index.history.find(h => h.timestamp === timestamp);
        if (point) {
          dataPoint[index.name] = point.value;
        }
      });

      return dataPoint;
    });
  }, [indices]);

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-300 text-sm mb-2">{`날짜: ${label}`}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${entry.value?.toLocaleString('ko-KR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 로딩 상태 처리
  if (!indices || indices.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-slate-800 rounded-lg border border-slate-700"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
          <p className="text-slate-400 text-sm">주요 지수 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 차트 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          🌏 주요 지수 (KOSPI, NASDAQ, S&P500)
        </h3>
        <div className="flex items-center space-x-4 text-sm">
          {indices.map((index) => (
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

      {/* 차트 컨테이너 */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#374151" 
                opacity={0.3}
              />
            )}
            <XAxis 
              dataKey="date"
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
              tickFormatter={(value) => value.toLocaleString('ko-KR')}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: '#E5E7EB' }}
              iconType="line"
            />
            
            {/* 각 지수별 라인 */}
            {indices.map((index) => (
              <Line
                key={index.name}
                type="monotone"
                dataKey={index.name}
                stroke={index.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ 
                  r: 4, 
                  fill: index.color,
                  stroke: '#1e293b',
                  strokeWidth: 2
                }}
                connectNulls={false}
                animationDuration={animated ? 1000 : 0}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 차트 하단 요약 정보 */}
      <div className="mt-3 grid grid-cols-3 gap-4">
        {indices.map((index) => (
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

export default MajorIndicesChart;
import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// 포트폴리오 성과 차트 데이터 (스크린샷과 유사한 형태)
const portfolioData = [
  { date: '09:30', value: 140, volume: 1200 },
  { date: '10:00', value: 145, volume: 1500 },
  { date: '10:30', value: 142, volume: 1100 },
  { date: '11:00', value: 148, volume: 1800 },
  { date: '11:30', value: 152, volume: 2100 },
  { date: '12:00', value: 149, volume: 1600 },
  { date: '12:30', value: 155, volume: 2400 },
  { date: '13:00', value: 158, volume: 2000 },
  { date: '13:30', value: 156, volume: 1700 },
  { date: '14:00', value: 160, volume: 2300 },
];

// 섹터 배분 데이터
const sectorData = [
  { name: 'Technology', value: 35, color: '#10B981' },
  { name: 'Healthcare', value: 25, color: '#3B82F6' },
  { name: 'Finance', value: 20, color: '#8B5CF6' },
  { name: 'Consumer', value: 15, color: '#F59E0B' },
  { name: 'Energy', value: 5, color: '#EF4444' },
];

// 주식 성과 데이터
const stockPerformanceData = [
  { symbol: 'AAPL', return: 8.5, color: '#10B981' },
  { symbol: 'GOOGL', return: -2.1, color: '#EF4444' },
  { symbol: 'MSFT', return: 5.2, color: '#10B981' },
  { symbol: 'NVDA', return: 12.8, color: '#10B981' },
  { symbol: 'TSLA', return: -5.3, color: '#EF4444' },
];

export const PortfolioChart: React.FC = () => {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={portfolioData}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            fontSize={12}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={12}
            domain={['dataMin - 1000', 'dataMax + 1000']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '6px',
              color: '#F9FAFB'
            }}
            formatter={(value: any) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const VolumeChart: React.FC = () => {
  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={portfolioData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            fontSize={10}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={10}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '6px',
              color: '#F9FAFB'
            }}
            formatter={(value: any) => [value.toLocaleString(), 'Volume']}
          />
          <Bar dataKey="volume" fill="#3B82F6" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SectorPieChart: React.FC = () => {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={sectorData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ name, value }: any) => `${name}: ${value}%`}
          >
            {sectorData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '6px',
              color: '#F9FAFB'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const StockPerformanceChart: React.FC = () => {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stockPerformanceData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
          <YAxis type="category" dataKey="symbol" stroke="#9CA3AF" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '6px',
              color: '#F9FAFB'
            }}
            formatter={(value: any) => [`${value}%`, 'Return']}
          />
          <Bar 
            dataKey="return" 
            radius={[0, 4, 4, 0]}
            fill="#3B82F6"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Christmas 테마 장식 컴포넌트 (최적화됨)
export const ChristmasDecorations: React.FC = () => {
  return (
    <>
      {/* Christmas lights border - 간단하고 정적 */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-green-500 via-yellow-500 to-red-500 opacity-30 z-10"></div>
      
      {/* 고정된 크리스마스 장식 - 움직이지 않음 */}
      <div className="fixed top-4 right-4 pointer-events-none z-10 opacity-20">
        <span className="text-2xl">🎄</span>
      </div>
      <div className="fixed bottom-4 left-4 pointer-events-none z-10 opacity-20">
        <span className="text-2xl">🎁</span>
      </div>
    </>
  );
};

export default {
  PortfolioChart,
  VolumeChart,
  SectorPieChart,
  StockPerformanceChart,
  ChristmasDecorations
};
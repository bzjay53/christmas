import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, BarChart3, TrendingUp } from 'lucide-react';
import { ChartDataPoint, ChartProps } from '../../types';

interface LiveChartProps extends Omit<ChartProps, 'data'> {
  symbol: string;
  data?: ChartDataPoint[];
}

export const LiveChart: React.FC<LiveChartProps> = ({
  symbol,
  data = [],
  config = { interval: '1m', type: 'line', indicators: [], theme: 'dark' },
  height = 300,
  className = ''
}) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>(data);
  const [selectedInterval, setSelectedInterval] = useState(config.interval);
  const [isLive, setIsLive] = useState(true);
  const [volume, setVolume] = useState('2.4B USDT');
  const intervalRef = useRef<NodeJS.Timeout>();

  // 실시간 데이터 생성 (시뮬레이션)
  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(() => {
        setChartData(prevData => {
          const newData = [...prevData];
          const lastPoint = newData[newData.length - 1];
          const basePrice = lastPoint ? lastPoint.price : 43000;
          
          // 새로운 데이터 포인트 생성 (랜덤 가격 변동)
          const priceChange = (Math.random() - 0.5) * 200; // ±100 변동
          const newPrice = Math.max(basePrice + priceChange, 1000); // 최소값 설정
          
          const newPoint: ChartDataPoint = {
            time: new Date().toISOString(),
            price: newPrice,
            volume: Math.random() * 1000000,
            timestamp: Date.now()
          };

          // 최대 100개 데이터 포인트 유지
          if (newData.length >= 100) {
            newData.shift();
          }
          
          return [...newData, newPoint];
        });
        
        // 거래량 업데이트
        setVolume(prev => {
          const currentVolume = parseFloat(prev.replace(/[^\d.]/g, ''));
          const change = (Math.random() - 0.5) * 0.1;
          const newVolume = Math.max(currentVolume + change, 1);
          return `${newVolume.toFixed(1)}B USDT`;
        });
      }, selectedInterval === '1m' ? 3000 : 10000); // 간격에 따라 업데이트 속도 조정
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLive, selectedInterval]);

  // 초기 데이터 생성
  useEffect(() => {
    if (chartData.length === 0) {
      const initialData: ChartDataPoint[] = [];
      const now = Date.now();
      const basePrice = 43000;

      for (let i = 50; i >= 0; i--) {
        const timestamp = now - (i * 60000); // 1분 간격
        const price = basePrice + (Math.random() - 0.5) * 1000;
        
        initialData.push({
          time: new Date(timestamp).toISOString(),
          price,
          volume: Math.random() * 1000000,
          timestamp
        });
      }
      
      setChartData(initialData);
    }
  }, []);

  const intervals = [
    { key: '1m', label: '🎄 1m', active: selectedInterval === '1m' },
    { key: '5m', label: '❄️ 5m', active: selectedInterval === '5m' },
    { key: '15m', label: '⭐ 15m', active: selectedInterval === '15m' },
    { key: '1h', label: '🎁 1h', active: selectedInterval === '1h' }
  ];

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()}`;
  };

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 0;
  const prevPrice = chartData.length > 1 ? chartData[chartData.length - 2].price : currentPrice;
  const priceChange = currentPrice - prevPrice;
  const isPositive = priceChange >= 0;

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-green-500/30 rounded-lg p-3 shadow-lg">
          <p className="text-green-400 text-sm font-semibold">
            {formatTime(data.timestamp)}
          </p>
          <p className="text-white text-lg font-bold">
            {formatPrice(data.price)}
          </p>
          <p className="text-gray-400 text-xs">
            Volume: {(data.volume / 1000000).toFixed(2)}M
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`chart-container ${className}`}>
      {/* 차트 헤더 */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <h3 className="text-green-400 font-bold text-lg flex items-center gap-2">
            🎄 {symbol} Christmas Chart
          </h3>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full animate-pulse ${isLive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
            <span className={`text-sm font-semibold ${isLive ? 'text-green-400' : 'text-gray-400'}`}>
              {isLive ? '🔴 LIVE' : '⏸️ PAUSED'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              isLive ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            {isLive ? 'LIVE' : 'START'}
          </button>
          <Activity size={16} className="text-green-400" />
        </div>
      </div>
      
      {/* 간격 선택 버튼 */}
      <div className="flex gap-2 p-4 pb-2">
        {intervals.map((interval) => (
          <button
            key={interval.key}
            onClick={() => setSelectedInterval(interval.key as any)}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              interval.active 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            {interval.label}
          </button>
        ))}
      </div>

      {/* 현재 가격 정보 */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-4">
          <div className="text-white text-2xl font-bold font-crypto">
            {formatPrice(currentPrice)}
          </div>
          <div className={`flex items-center gap-1 text-sm font-semibold ${
            isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            <span>{isPositive ? '🎄↗' : '❄️↘'}</span>
            <span>{isPositive ? '+' : ''}{priceChange.toFixed(2)}</span>
            <span>({((priceChange / prevPrice) * 100).toFixed(2)}%)</span>
          </div>
        </div>
      </div>
      
      {/* 차트 영역 */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(255,255,255,0.1)" 
            />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={formatTime}
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              domain={['dataMin - 100', 'dataMax + 100']}
              tickFormatter={(value) => `${value.toLocaleString()}`}
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#22C55E"
              strokeWidth={2}
              dot={false}
              activeDot={{ 
                r: 4, 
                fill: '#22C55E',
                stroke: '#16A34A',
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* 차트 하단 정보 */}
      <div className="flex justify-between items-center p-4 border-t border-gray-700/50 text-sm">
        <div className="text-yellow-300">
          🎁 거래량: {volume}
        </div>
        <div className="text-gray-400">
          마지막 업데이트: {formatTime(Date.now())}
        </div>
      </div>

      {/* 미니 차트 표시 바 */}
      <div className="px-4 pb-4">
        <div className="h-12 bg-gray-800/50 rounded flex items-end justify-center gap-1 p-2">
          {chartData.slice(-20).map((point, index) => {
            const height = Math.max(((point.price - Math.min(...chartData.slice(-20).map(p => p.price))) / 
                                   (Math.max(...chartData.slice(-20).map(p => p.price)) - 
                                    Math.min(...chartData.slice(-20).map(p => p.price)))) * 100, 5);
            
            return (
              <div
                key={index}
                className={`w-2 rounded-t transition-all duration-300 ${
                  index === chartData.slice(-20).length - 1 ? 'bg-yellow-400 animate-pulse' : 
                  point.price > (chartData.slice(-20)[index - 1]?.price || point.price) ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
        <div className="text-center text-xs text-gray-400 mt-2">
          최근 20개 포인트 미리보기
        </div>
      </div>
    </div>
  );
};

export default LiveChart;
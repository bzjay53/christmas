import { useState, useEffect, useCallback } from 'react';
import type { MarketIndex, Stock, ChartDataPoint } from '../types/market';
import { CHART_COLORS } from '../types/market';

// 시뮬레이션 데이터 생성을 위한 기본 값들
const INITIAL_VALUES = {
  KOSPI: 2670,
  NASDAQ: 18100,
  'S&P500': 6010
};

// 7일간의 히스토리 데이터 생성
const generateHistoricalData = (indexName: keyof typeof INITIAL_VALUES, days = 7): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const baseValue = INITIAL_VALUES[indexName];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // 시장 변동성 시뮬레이션 (±1.5% 범위)
    const variation = (Math.random() - 0.5) * 0.03;
    const dailyVariation = baseValue * variation;
    const value = baseValue + dailyVariation + (Math.random() - 0.5) * 50;
    
    data.push({
      timestamp: date.toISOString(),
      value: Math.max(value, baseValue * 0.95) // 최소 5% 하락 제한
    });
  }
  
  return data;
};

// 주요 종목 시뮬레이션 데이터
const generateStocks = (): Stock[] => {
  const baseStocks = [
    { symbol: 'AAPL', company: 'Apple Inc.', basePrice: 150.25 },
    { symbol: 'MSFT', company: 'Microsoft Corp.', basePrice: 378.85 },
    { symbol: 'GOOGL', company: 'Alphabet Inc.', basePrice: 138.45 },
    { symbol: 'TSLA', company: 'Tesla Inc.', basePrice: 245.75 },
    { symbol: 'AMZN', company: 'Amazon.com Inc.', basePrice: 3314.07 }
  ];

  return baseStocks.map(stock => {
    const variation = (Math.random() - 0.5) * 0.04; // ±2% 변동
    const change = stock.basePrice * variation;
    const currentPrice = stock.basePrice + change;
    
    return {
      ...stock,
      price: currentPrice,
      change: change,
      changePercent: (change / stock.basePrice) * 100,
      volume: Math.floor(Math.random() * 5000000) + 1000000, // 1M~6M
      lastUpdate: new Date().toISOString()
    };
  });
};

// 실시간 데이터 훅
export const useMarketData = (updateInterval = 30000) => {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // 초기 데이터 로드
  const initializeData = useCallback(() => {
    setIsLoading(true);
    
    // 주요 지수 초기화
    const initialIndices: MarketIndex[] = [
      {
        name: 'KOSPI',
        symbol: 'KS11',
        value: INITIAL_VALUES.KOSPI,
        change: 15.2,
        changePercent: 0.57,
        history: generateHistoricalData('KOSPI'),
        color: CHART_COLORS.KOSPI
      },
      {
        name: 'NASDAQ',
        symbol: 'IXIC',
        value: INITIAL_VALUES.NASDAQ,
        change: 85.4,
        changePercent: 0.47,
        history: generateHistoricalData('NASDAQ'),
        color: CHART_COLORS.NASDAQ
      },
      {
        name: 'S&P500',
        symbol: 'SPX',
        value: INITIAL_VALUES['S&P500'],
        change: 12.8,
        changePercent: 0.21,
        history: generateHistoricalData('S&P500'),
        color: CHART_COLORS['S&P500']
      }
    ];

    setIndices(initialIndices);
    setStocks(generateStocks());
    setLastUpdate(new Date().toLocaleString('ko-KR'));
    setIsLoading(false);
  }, []);

  // 실시간 업데이트 함수
  const updateMarketData = useCallback(() => {
    setIndices(prevIndices => 
      prevIndices.map(index => {
        // 소폭 변동 시뮬레이션 (±0.5%)
        const variation = (Math.random() - 0.5) * 0.01;
        const changeAmount = index.value * variation;
        const newValue = Math.max(index.value + changeAmount, index.value * 0.98);
        const newChange = newValue - INITIAL_VALUES[index.name];
        const newChangePercent = (newChange / INITIAL_VALUES[index.name]) * 100;

        // 새로운 히스토리 포인트 추가 (최근 7개만 유지)
        const newHistory = [...index.history];
        if (newHistory.length >= 7) {
          newHistory.shift(); // 가장 오래된 데이터 제거
        }
        newHistory.push({
          timestamp: new Date().toISOString(),
          value: newValue
        });

        return {
          ...index,
          value: newValue,
          change: newChange,
          changePercent: newChangePercent,
          history: newHistory
        };
      })
    );

    setStocks(prevStocks => 
      prevStocks.map(stock => {
        const variation = (Math.random() - 0.5) * 0.02; // ±1% 변동
        const changeAmount = stock.price * variation;
        const newPrice = Math.max(stock.price + changeAmount, stock.price * 0.95);
        const basePrice = stock.price - stock.change; // 원래 기준 가격
        const newChange = newPrice - basePrice;
        const newChangePercent = (newChange / basePrice) * 100;

        return {
          ...stock,
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent,
          volume: stock.volume + Math.floor((Math.random() - 0.5) * 100000),
          lastUpdate: new Date().toISOString()
        };
      })
    );

    setLastUpdate(new Date().toLocaleString('ko-KR'));
  }, []);

  // 초기화 및 실시간 업데이트 설정
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  useEffect(() => {
    if (isLoading) return;

    const interval = setInterval(() => {
      updateMarketData();
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateMarketData, updateInterval, isLoading]);

  // 수동 새로고침 함수
  const refreshData = useCallback(() => {
    updateMarketData();
  }, [updateMarketData]);

  return {
    indices,
    stocks,
    isLoading,
    lastUpdate,
    refreshData
  };
};
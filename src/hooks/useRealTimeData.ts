import { useState, useEffect } from 'react';

// 실시간 주식 데이터 타입
export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdate: string;
}

// 포트폴리오 데이터 타입
export interface PortfolioData {
  totalValue: number;
  totalChange: number;
  totalChangePercent: number;
  holdings: StockData[];
}

// 안정적인 Mock 데이터 생성기 (미친듯이 변하지 않음)
const generateStableData = (symbol: string): StockData => {
  const baseData = {
    'AAPL': { price: 186.25, change: 2.45, changePercent: 1.33 },
    'GOOGL': { price: 146.80, change: -1.20, changePercent: -0.81 },
    'MSFT': { price: 338.50, change: 4.75, changePercent: 1.42 },
    'NVDA': { price: 415.60, change: 8.90, changePercent: 2.19 },
    'TSLA': { price: 245.75, change: -3.25, changePercent: -1.30 },
  }[symbol] || { price: 100, change: 0, changePercent: 0 };

  return {
    symbol,
    price: baseData.price,
    change: baseData.change,
    changePercent: baseData.changePercent,
    volume: Math.floor(Math.random() * 500000) + 500000, // 500K-1M 범위로 제한
    lastUpdate: new Date().toLocaleTimeString()
  };
};

// 실시간 데이터 훅
export const useRealTimeData = (symbols: string[]) => {
  const [data, setData] = useState<StockData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(true);
    
    // 초기 데이터 로드 (안정적인 데이터)
    const initialData = symbols.map(generateStableData);
    setData(initialData);

    // 데이터 업데이트 빈도를 줄임 (30초마다) - 나중에 실제 API 연동시 부드럽게 업데이트
    const interval = setInterval(() => {
      const updatedData = symbols.map(generateStableData);
      setData(updatedData);
    }, 30000); // 30초로 변경

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [symbols]);

  return { data, isConnected };
};

// 안정적인 포트폴리오 훅 (고정된 수량으로)
export const usePortfolio = () => {
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'TSLA'];
  const { data: stockData, isConnected } = useRealTimeData(symbols);
  
  // 고정된 포트폴리오 값 (어지럽게 변하지 않음)
  const [portfolio] = useState<PortfolioData>({
    totalValue: 105550.91,
    totalChange: 1575.60,
    totalChangePercent: 1.52,
    holdings: []
  });

  const [dynamicHoldings, setDynamicHoldings] = useState<StockData[]>([]);

  useEffect(() => {
    if (stockData.length > 0) {
      setDynamicHoldings(stockData);
    }
  }, [stockData]);

  return { 
    portfolio: {
      ...portfolio,
      holdings: dynamicHoldings
    }, 
    isConnected 
  };
};

// AI 추천 데이터 훅
export const useAIRecommendations = () => {
  const [recommendations] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setIsAnalyzing(true);
    
    // Mock AI 분석 시간
    const timeout = setTimeout(() => {
      setIsAnalyzing(false);
      // 실제로는 MCP 서버에서 AI 추천을 가져옴
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return { recommendations, isAnalyzing };
};

// Christmas 테마 알림 훅
export const useChristmasNotifications = () => {
  const [notifications, setNotifications] = useState<string[]>([]);

  const addNotification = (message: string) => {
    const christmasMessage = `🎄 ${message} 🎁`;
    setNotifications(prev => [...prev, christmasMessage]);
    
    // 5초 후 알림 제거
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  return { notifications, addNotification };
};
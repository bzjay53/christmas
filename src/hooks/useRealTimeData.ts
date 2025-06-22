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

// Mock 실시간 데이터 생성기
const generateMockData = (symbol: string): StockData => {
  const basePrice = {
    'AAPL': 186.25,
    'GOOGL': 146.80,
    'MSFT': 338.50,
    'NVDA': 415.60,
    'TSLA': 245.75,
  }[symbol] || 100;

  const variance = (Math.random() - 0.5) * 2; // -1 to 1
  const price = basePrice + variance;
  const change = variance;
  const changePercent = (change / basePrice) * 100;

  return {
    symbol,
    price,
    change,
    changePercent,
    volume: Math.floor(Math.random() * 1000000),
    lastUpdate: new Date().toLocaleTimeString()
  };
};

// 실시간 데이터 훅
export const useRealTimeData = (symbols: string[]) => {
  const [data, setData] = useState<StockData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(true);
    
    // 초기 데이터 로드
    const initialData = symbols.map(generateMockData);
    setData(initialData);

    // 5초마다 데이터 업데이트 (실제로는 WebSocket 사용)
    const interval = setInterval(() => {
      const updatedData = symbols.map(generateMockData);
      setData(updatedData);
    }, 5000);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [symbols]);

  return { data, isConnected };
};

// 포트폴리오 훅
export const usePortfolio = () => {
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'TSLA'];
  const { data: stockData, isConnected } = useRealTimeData(symbols);
  
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    totalValue: 0,
    totalChange: 0,
    totalChangePercent: 0,
    holdings: []
  });

  useEffect(() => {
    if (stockData.length > 0) {
      const holdings = stockData.map(stock => ({
        ...stock,
        // Mock holding quantities
        quantity: Math.floor(Math.random() * 100) + 10
      }));

      const totalValue = holdings.reduce((sum, holding) => 
        sum + (holding.price * (holding as any).quantity), 0
      );
      
      const totalChange = holdings.reduce((sum, holding) => 
        sum + (holding.change * (holding as any).quantity), 0
      );

      const totalChangePercent = totalValue > 0 ? (totalChange / (totalValue - totalChange)) * 100 : 0;

      setPortfolio({
        totalValue,
        totalChange,
        totalChangePercent,
        holdings: stockData
      });
    }
  }, [stockData]);

  return { portfolio, isConnected };
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
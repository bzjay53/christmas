// 암호화폐 주요 종목 차트 - 실시간 바이낸스 데이터 연동
import React, { useRef, useEffect, useState } from 'react';
import Chart from 'chart.js/auto';
import { getBinanceAPI, type CryptoPrice, type KlineData } from '../../lib/binanceAPI';

const MajorIndicesChartJS: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [cryptoData, setCryptoData] = useState<{ [key: string]: KlineData[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 바이낸스 데이터 로드
  useEffect(() => {
    const loadCryptoData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const binanceAPI = getBinanceAPI();
        const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
        
        // 각 암호화폐의 7일간 일일 데이터 가져오기
        const dataPromises = symbols.map(async (symbol) => {
          const klineData = await binanceAPI.getKlineData(symbol, '1d', 7);
          return { symbol, data: klineData };
        });
        
        const results = await Promise.all(dataPromises);
        const newCryptoData: { [key: string]: KlineData[] } = {};
        
        results.forEach(({ symbol, data }) => {
          newCryptoData[symbol] = data;
        });
        
        setCryptoData(newCryptoData);
        console.log('바이낸스 데이터 로드 성공:', Object.keys(newCryptoData));
        
      } catch (err) {
        console.error('바이낸스 데이터 로드 실패:', err);
        setError('실시간 데이터를 불러올 수 없습니다. 네트워크를 확인해주세요.');
        
        // 에러 시 Mock 데이터 사용
        const mockData = {
          'BTCUSDT': generateMockKlineData(95000, 7),
          'ETHUSDT': generateMockKlineData(3500, 7),
          'BNBUSDT': generateMockKlineData(650, 7)
        };
        setCryptoData(mockData);
        
      } finally {
        setLoading(false);
      }
    };
    
    loadCryptoData();
    
    // 5분마다 데이터 업데이트
    const interval = setInterval(loadCryptoData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Mock 데이터 생성 함수
  const generateMockKlineData = (basePrice: number, days: number): KlineData[] => {
    const data: KlineData[] = [];
    let currentPrice = basePrice;
    
    for (let i = 0; i < days; i++) {
      const change = (Math.random() - 0.5) * 0.1; // ±5% 변동
      currentPrice = currentPrice * (1 + change);
      
      data.push({
        openTime: Date.now() - (days - i) * 24 * 60 * 60 * 1000,
        open: currentPrice * 0.98,
        high: currentPrice * 1.03,
        low: currentPrice * 0.97,
        close: currentPrice,
        volume: Math.random() * 1000000,
        closeTime: Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000,
        quoteAssetVolume: 0,
        numberOfTrades: 0,
        takerBuyBaseAssetVolume: 0,
        takerBuyQuoteAssetVolume: 0
      });
    }
    
    return data;
  };

  // 차트 생성
  useEffect(() => {
    if (!canvasRef.current || loading || Object.keys(cryptoData).length === 0) return;

    // 기존 차트 제거
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d')!;
    
    // 바이낸스 데이터로 차트 생성
    const btcData = cryptoData['BTCUSDT'] || [];
    const ethData = cryptoData['ETHUSDT'] || [];
    const bnbData = cryptoData['BNBUSDT'] || [];
    
    // 날짜 레이블 생성
    const labels = btcData.map(item => {
      const date = new Date(item.closeTime);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'BTC/USDT',
            data: btcData.map(item => item.close),
            borderColor: '#F7931A', // Bitcoin 오렌지
            backgroundColor: 'rgba(247, 147, 26, 0.1)',
            tension: 0.4,
            yAxisID: 'btc'
          },
          {
            label: 'ETH/USDT',
            data: ethData.map(item => item.close),
            borderColor: '#627EEA', // Ethereum 블루
            backgroundColor: 'rgba(98, 126, 234, 0.1)',
            tension: 0.4,
            yAxisID: 'eth'
          },
          {
            label: 'BNB/USDT',
            data: bnbData.map(item => item.close),
            borderColor: '#F3BA2F', // Binance 골드
            backgroundColor: 'rgba(243, 186, 47, 0.1)',
            tension: 0.4,
            yAxisID: 'bnb'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#E5E7EB' }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: $${value.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: '#374151' },
            ticks: { color: '#9CA3AF' }
          },
          btc: {
            type: 'linear',
            display: true,
            position: 'left',
            grid: { color: '#374151' },
            ticks: { 
              color: '#F7931A',
              callback: function(value) {
                return '$' + (value as number).toLocaleString();
              }
            },
            title: {
              display: true,
              text: 'BTC Price (USD)',
              color: '#F7931A'
            }
          },
          eth: {
            type: 'linear',
            display: false,
            position: 'right',
          },
          bnb: {
            type: 'linear',
            display: false,
            position: 'right',
          }
        }
      }
    });
    
    console.log('암호화폐 차트 생성 완료 - BTC, ETH, BNB');
    
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [cryptoData, loading]);

  if (loading) {
    return (
      <div style={{ 
        height: '300px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#9CA3AF' 
      }}>
        실시간 암호화폐 데이터 로딩 중...
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ 
        height: '300px', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#EF4444',
        textAlign: 'center'
      }}>
        <div>{error}</div>
        <div style={{ color: '#9CA3AF', fontSize: '0.875rem', marginTop: '8px' }}>
          Mock 데이터로 표시 중
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <canvas 
        ref={canvasRef}
        style={{ 
          height: '300px',
          maxHeight: '300px',
          maxWidth: '100%'
        }}
      />
      {!error && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          fontSize: '0.75rem',
          color: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          LIVE
        </div>
      )}
    </div>
  );
};

export default MajorIndicesChartJS;
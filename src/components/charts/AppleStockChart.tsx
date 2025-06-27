// 📈 Apple 주식 차트 - 모바일 최적화 버전
import React, { useRef, useEffect, useState } from 'react';
import Chart from 'chart.js/auto';

const AppleStockChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 모바일 환경 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || isInitialized) return;

    // 기존 차트 제거
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // 모바일에서는 더 안정적인 차트 생성 (지연 없음)
    const createChart = () => {
      const ctx = canvasRef.current!.getContext('2d')!;
      
      // 정적 HTML의 데이터와 동일
      const labels = ['09:30', '10:30', '11:30', '12:30', '13:30', '14:30', '15:30'];
      const data = [148.50, 149.20, 150.10, 149.80, 150.25, 150.60, 150.25];
      
      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'AAPL 주가',
            data: data,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: isMobile ? 2 : 3, // 모바일에서 포인트 크기 축소
            pointHoverRadius: isMobile ? 4 : 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: isMobile ? 0 : 750 // 모바일에서 애니메이션 비활성화
          },
          interaction: {
            intersect: false,
            mode: isMobile ? 'nearest' : 'index' // 모바일 터치 최적화
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: !isMobile // 모바일에서 툴팁 비활성화
            }
          },
          scales: {
            x: {
              grid: { 
                color: '#374151',
                display: !isMobile // 모바일에서 그리드 숨김
              },
              ticks: { 
                color: '#9CA3AF',
                maxTicksLimit: isMobile ? 4 : 7 // 모바일에서 틱 수 제한
              }
            },
            y: {
              grid: { 
                color: '#374151',
                display: !isMobile // 모바일에서 그리드 숨김
              },
              ticks: { 
                color: '#9CA3AF',
                maxTicksLimit: isMobile ? 4 : 6, // 모바일에서 틱 수 제한
                callback: function(value: any) {
                  return '$' + value.toFixed(2);
                }
              }
            }
          }
        }
      });
      
      setIsInitialized(true);
    };

    // 모바일에서는 즉시 생성, 데스크톱에서는 500ms 지연
    if (isMobile) {
      createChart();
    } else {
      const timer = setTimeout(createChart, 500);
      return () => clearTimeout(timer);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [isMobile]); // isMobile 상태 변화 시에만 재생성

  return (
    <canvas 
      ref={canvasRef}
      style={{ 
        height: isMobile ? '200px' : '180px', // 모바일에서 높이 증가
        maxHeight: isMobile ? '200px' : '180px',
        maxWidth: '100%',
        touchAction: 'none' // 모바일 터치 스크롤 방지
      }}
    />
  );
};

export default AppleStockChart;
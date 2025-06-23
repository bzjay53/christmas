// 📈 포트폴리오 성과 차트 - 정적 HTML 버전과 동일
import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

const PortfolioChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 기존 차트 제거
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // 정적 HTML과 동일한 차트 생성 (500ms 지연)
    const timer = setTimeout(() => {
      const ctx = canvasRef.current!.getContext('2d')!;
      
      chartRef.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['AAPL', 'MSFT', 'GOOGL', 'TSLA', '현금'],
          datasets: [{
            data: [35, 25, 20, 15, 5],
            backgroundColor: [
              '#10B981',
              '#3B82F6', 
              '#F59E0B',
              '#EF4444',
              '#6B7280'
            ],
            borderWidth: 2,
            borderColor: '#1e293b'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              top: 10,
              bottom: 10,
              left: 10,
              right: 10
            }
          },
          interaction: {
            intersect: false
          },
          animation: {
            animateRotate: false,
            animateScale: false
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { 
                color: '#E5E7EB',
                font: { size: 10 },
                padding: 6,
                usePointStyle: true,
                boxWidth: 12
              }
            }
          }
        }
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef}
      style={{ 
        height: '180px',
        maxHeight: '180px',
        maxWidth: '100%'
      }}
    />
  );
};

export default PortfolioChart;
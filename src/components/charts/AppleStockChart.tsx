// 📈 Apple 주식 차트 - 정적 HTML 버전과 동일
import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

const AppleStockChart: React.FC = () => {
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
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
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
                  return '$' + value.toFixed(2);
                }
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

export default AppleStockChart;
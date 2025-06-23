// 📊 거래량 차트 - 정적 HTML 버전과 동일
import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

const VolumeChart: React.FC = () => {
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
      const data = [1200000, 980000, 1500000, 1100000, 1350000, 1600000, 1800000];
      
      chartRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: '거래량',
            data: data,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: '#10B981',
            borderWidth: 1
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
                  return (value / 1000000).toFixed(1) + 'M';
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
        height: '120px',
        maxHeight: '120px',
        maxWidth: '100%'
      }}
    />
  );
};

export default VolumeChart;
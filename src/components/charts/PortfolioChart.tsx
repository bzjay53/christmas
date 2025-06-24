// 📈 포트폴리오 성과 차트 - 현대적이고 아름다운 그라데이션 디자인
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

    // 아름다운 현대적 차트 생성
    const timer = setTimeout(() => {
      const ctx = canvasRef.current!.getContext('2d')!;
      
      // 그라데이션 생성 함수
      const createGradient = (color1: string, color2: string) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        return gradient;
      };
      
      // 아름다운 그라데이션 색상들
      const gradients = [
        createGradient('#10B981', '#059669'), // AAPL - 에메랄드 그라데이션
        createGradient('#3B82F6', '#1D4ED8'), // MSFT - 블루 그라데이션  
        createGradient('#F59E0B', '#D97706'), // GOOGL - 골드 그라데이션
        createGradient('#EF4444', '#DC2626'), // TSLA - 레드 그라데이션
        createGradient('#8B5CF6', '#7C3AED')  // 현금 - 퍼플 그라데이션
      ];
      
      chartRef.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['🍎 AAPL', '🪟 MSFT', '🔍 GOOGL', '⚡ TSLA', '💰 현금'],
          datasets: [{
            data: [35, 25, 20, 15, 5],
            backgroundColor: gradients,
            borderWidth: 0, // 깔끔한 모던 룩을 위해 테두리 제거
            hoverBorderWidth: 3,
            hoverBorderColor: '#ffffff',
            hoverBackgroundColor: gradients.map(g => g), // 호버시 약간 밝게
            borderRadius: 8, // 모던한 둥근 모서리
            spacing: 2 // 섹션 간 간격
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              top: 20,
              bottom: 15,
              left: 15,
              right: 15
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          },
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1200,
            easing: 'easeInOutQuart'
          },
          plugins: {
            legend: {
              position: 'bottom' as const,
              labels: { 
                color: 'var(--text-secondary)',
                font: { 
                  size: 12
                },
                padding: 12,
                usePointStyle: true,
                pointStyle: 'circle' as const,
                boxWidth: 8,
                boxHeight: 8
              }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleColor: '#ffffff',
              bodyColor: '#e2e8f0',
              borderColor: '#eab308',
              borderWidth: 1,
              cornerRadius: 12,
              padding: 12,
              titleFont: {
                size: 14
              },
              bodyFont: {
                size: 13
              },
              callbacks: {
                label: function(context: any) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  return `${label}: ${value}% (₩${(value * 2000000).toLocaleString()})`;
                }
              }
            }
          },
          elements: {
            arc: {
              borderWidth: 0,
              hoverBorderWidth: 3
            }
          }
        }
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ 
      position: 'relative',
      height: '220px',
      padding: '10px',
      background: 'var(--bg-panel)',
      borderRadius: '12px',
      boxShadow: 'var(--card-shadow)',
      backdropFilter: 'blur(8px)'
    }}>
      <canvas 
        ref={canvasRef}
        style={{ 
          height: '100%',
          maxWidth: '100%',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
        }}
      />
    </div>
  );
};

export default PortfolioChart;
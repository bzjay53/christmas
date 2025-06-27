// 📊 거래량 차트 - 모바일 최적화 버전
import React, { useRef, useEffect, useState } from 'react';
import Chart from 'chart.js/auto';

const VolumeChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // 모바일 환경 감지 - 디바운스 적용
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkMobile = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth <= 768);
      }, 100); // 100ms 디바운스
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || isInitialized) return;

    // 기존 차트 제거
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // 모바일에서는 더 안정적인 차트 생성
    const createChart = () => {
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
            borderWidth: isMobile ? 0 : 1, // 모바일에서 테두리 제거
            borderRadius: isMobile ? 2 : 0, // 모바일에서 둥근 모서리
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          resizeDelay: isMobile ? 0 : 100, // 모바일에서 리사이즈 지연 제거
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
                maxTicksLimit: isMobile ? 3 : 5, // 모바일에서 틱 수 제한
                callback: function(value: any) {
                  return (value / 1000000).toFixed(1) + 'M';
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
        height: isMobile ? '230px' : '120px', // 모바일에서 높이 증가 (200px → 230px)
        maxHeight: isMobile ? '230px' : '120px',
        maxWidth: '100%',
        touchAction: 'none' // 모바일 터치 스크롤 방지
      }}
    />
  );
};

export default VolumeChart;
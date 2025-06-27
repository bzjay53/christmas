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
          // aspectRatio 제거 - maintainAspectRatio: false와 충돌 방지
          resizeDelay: isMobile ? 0 : 100, // 모바일에서 리사이즈 지연 제거
          layout: {
            padding: isMobile ? {
              top: 15,
              bottom: 50, // 하단 여백 대폭 증가 (35px → 50px)
              left: 45, // 좌측 여백 증가로 Y축 레이블 공간 확보 (20px → 45px)
              right: 15
            } : {
              top: 5,
              bottom: 5,
              left: 5,
              right: 5
            }
          },
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
                maxTicksLimit: isMobile ? 4 : 5, // 모바일에서 틱 수 적절히 조정
                padding: isMobile ? 8 : 4, // 모바일에서 Y축 레이블과 차트 간격 조정
                font: {
                  size: isMobile ? 11 : 12 // 모바일에서 폰트 크기 살짝 증가 (가독성)
                },
                callback: function(value: any) {
                  return (value / 1000000).toFixed(1) + 'M';
                },
                // Y축 레이블이 잘리지 않도록 여백 확보
                mirror: false,
                labelOffset: isMobile ? 0 : undefined
              },
              // 모바일에서 Y축 범위 명시적 설정
              min: 0,
              max: 1900000, // 최대값 약간 낮춰서 상단 여백 확보 (2000000 → 1900000)
              beginAtZero: true,
              // Y축 위치 조정
              position: 'left'
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
        height: isMobile ? '320px' : '120px', // 모바일에서 높이 최적화 (350px → 320px)
        maxHeight: isMobile ? '320px' : '120px',
        width: '100%',
        maxWidth: '100%',
        touchAction: 'none', // 모바일 터치 스크롤 방지
        display: 'block' // 캔버스 기본 display 명시
      }}
    />
  );
};

export default VolumeChart;
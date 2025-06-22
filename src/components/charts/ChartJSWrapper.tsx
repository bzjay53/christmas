// 📊 Chart.js Wrapper - static-test.html 패턴을 정확히 복사
import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';

// Chart.js 등록 (static-test와 동일한 설정)
ChartJS.register(...registerables);

// Chart.js 글로벌 테마 설정 (static-test.html과 동일)
ChartJS.defaults.color = '#E5E7EB';
ChartJS.defaults.backgroundColor = 'rgba(16, 185, 129, 0.1)';
ChartJS.defaults.borderColor = '#10B981';

interface ChartJSWrapperProps {
  type: 'line' | 'bar' | 'doughnut';
  data: any;
  options: any;
  height?: number;
  className?: string;
}

const ChartJSWrapper: React.FC<ChartJSWrapperProps> = ({
  type,
  data,
  options,
  height = 300,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 기존 차트 제거 (메모리 누수 방지)
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // static-test.html과 동일한 방식으로 차트 생성
    // 500ms 지연으로 DOM 준비 보장
    const timer = setTimeout(() => {
      try {
        chartRef.current = new ChartJS(canvasRef.current!, {
          type,
          data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            ...options
          }
        });

        console.log(`🎄 Chart.js ${type} chart created successfully`);
      } catch (error) {
        console.error('🎄 Chart.js creation failed:', error);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [type, data, options]);

  return (
    <div className={className} style={{ height: `${height}px` }}>
      <canvas 
        ref={canvasRef}
        style={{ 
          maxHeight: '100%',
          maxWidth: '100%'
        }}
      />
    </div>
  );
};

export default ChartJSWrapper;
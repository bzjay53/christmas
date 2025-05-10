/**
 * Christmas 프로젝트 - 대시보드 차트 모듈
 * Chart.js를 사용한 대시보드 차트 구현
 */

// 차트 색상 테마
const chartColors = {
  primary: '#4e73df',
  success: '#1cc88a',
  info: '#36b9cc',
  warning: '#f6c23e',
  danger: '#e74a3b',
  secondary: '#858796',
  light: '#f8f9fc',
  dark: '#5a5c69'
};

// 차트 공통 옵션
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          size: 12,
          family: "'Noto Sans KR', sans-serif"
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: {
        size: 14,
        family: "'Noto Sans KR', sans-serif"
      },
      bodyFont: {
        size: 13,
        family: "'Noto Sans KR', sans-serif"
      },
      padding: 10,
      cornerRadius: 4
    }
  }
};

/**
 * 수익률 차트 생성
 * @param {string} canvasId - 캔버스 요소 ID
 * @param {Array} data - 차트 데이터
 */
function createReturnsChart(canvasId, data = null) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  
  // 기본 데이터 (실제 구현에서는 서버에서 데이터를 가져옴)
  const defaultData = {
    labels: ['1일', '1주', '1개월', '3개월', '6개월', '1년'],
    datasets: [{
      label: '수익률',
      data: [1.2, 4.5, 7.8, 12.3, 18.7, 27.9],
      backgroundColor: chartColors.primary,
      borderColor: chartColors.primary,
      tension: 0.4
    }]
  };
  
  const chartData = data || defaultData;
  
  return new Chart(canvas, {
    type: 'line',
    data: chartData,
    options: {
      ...commonOptions,
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: (value) => `${value}%`
          }
        }
      },
      plugins: {
        ...commonOptions.plugins,
        title: {
          display: true,
          text: '기간별 수익률',
          font: {
            size: 16,
            family: "'Noto Sans KR', sans-serif"
          }
        }
      }
    }
  });
}

/**
 * 일일 거래량 차트 생성
 * @param {string} canvasId - 캔버스 요소 ID
 * @param {Array} data - 차트 데이터
 */
function createVolumeChart(canvasId, data = null) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  
  // 기본 데이터 (실제 구현에서는 서버에서 데이터를 가져옴)
  const defaultData = {
    labels: ['00시', '02시', '04시', '06시', '08시', '10시', '12시', '14시', '16시', '18시', '20시', '22시'],
    datasets: [{
      label: '거래량',
      data: [12, 19, 8, 5, 30, 45, 32, 37, 28, 15, 9, 3],
      backgroundColor: chartColors.info
    }]
  };
  
  const chartData = data || defaultData;
  
  return new Chart(canvas, {
    type: 'bar',
    data: chartData,
    options: {
      ...commonOptions,
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        ...commonOptions.plugins,
        title: {
          display: true,
          text: '시간대별 거래량',
          font: {
            size: 16,
            family: "'Noto Sans KR', sans-serif"
          }
        }
      }
    }
  });
}

/**
 * 전략별 수익 차트 생성
 * @param {string} canvasId - 캔버스 요소 ID
 * @param {Array} data - 차트 데이터
 */
function createStrategyPieChart(canvasId, data = null) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  
  // 기본 데이터 (실제 구현에서는 서버에서 데이터를 가져옴)
  const defaultData = {
    labels: ['RSI 기반', 'MACD 기반', '볼린저밴드', '이동평균선', '기타'],
    datasets: [{
      data: [42, 23, 15, 12, 8],
      backgroundColor: [
        chartColors.primary,
        chartColors.success,
        chartColors.info,
        chartColors.warning,
        chartColors.secondary
      ],
      borderWidth: 1
    }]
  };
  
  const chartData = data || defaultData;
  
  return new Chart(canvas, {
    type: 'pie',
    data: chartData,
    options: {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        title: {
          display: true,
          text: '전략별 수익 비중',
          font: {
            size: 16,
            family: "'Noto Sans KR', sans-serif"
          }
        }
      }
    }
  });
}

/**
 * 일별 승률 차트 생성
 * @param {string} canvasId - 캔버스 요소 ID
 * @param {Array} data - 차트 데이터
 */
function createWinRateChart(canvasId, data = null) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  
  // 일주일 날짜 레이블 생성
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    days.push(date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }));
  }
  
  // 기본 데이터 (실제 구현에서는 서버에서 데이터를 가져옴)
  const defaultData = {
    labels: days,
    datasets: [{
      label: '승률',
      data: [95, 100, 98, 97, 100, 99, 100],
      backgroundColor: chartColors.success,
      borderColor: chartColors.success,
      tension: 0.1
    }]
  };
  
  const chartData = data || defaultData;
  
  return new Chart(canvas, {
    type: 'line',
    data: chartData,
    options: {
      ...commonOptions,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`
          }
        }
      },
      plugins: {
        ...commonOptions.plugins,
        title: {
          display: true,
          text: '일별 승률',
          font: {
            size: 16,
            family: "'Noto Sans KR', sans-serif"
          }
        }
      }
    }
  });
}

// 모듈 내보내기
window.ChristmasCharts = {
  createReturnsChart,
  createVolumeChart,
  createStrategyPieChart,
  createWinRateChart
}; 
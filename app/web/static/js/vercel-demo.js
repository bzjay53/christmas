/**
 * Vercel 배포 데모 스크립트
 * 크리스마스 프로젝트 대시보드를 위한 샘플 데이터 시각화
 */

document.addEventListener('DOMContentLoaded', function() {
  // 앱이 로드되었음을 콘솔에 표시
  console.log('Vercel 배포 데모 앱이 로드되었습니다!');
  
  // 현재 시간 표시
  updateClock();
  setInterval(updateClock, 1000);
  
  // 샘플 차트 데이터
  createSampleChart();
  
  // 클릭 이벤트 리스너 추가
  document.getElementById('refresh-btn').addEventListener('click', function() {
    createSampleChart(true);
    showToast('데이터가 새로고침되었습니다.');
  });
});

/**
 * 시계 업데이트 함수
 */
function updateClock() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('ko-KR');
  document.getElementById('current-time').textContent = timeString;
}

/**
 * 샘플 차트 생성 함수
 */
function createSampleChart(refresh = false) {
  const ctx = document.getElementById('sample-chart').getContext('2d');
  
  // 랜덤 데이터 생성
  const data = {
    labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
    datasets: [{
      label: '수익률 (%)',
      data: Array.from({length: 6}, () => Math.floor(Math.random() * 30) - 5),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.4
    }]
  };
  
  // 차트 설정
  const config = {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      animation: {
        duration: refresh ? 1000 : 0
      },
      plugins: {
        title: {
          display: true,
          text: '월별 수익률 추이',
          font: {
            size: 16
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: '수익률 (%)'
          }
        }
      }
    }
  };
  
  // 기존 차트 제거 후 새로 생성
  if (window.sampleChart) {
    window.sampleChart.destroy();
  }
  
  window.sampleChart = new Chart(ctx, config);
}

/**
 * 토스트 메시지 표시 함수
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
} 
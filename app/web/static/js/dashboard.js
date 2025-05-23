/**
 * Christmas 프로젝트 - 대시보드 JavaScript
 * 대시보드 및 웹 인터페이스를 위한 클라이언트 사이드 스크립트
 */

// API 기본 URL
const API_BASE_URL = '/api/v1'; // 실제 API 서버 주소에 맞게 변경 필요

// DOM이 로드되면 실행
document.addEventListener('DOMContentLoaded', function() {
    // 툴팁 초기화
    initializeTooltips();
    
    // 초기 대시보드 데이터 로드
    loadDashboardData(); 

    // 대시보드 새로고침 버튼 이벤트
    const refreshButton = document.getElementById('refresh-dashboard');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            refreshDashboard();
        });
    }
    
    // 자동 새로고침 (1분 간격)
    setInterval(function() {
        if (document.visibilityState === 'visible') {
            loadDashboardData(false); // 알림 표시 없이 데이터 로드
        }
    }, 60000); // 1분

    // 새 주문 생성 처리
    const createOrderForm = document.getElementById('createOrderForm');
    if (createOrderForm) {
        createOrderForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const orderSymbol = document.getElementById('orderSymbol').value;
            const orderSide = document.getElementById('orderSide').value;
            const orderQuantity = parseFloat(document.getElementById('orderQuantity').value);
            const orderPriceInput = document.getElementById('orderPrice').value;
            const orderPrice = orderPriceInput ? parseFloat(orderPriceInput) : null;
            const orderIdInput = document.getElementById('orderId').value;
            const orderId = orderIdInput ? orderIdInput : uuidv4(); // ID가 없으면 UUID 생성

            const orderData = {
                id: orderId, // API 모델에 맞게 ID 전달
                symbol: orderSymbol,
                side: orderSide,
                quantity: orderQuantity,
                price: orderPrice,
                time: new Date().toISOString(), // API 모델에 time 필드가 필요하면 추가 (백엔드에서 설정할 수도 있음)
                status: 'pending' // 초기 상태 (백엔드에서 설정할 수도 있음)
            };

            try {
                const response = await fetchData(`${API_BASE_URL}/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // 'X-API-Key': 'YOUR_API_KEY' // 실제 API 키 필요 시 추가
                    },
                    body: JSON.stringify(orderData)
                });
                showNotification(`주문 생성 성공: ${response.id}`, 'success');
                // 모달 닫기
                const modalElement = document.getElementById('createOrderModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                }
                createOrderForm.reset(); // 폼 초기화
                loadDashboardData(); // 대시보드 새로고침
            } catch (error) {
                showNotification(`주문 생성 실패: ${error.message || '서버 오류'}`, 'danger');
            }
        });
    }
});

/**
 * 툴팁 초기화
 */
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * 대시보드 새로고침
 * @param {boolean} showAlert - 새로고침 알림 표시 여부
 */
async function refreshDashboard(showAlert = true) {
    const refreshButton = document.getElementById('refresh-dashboard');
    let originalContent = '';

    if (refreshButton) {
        originalContent = refreshButton.innerHTML;
        refreshButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 새로고침 중...';
        refreshButton.disabled = true;
    }

    try {
        await loadDashboardData(showAlert);
    } catch (error) {
        // loadDashboardData 내부에서 이미 오류 알림을 처리합니다.
        console.error("대시보드 새로고침 실패:", error);
    } finally {
        if (refreshButton) {
            refreshButton.innerHTML = originalContent;
            refreshButton.disabled = false;
        }
    }
}

/**
 * 알림 표시
 * @param {string} message - 알림 메시지
 * @param {string} type - 알림 유형 (success, danger, warning, info)
 * @param {number} duration - 알림 표시 시간 (밀리초)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // 기존 알림 컨테이너 확인 또는 생성
    let container = document.querySelector('.notifications-container');
    
    if (!container) {
        container = document.createElement('div');
        container.className = 'notifications-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1080';
        document.body.appendChild(container);
    }
    
    // 알림 요소 생성
    const notification = document.createElement('div');
    notification.className = `toast align-items-center text-white bg-${type} border-0`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    notification.setAttribute('aria-atomic', 'true');
    
    notification.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // 알림 컨테이너에 추가
    container.appendChild(notification);
    
    // 토스트 초기화 및 표시
    const toast = new bootstrap.Toast(notification, {
        autohide: true,
        delay: duration
    });
    
    toast.show();
    
    // 지정된 시간 후 자동으로 제거
    setTimeout(() => {
        notification.remove();
    }, duration + 500);
}

/**
 * 숫자 포맷팅 (천 단위 구분)
 * @param {number} num - 포맷팅할 숫자
 * @param {boolean} currency - 통화 기호 표시 여부
 * @returns {string} 포맷팅된 문자열
 */
function formatNumber(num, currency = false) {
    const formatted = new Intl.NumberFormat('ko-KR').format(num);
    return currency ? `${formatted}원` : formatted;
}

/**
 * AJAX 요청 유틸리티
 * @param {string} url - 요청 URL
 * @param {Object} options - fetch 옵션
 * @returns {Promise} fetch 응답 Promise
 */
async function fetchData(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        showNotification(`데이터 로드 중 오류가 발생했습니다: ${error.message}`, 'danger');
        throw error;
    }
}

/**
 * 페이지 요소 업데이트 유틸리티
 * @param {string} selector - 업데이트할 요소 선택자
 * @param {any} value - 새 값
 * @param {Function} formatter - 값 포맷팅 함수 (옵션)
 */
function updateElement(selector, value, formatter = null) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = formatter ? formatter(value) : value;
    }
}

/**
 * 로딩 스피너 표시/숨김
 * @param {string} containerId - 컨테이너 ID
 * @param {boolean} show - 표시 여부
 */
function toggleLoading(containerId, show) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (show) {
        // 기존 콘텐츠 저장
        container.dataset.originalContent = container.innerHTML;
        
        // 로딩 스피너 표시
        container.innerHTML = `
            <div class="d-flex justify-content-center align-items-center h-100">
                <div class="loading-spinner"></div>
            </div>
        `;
    } else if (container.dataset.originalContent) {
        // 원래 콘텐츠로 복원
        container.innerHTML = container.dataset.originalContent;
        delete container.dataset.originalContent;
    }
}

/**
 * 대시보드 데이터 로드 및 UI 업데이트
 * @param {boolean} showAlert - 알림 표시 여부
 */
async function loadDashboardData(showAlert = true) {
    toggleLoading('dashboard-content', true); // 로딩 시작
    try {
        const data = await fetchData(`${API_BASE_URL}/dashboard`);
        
        // 데이터 업데이트
        updateElement('#last-update-time', new Date(data.last_update).toLocaleString('ko-KR'));
        updateElement('#total-profit', data.total_profit, (val) => formatNumber(val, true));
        updateElement('#profit-change', `${data.profit_change > 0 ? '+' : ''}${data.profit_change.toFixed(1)}%`);
        if(document.querySelector('#profit-change')){
            document.querySelector('#profit-change').classList.toggle('text-success', data.profit_change > 0);
            document.querySelector('#profit-change').classList.toggle('text-danger', data.profit_change <= 0);
        }
        updateElement('#total-orders-today', data.total_orders, formatNumber);
        updateElement('#success-rate-today', `${(data.success_rate * 100).toFixed(1)}%`);
        updateElement('#active-positions-count', data.active_positions_count, formatNumber);
        updateElement('#avg-holding-time', data.avg_holding_time);
        updateElement('#total-alerts-today', data.total_alerts, formatNumber);
        updateElement('#critical-alerts-count', data.critical_alerts, formatNumber);
        updateElement('#warning-alerts-count', data.warning_alerts, formatNumber);

        // 최근 주문 목록 업데이트
        const recentOrdersTableBody = document.querySelector('#recent-orders-table tbody');
        if (recentOrdersTableBody) {
            recentOrdersTableBody.innerHTML = ''; // 기존 내용 삭제
            if (data.recent_orders && data.recent_orders.length > 0) {
                data.recent_orders.forEach(order => {
                    const row = recentOrdersTableBody.insertRow();
                    const statusBadgeColor = getStatusBadgeColor(order.status);
                    row.innerHTML = `
                        <td>${order.symbol}</td>
                        <td>${new Date(order.time).toLocaleString('ko-KR')}</td>
                        <td class="${order.side === 'buy' ? 'text-success' : 'text-danger'}">${order.side === 'buy' ? '매수' : '매도'}</td>
                        <td>${formatNumber(order.price, true)}</td>
                        <td>${order.quantity}</td>
                        <td><span class="badge bg-${statusBadgeColor}">${order.status}</span></td>
                        <td></td> // 작업 버튼 영역
                    `;
                    // 작업 버튼 추가
                    const actionCell = row.cells[6];
                    if (isOrderCancellable(order.status)) { // 취소 가능한 상태일 때만 버튼 표시
                        const cancelButton = document.createElement('button');
                        cancelButton.className = 'btn btn-sm btn-outline-danger';
                        cancelButton.textContent = '취소';
                        cancelButton.onclick = () => handleCancelOrder(order.id);
                        actionCell.appendChild(cancelButton);
                    }
                });
            } else {
                recentOrdersTableBody.innerHTML = '<tr><td colspan="7" class="text-center">최근 주문 내역이 없습니다.</td></tr>';
            }
        }

        // 현재 포지션 목록 업데이트
        const currentPositionsTableBody = document.querySelector('#current-positions-table tbody');
        if (currentPositionsTableBody) {
            currentPositionsTableBody.innerHTML = ''; // 기존 내용 삭제
            if (data.current_positions && data.current_positions.length > 0) {
                data.current_positions.forEach(pos => {
                    const row = currentPositionsTableBody.insertRow();
                    row.innerHTML = `
                        <td>${pos.symbol}</td>
                        <td>${pos.quantity}</td>
                        <td>${formatNumber(pos.entry_price, true)}</td>
                        <td>${formatNumber(pos.current_price, true)}</td>
                        <td class="${pos.profit >= 0 ? 'text-success' : 'text-danger'}">${formatNumber(pos.profit, true)} (${pos.profit_percent.toFixed(2)}%)</td>
                    `;
                });
            } else {
                currentPositionsTableBody.innerHTML = '<tr><td colspan="5" class="text-center">현재 보유 포지션이 없습니다.</td></tr>';
            }
        }
        
        // 성과 추이 차트, 전략 성과 차트 업데이트
        updatePerformanceChart(data.performance_trend);
        updateStrategyPerformanceChart(data.strategy_performance);

        if (showAlert) {
            showNotification('대시보드 데이터가 업데이트되었습니다.', 'success');
        }

    } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error);
        if (showAlert) {
            // fetchData 내부에서 이미 알림을 띄우므로, 여기서는 추가적인 사용자 친화적 메시지 또는 복구 로직을 고려할 수 있습니다.
            // showNotification('대시보드 데이터를 가져오는 데 실패했습니다. 잠시 후 다시 시도해주세요.', 'danger');
        }
    } finally {
        toggleLoading('dashboard-content', false); // 로딩 완료
    }
}

/**
 * 성과 추이 차트 업데이트 (Chart.js)
 * @param {Array} trendData - 성과 추이 데이터 배열 (예: [{date: 'YYYY-MM-DD', profit: 100}, ...])
 */
let performanceChartInstance = null;
function updatePerformanceChart(trendData) {
    const ctx = document.getElementById('performanceChart')?.getContext('2d');
    if (!ctx) return;

    const labels = trendData.map(item => item.date);
    const dataPoints = trendData.map(item => item.profit);

    if (performanceChartInstance) {
        performanceChartInstance.data.labels = labels;
        performanceChartInstance.data.datasets[0].data = dataPoints;
        performanceChartInstance.update();
    } else {
        performanceChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '일일 수익',
                    data: dataPoints,
                    backgroundColor: 'rgba(77, 196, 240, 0.2)',
                    borderColor: 'rgba(77, 196, 240, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

/**
 * 전략 성과 차트 업데이트 (Chart.js)
 * @param {Array} strategyData - 전략 성과 데이터 배열 (예: [{name: 'Strategy A', profit: 200, win_rate: 0.7}, ...])
 */
let strategyPerformanceChartInstance = null;
function updateStrategyPerformanceChart(strategyData) {
    const ctx = document.getElementById('strategyPerformanceChart')?.getContext('2d');
    if (!ctx) return;

    const labels = strategyData.map(item => item.name);
    const profitData = strategyData.map(item => item.profit);
    // 필요하다면 win_rate 등 다른 데이터를 차트에 추가할 수 있습니다.
    // 예: const winRateData = strategyData.map(item => item.win_rate * 100);

    if (strategyPerformanceChartInstance) {
        strategyPerformanceChartInstance.data.labels = labels;
        strategyPerformanceChartInstance.data.datasets[0].data = profitData;
        // strategyPerformanceChartInstance.data.datasets[1].data = winRateData; // 필요시 추가
        strategyPerformanceChartInstance.update();
    } else {
        strategyPerformanceChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '전략별 수익',
                    data: profitData,
                    backgroundColor: [
                        'rgba(67, 97, 238, 0.7)',
                        'rgba(72, 149, 239, 0.7)',
                        'rgba(77, 196, 240, 0.7)',
                        'rgba(118, 226, 240, 0.7)',
                        'rgba(162, 240, 228, 0.7)'
                    ],
                    borderColor: [
                        'rgba(67, 97, 238, 1)',
                        'rgba(72, 149, 239, 1)',
                        'rgba(77, 196, 240, 1)',
                        'rgba(118, 226, 240, 1)',
                        'rgba(162, 240, 228, 1)'
                    ],
                    borderWidth: 1
                }
                // 필요시 다른 데이터셋 추가 (예: 승률)
                // {
                //     label: '승률 (%)',
                //     data: winRateData,
                //     type: 'line', // 막대와 선 혼합 차트
                //     borderColor: 'rgba(255, 99, 132, 1)',
                //     backgroundColor: 'rgba(255, 99, 132, 0.2)',
                //     yAxisID: 'y1', // 다른 Y축 사용시
                // }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '수익 (원)'
                        }
                    }
                    // 필요시 다른 Y축 설정
                    // y1: {
                    //     type: 'linear',
                    //     display: true,
                    //     position: 'right',
                    //     title: {
                    //         display: true,
                    //         text: '승률 (%)'
                    //     },
                    //     grid: {
                    //         drawOnChartArea: false, // only want the grid lines for one axis to show up
                    //     },
                    // }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += formatNumber(context.parsed.y, true); // 통화 포맷 적용
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
}

/**
 * 주문 상태에 따른 배지 색상 반환
 * @param {string} status - 주문 상태
 * @returns {string} Bootstrap 배경색 클래스
 */
function getStatusBadgeColor(status) {
    switch (status.toLowerCase()) {
        case 'filled': return 'success';
        case 'pending':
        case 'accepted': return 'warning';
        case 'cancelled':
        case 'rejected':
        case 'expired': return 'danger';
        default: return 'secondary';
    }
}

/**
 * 주문이 취소 가능한 상태인지 확인
 * @param {string} status - 주문 상태
 * @returns {boolean} 취소 가능 여부
 */
function isOrderCancellable(status) {
    const cancellableStates = ['pending', 'accepted', 'partially_filled']; // 실제 API에서 정의된 취소 가능 상태에 따라 수정
    return cancellableStates.includes(status.toLowerCase());
}

/**
 * UUID v4 생성기 (브라우저 호환용)
 */
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 주문 취소 처리
 * @param {string} orderId - 취소할 주문 ID
 */
async function handleCancelOrder(orderId) {
    if (!confirm(`주문 ID [${orderId}]을(를) 정말로 취소하시겠습니까?`)) {
        return;
    }

    try {
        await fetchData(`${API_BASE_URL}/orders/${orderId}`, {
            method: 'DELETE',
            headers: {
                // 'X-API-Key': 'YOUR_API_KEY' // 실제 API 키 필요 시 추가
            }
        });
        showNotification(`주문 [${orderId}] 취소 요청 성공`, 'success');
        loadDashboardData(); // 대시보드 새로고침
    } catch (error) {
        showNotification(`주문 [${orderId}] 취소 실패: ${error.message || '서버 오류'}`, 'danger');
    }
} 
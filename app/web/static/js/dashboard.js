/**
 * Christmas 프로젝트 - 대시보드 JavaScript
 * 대시보드 및 웹 인터페이스를 위한 클라이언트 사이드 스크립트
 */

// DOM이 로드되면 실행
document.addEventListener('DOMContentLoaded', function() {
    // 툴팁 초기화
    initializeTooltips();
    
    // 대시보드 새로고침 버튼 이벤트
    const refreshButton = document.getElementById('refresh-dashboard');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            refreshDashboard();
        });
    }
    
    // 자동 새로고침 (5분 간격)
    setInterval(function() {
        if (document.visibilityState === 'visible') {
            refreshDashboard(false); // 알림 표시 없이 새로고침
        }
    }, 300000); // 5분
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
function refreshDashboard(showAlert = true) {
    // 새로고침 버튼 스피너 표시
    const refreshButton = document.getElementById('refresh-dashboard');
    if (refreshButton) {
        const originalContent = refreshButton.innerHTML;
        refreshButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 새로고침 중...';
        refreshButton.disabled = true;
        
        // 실제 구현에서는 AJAX 요청을 통해 데이터 새로고침
        // 여기서는 페이지 새로고침으로 대체
        setTimeout(function() {
            window.location.reload();
        }, 500);
        
        // 실패 시 원래 상태로 복구 (실제 구현 시)
        // setTimeout(function() {
        //     refreshButton.innerHTML = originalContent;
        //     refreshButton.disabled = false;
        //     if (showAlert) {
        //         showNotification('대시보드가 새로고침되었습니다.', 'success');
        //     }
        // }, 2000);
    } else {
        // 버튼이 없으면 바로 새로고침
        window.location.reload();
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
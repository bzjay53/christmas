/**
 * Christmas 프로젝트 - 메인 페이지 자바스크립트
 */

document.addEventListener('DOMContentLoaded', function() {
    // 페이지 로드 완료 시 실행
    console.log('Christmas 메인 페이지가 로드되었습니다.');
    
    // 베타 테스트 배지 효과
    const betaBadge = document.querySelector('.beta-badge');
    if (betaBadge) {
        betaBadge.addEventListener('mouseover', function() {
            this.style.transform = 'scale(1.1)';
        });
        betaBadge.addEventListener('mouseout', function() {
            this.style.transform = 'scale(1)';
        });
    }
    
    // 기능 항목 애니메이션
    const featureItems = document.querySelectorAll('.feature-item');
    if (featureItems.length > 0) {
        featureItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('visible');
            }, 100 * index);
        });
    }
    
    // 피드백 버튼 강조
    const feedbackButton = document.querySelector('a[href="/feedback.html"]');
    if (feedbackButton) {
        setInterval(() => {
            feedbackButton.classList.toggle('pulse');
        }, 2000);
    }
});

// 현재 날짜 표시
function updateCurrentDate() {
    const footerDate = document.querySelector('footer p:last-child');
    if (footerDate) {
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        footerDate.textContent = `최종 업데이트: ${dateStr}`;
    }
}

// 페이지가 완전히 로드된 후 실행
window.onload = function() {
    updateCurrentDate();
}; 
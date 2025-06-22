import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

console.log('🎄 [STEP 1] Christmas Trading App 시작');
console.log('🎄 [STEP 2] React 버전:', React.version);

// DOM이 완전히 로드될 때까지 대기
function initApp() {
  console.log('🎄 [STEP 3] DOM 상태:', document.readyState);
  
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('🎄 ❌ Root element 없음!');
      showError('Root element를 찾을 수 없습니다.');
      return;
    }
    
    console.log('🎄 [STEP 4] Root element 발견:', rootElement);
    console.log('🎄 [STEP 5] React Root 생성 중...');
    
    const root = createRoot(rootElement);
    
    console.log('🎄 [STEP 6] App 컴포넌트 렌더링 중...');
    root.render(React.createElement(App));
    
    console.log('🎄 [STEP 7] ✅ React 앱 마운트 완료!');
  } catch (error) {
    console.error('🎄 ❌ React 마운트 실패:', error);
    showError(`React 앱 로딩 실패: ${error}`);
  }
}

function showError(message: string) {
  const rootEl = document.getElementById('root') || document.body;
  rootEl.innerHTML = `
    <div style="
      padding: 30px; 
      color: white; 
      background: linear-gradient(135deg, #1f2937, #374151); 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    ">
      <h1 style="color: #EF4444; margin-bottom: 20px; font-size: 2.5rem;">
        🎄 Christmas Trading Dashboard
      </h1>
      <div style="
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid #EF4444;
        border-radius: 12px;
        padding: 20px;
        max-width: 600px;
        margin-bottom: 20px;
      ">
        <h2 style="color: #EF4444; margin-bottom: 15px;">로딩 오류 발생</h2>
        <p style="margin-bottom: 15px; line-height: 1.6;">${message}</p>
        <p style="font-size: 0.9rem; color: #94A3B8;">
          브라우저 개발자 도구(F12)에서 콘솔을 확인해주세요.
        </p>
      </div>
      <div>
        <button onclick="window.location.reload()" style="
          background: #10B981;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin-right: 15px;
          font-size: 1rem;
        ">새로고침</button>
        <button onclick="window.location.href='/debug.html'" style="
          background: #6366F1;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
        ">진단 페이지</button>
      </div>
    </div>
  `;
}

// DOM 로드 완료 시 앱 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

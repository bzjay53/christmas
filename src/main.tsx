import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import AppSimple from './AppSimple'

// 디버깅을 위한 강화된 로깅
console.log('🎄 Christmas Trading App 시작');
console.log('🎄 DOM 상태:', document.readyState);
console.log('🎄 Root 엘리먼트 찾기...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root 엘리먼트를 찾을 수 없습니다!');
  document.body.innerHTML = '<h1 style="color: red;">ERROR: Root element not found!</h1>';
} else {
  console.log('✅ Root 엘리먼트 발견:', rootElement);
  
  try {
    const root = createRoot(rootElement);
    console.log('🎄 React Root 생성 완료');
    
    console.log('🎄 App 컴포넌트 렌더링 시작...');
    // 디버깅을 위해 간단한 AppSimple 컴포넌트 사용
    root.render(<AppSimple />);
    console.log('🎄 ✅ React 앱 마운트 완료!');
    
    // 추가 검증
    setTimeout(() => {
      const content = rootElement.innerHTML;
      console.log('🎄 렌더링된 콘텐츠 길이:', content.length);
      console.log('🎄 앱이 정상적으로 렌더링됨:', content.includes('Binance Dashboard'));
    }, 1000);
    
  } catch (error) {
    console.error('❌ React 앱 초기화 실패:', error);
    document.body.innerHTML = `<h1 style="color: red;">React App Error: ${error}</h1>`;
  }
}

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

console.log('🎄 Christmas Trading App 시작');

// 즉시 앱 초기화 - 최대한 단순하게
const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);

console.log('🎄 App 컴포넌트 렌더링...');
root.render(<App />);

console.log('🎄 ✅ React 앱 마운트 완료!');

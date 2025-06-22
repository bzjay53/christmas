import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('🎄 Christmas Trading: main.tsx loaded');
console.log('🎄 DOM ready state:', document.readyState);
console.log('🎄 Root element:', document.getElementById('root'));

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('🎄 ERROR: Root element not found!');
    throw new Error('Root element not found');
  }
  
  console.log('🎄 Creating React root...');
  const root = createRoot(rootElement);
  
  console.log('🎄 Rendering App...');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  
  console.log('🎄 React app should be mounted successfully!');
} catch (error) {
  console.error('🎄 FATAL ERROR mounting React app:', error);
  // Fallback display
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="padding: 20px; color: red; font-family: monospace;">
        <h1>🎄 Christmas Trading - Error</h1>
        <p>Failed to load React application: ${error}</p>
        <p>Check browser console for details.</p>
      </div>
    `;
  }
}

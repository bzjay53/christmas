import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
import App from './App.tsx'

console.log('🎄 Christmas Trading App starting...')

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found')
  }
  
  console.log('Root element found, mounting React app...')
  
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  
  console.log('React app mounted successfully')
} catch (error) {
  console.error('Failed to mount React app:', error)
  document.body.innerHTML = `
    <div style="padding: 20px; color: white; background: #1f2937; font-family: Arial;">
      <h1>🎄 Christmas Trading Dashboard</h1>
      <p>Failed to load application</p>
      <p>Error: ${error}</p>
    </div>
  `
}

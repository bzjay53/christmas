import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  // Mixed Content 문제 해결: 프로덕션에서는 API 프록시 사용
  const apiBaseUrl = mode === 'development' 
    ? 'http://localhost:8000'  // 개발: 직접 백엔드 연결
    : '/api/proxy'             // 프로덕션: Netlify Functions 프록시 사용
  
  console.log('🔧 Vite Config Debug:', {
    mode,
    command,
    apiBaseUrl,
    note: mode === 'production' ? 'Using Netlify Functions Proxy' : 'Direct backend connection'
  })
  
  return {
    plugins: [react()],
    base: '/',
    server: {
      port: 3000,
      host: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            mui: ['@mui/material', '@mui/icons-material'],
            charts: ['recharts']
          }
        }
      }
    },
    define: {
      'process.env': process.env,
      // API 프록시 사용을 위한 환경 변수 설정
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl)
    },
    esbuild: {
      charset: 'utf8'
    }
  }
}) 
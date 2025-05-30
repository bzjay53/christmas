import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  // Netlify 환경에서 환경 변수 직접 접근
  const apiBaseUrl = process.env.VITE_API_BASE_URL || env.VITE_API_BASE_URL || 'http://31.220.83.213'
  
  console.log('🔧 Vite Config Debug:', {
    mode,
    command,
    apiBaseUrl,
    processEnv: process.env.VITE_API_BASE_URL,
    loadedEnv: env.VITE_API_BASE_URL
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
      // 환경 변수를 직접 설정
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl)
    },
    esbuild: {
      charset: 'utf8'
    }
  }
}) 
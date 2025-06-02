import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  // 🚨 Nginx 프록시를 통한 백엔드 연결 (80번 포트)
  const apiBaseUrl = 'http://31.220.83.213'  // Nginx 프록시 사용
  
  console.log('🔧 Vite Config Debug:', {
    mode,
    command,
    apiBaseUrl,
    note: 'Nginx 프록시를 통한 백엔드 연결 (80번 포트)'
  })
  
  return {
    plugins: [react()],
    base: '/',
    server: {
      port: 3000,
      host: true,
      // 개발 환경에서 CORS 문제 해결
      proxy: mode === 'development' ? {
        '/api': {
          target: 'http://31.220.83.213',  // Nginx 프록시 사용
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      } : undefined
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
      'process.env': {
        VITE_API_BASE_URL: JSON.stringify(apiBaseUrl),
        VITE_SUPABASE_URL: JSON.stringify(env.VITE_SUPABASE_URL),
        VITE_SUPABASE_ANON_KEY: JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
      }
    }
  }
}) 
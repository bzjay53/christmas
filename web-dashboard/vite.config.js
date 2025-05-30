import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  // 🚨 임시 해결책: Mixed Content 문제로 인해 임시로 백엔드 직접 연결
  // TODO: 백엔드 HTTPS 적용 후 프록시로 변경
  const apiBaseUrl = 'http://31.220.83.213:8000'  // 임시로 모든 환경에서 직접 연결
  
  console.log('🔧 Vite Config Debug:', {
    mode,
    command,
    apiBaseUrl,
    note: '임시로 백엔드 직접 연결 - Mixed Content 문제 해결 중'
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
          target: 'http://31.220.83.213:8000',
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
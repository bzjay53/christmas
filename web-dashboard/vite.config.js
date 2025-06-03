import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  // 🚨 API 기본 URL 설정
  let apiBaseUrl;
  if (mode === 'production') {
    apiBaseUrl = '/api/proxy'; // Netlify 프록시 사용
    console.log('🔧 Vite Config: Production mode - Using Netlify proxy for API calls.');
  } else {
    // 개발 환경: Nginx 프록시 또는 직접 백엔드 URL
    apiBaseUrl = env.VITE_DEV_API_URL || 'http://31.220.83.213'; // 환경 변수 또는 기본값
    console.log(`🔧 Vite Config: Development mode - API Base URL: ${apiBaseUrl}`);
  }
  
  console.log('🔧 Vite Config Debug:', {
    mode,
    command,
    apiBaseUrl,
    note: mode === 'production' ? 'Using Netlify Proxy' : 'Using direct backend or dev proxy'
  })
  
  return {
    plugins: [react()],
    base: '/',
    server: {
      port: 3000,
      host: true,
      // 개발 환경에서 CORS 문제 해결
      proxy: mode === 'development' ? {
        // 로컬 개발 시 /api로 시작하는 모든 요청을 target으로 프록시
        // VITE_API_BASE_URL이 /api/proxy 형태가 아니므로, 이 설정은 직접적인 영향을 주지 않음
        // 대신, 클라이언트 측에서 apiBaseUrl을 사용하여 요청을 구성해야 함.
        // 만약 개발 중에도 /api/proxy 와 같은 경로를 쓰고 싶다면, 그에 맞게 설정 필요.
        '/api_dev_proxy': { // 개발용 프록시 경로 예시 (필요시 사용)
          target: env.VITE_DEV_API_URL || 'http://31.220.83.213', 
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api_dev_proxy/, '')
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
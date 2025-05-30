import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
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
      // 프로덕션 환경에서 명시적으로 API URL 설정
      'import.meta.env.VITE_API_BASE_URL': mode === 'production' 
        ? '"http://31.220.83.213:8000"' 
        : `"${env.VITE_API_BASE_URL || 'http://31.220.83.213:8000'}"`
    },
    esbuild: {
      charset: 'utf8'
    }
  }
}) 
// Christmas Trading - Production Server
// Node.js Express 서버 (정적 파일 서빙 + API 프록시)

const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://christmas-backend:8080';

// 정적 파일 서빙 설정
app.use(express.static(path.join(__dirname, 'dist')));

// API 프록시 설정 (백엔드로 라우팅)
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  logLevel: 'warn'
}));

// WebSocket 프록시
app.use('/ws', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  ws: true,
  logLevel: 'warn'
}));

// SPA 라우팅 (React Router 지원)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'christmas-trading-frontend'
  });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎄 Christmas Trading Frontend Server running on port ${PORT}`);
  console.log(`🔗 Backend URL: ${BACKEND_URL}`);
});
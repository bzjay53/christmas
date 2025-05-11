/**
 * Christmas RAG 웹 인터페이스 서버
 * 
 * RAG API와 통신하는 Express.js 웹 서버
 */

const express = require('express');
const path = require('path');
const axios = require('axios');

// 익스프레스 앱 초기화
const app = express();
const port = process.env.PORT || 3010;

// RAG API URL 설정
const RAG_API_URL = process.env.RAG_API_URL || 'http://localhost:8000';

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'rag')));
app.use(express.json());

// 루트 라우트 - 메인 페이지 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'rag', 'index.html'));
});

// API 상태 확인
app.get('/api/status', async (req, res) => {
  try {
    const response = await axios.get(`${RAG_API_URL}/status`);
    res.json(response.data);
  } catch (error) {
    console.error('API 상태 확인 중 오류:', error.message);
    res.status(500).json({
      error: 'API 서버 연결 실패',
      message: error.message
    });
  }
});

// 문서 색인 요청
app.post('/api/index', async (req, res) => {
  try {
    const { directory, file_extensions } = req.body;
    
    const response = await axios.post(`${RAG_API_URL}/index`, {
      directory,
      file_extensions
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('문서 색인 중 오류:', error.message);
    res.status(500).json({
      error: '문서 색인 실패',
      message: error.message
    });
  }
});

// 질의 처리
app.post('/api/query', async (req, res) => {
  try {
    const { query, max_chunks, min_score } = req.body;
    
    const response = await axios.post(`${RAG_API_URL}/query`, {
      query,
      max_chunks: max_chunks || 5,
      min_score: min_score || 0.7
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('질의 처리 중 오류:', error.message);
    
    // API 서버가 404를 반환한 경우 - 문서를 찾을 수 없음
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        error: '관련 문서를 찾을 수 없습니다.',
        message: '검색어를 수정하거나 더 많은 문서를 색인해 보세요.'
      });
    }
    
    res.status(500).json({
      error: '질의 처리 실패',
      message: error.message
    });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`Christmas RAG 웹 인터페이스가 http://localhost:${port} 에서 실행 중입니다.`);
}); 
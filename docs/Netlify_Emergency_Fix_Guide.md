# 🚨 Netlify 긴급 수정 가이드 (2025-05-27)

## 📋 현재 문제 상황

### 🔴 Critical Issues
1. **백엔드 연결 실패**: `http://31.220.83.213` (포트 8000 누락)
2. **데이터베이스 에러**: `column ai_learning_data.strategy_type does not exist`

### 🎯 해결 목표
- 프론트엔드 → 백엔드 연결 복구
- 데이터베이스 스키마 수정
- 사용자 대시보드 정상 작동

## 🚀 즉시 실행 가이드

### 1단계: Netlify 환경변수 수정 (5분)

#### 📱 Netlify 대시보드 접속
1. **URL**: https://app.netlify.com/
2. **사이트 선택**: Christmas Trading (christmas-protocol.netlify.app)
3. **Site settings** → **Environment variables**

#### 🔧 긴급 수정할 환경변수

| 변수명 | 현재 값 | 수정할 값 |
|--------|---------|-----------|
| `VITE_API_BASE_URL` | `http://31.220.83.213` | `http://31.220.83.213:8000` |

#### 📝 추가할 환경변수 (복사해서 붙여넣기)
```env
VITE_API_BASE_URL=http://31.220.83.213:8000
VITE_API_TIMEOUT=30000
VITE_NODE_ENV=production
VITE_APP_NAME=Christmas Trading
VITE_APP_VERSION=2.0.0
VITE_ENABLE_DEV_TOOLS=false
VITE_DEBUG_MODE=false
```

#### 🔄 재배포 실행
1. **Deploys** 탭 이동
2. **Trigger deploy** → **Deploy site**
3. 배포 완료 대기 (2-3분)

### 2단계: 데이터베이스 스키마 수정 (3분)

#### 📊 Supabase 대시보드 접속
1. **URL**: https://supabase.com/dashboard/project/qehzzsxzjijfzqkysazc
2. **SQL Editor** 메뉴 선택

#### 🔧 실행할 SQL 스크립트
```sql
-- 🚨 긴급 수정: strategy_type 컬럼 추가
ALTER TABLE ai_learning_data 
ADD COLUMN IF NOT EXISTS strategy_type VARCHAR(50) DEFAULT 'traditional';

-- 기존 NULL 데이터 업데이트
UPDATE ai_learning_data 
SET strategy_type = 'traditional' 
WHERE strategy_type IS NULL;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_strategy_type 
ON ai_learning_data(strategy_type);

-- 성공 확인
SELECT 'strategy_type 컬럼 추가 완료! 🎉' as message;
```

#### ✅ 실행 방법
1. 위 SQL을 복사
2. Supabase SQL Editor에 붙여넣기
3. **Run** 버튼 클릭
4. 성공 메시지 확인

### 3단계: 연결 테스트 (2분)

#### 🧪 테스트 절차
1. **프론트엔드 접속**: https://christmas-protocol.netlify.app
2. **개발자 도구 열기** (F12)
3. **Network 탭** 확인
4. **로그인 시도**
5. **API 요청 확인**:
   - URL: `http://31.220.83.213:8000/api/...`
   - 응답: 200 OK

#### ✅ 성공 기준
- [ ] 로그인 성공
- [ ] "백엔드 연결 성공" 메시지
- [ ] 대시보드 데이터 로딩
- [ ] "strategy_type" 에러 사라짐

## 🔧 문제 해결 체크리스트

### ✅ Netlify 환경변수 확인
- [ ] `VITE_API_BASE_URL=http://31.220.83.213:8000` (포트 포함)
- [ ] 재배포 완료
- [ ] 배포 로그에서 환경변수 적용 확인

### ✅ 데이터베이스 스키마 확인
- [ ] `ai_learning_data` 테이블에 `strategy_type` 컬럼 존재
- [ ] 기본값 'traditional' 설정
- [ ] 인덱스 생성 완료

### ✅ 백엔드 서버 확인
- [ ] 서버 상태: http://31.220.83.213:8000/health
- [ ] API 응답: http://31.220.83.213:8000/api/health
- [ ] CORS 설정 정상

## 🚨 응급 연락처

### 📞 문제 발생 시
1. **백엔드 서버 다운**: SSH로 서버 재시작
2. **데이터베이스 연결 실패**: Supabase 상태 확인
3. **Netlify 배포 실패**: 빌드 로그 확인

### 🔄 롤백 절차
```bash
# 백엔드 서버 재시작
ssh root@31.220.83.213
cd /root/christmas-trading
docker-compose restart

# 프론트엔드 롤백
# Netlify에서 이전 배포 버전으로 롤백
```

## 📊 모니터링

### 🎯 실시간 확인 방법
1. **프론트엔드**: https://christmas-protocol.netlify.app
2. **백엔드 헬스체크**: http://31.220.83.213:8000/health
3. **API 테스트**: http://31.220.83.213:8000/api/health

### 📈 성공 지표
- 로그인 성공률: 100%
- API 응답 시간: < 2초
- 에러 발생률: 0%

---
**⏰ 예상 소요 시간**: 10분  
**🎯 우선순위**: Critical  
**👤 담당자**: PM AI Assistant  
**📅 작성일**: 2025-05-27 00:30 
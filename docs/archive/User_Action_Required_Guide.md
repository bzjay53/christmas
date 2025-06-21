# 🚨 사용자 긴급 액션 가이드 (2025-05-27)

## 📋 현재 상황 요약

**Dry Run 테스트 결과**: 
- ✅ 로컬 파일들 모두 존재
- ❌ **SUPABASE_SERVICE_KEY 플레이스홀더 값** (주요 원인)
- ❌ 백엔드 서버 완전 무응답
- ❌ Supabase 연결 401 권한 오류

## 🎯 사용자가 수행해야 할 작업

### 1단계: Supabase Service Role Key 확인 (5분)

#### 📊 Supabase 대시보드 접속
1. **URL**: https://supabase.com/dashboard/project/qehzzsxzjijfzqkysazc
2. **Settings** → **API** 메뉴 선택
3. **Service Role Key** 복사

#### 🔑 Service Role Key 위치
```
Project API keys
├── anon public (이미 설정됨)
└── service_role (이것이 필요함) ⭐
```

### 2단계: 서버 SSH 접속 및 환경변수 수정 (10분)

#### 🖥️ SSH 접속
```bash
ssh root@31.220.83.213
```

#### 📁 프로젝트 디렉토리 이동
```bash
cd /root/christmas-trading
pwd
# 결과: /root/christmas-trading
```

#### 🔧 환경변수 파일 수정
```bash
# 현재 환경변수 확인
cat backend/.env | grep SUPABASE_SERVICE_KEY

# 환경변수 파일 편집
nano backend/.env
```

#### ✏️ 수정할 내용
```bash
# 기존 (플레이스홀더)
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# 수정 후 (실제 값)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.실제_서비스_롤_키_값
```

### 3단계: Git 동기화 (3분)

#### 📥 최신 코드 가져오기
```bash
# Git 상태 확인
git status

# 최신 코드 가져오기
git pull origin main

# 변경사항 확인
git log --oneline -3
```

### 4단계: Docker 서비스 복구 (5분)

#### 🐳 Docker 상태 확인
```bash
# 현재 컨테이너 상태
docker ps -a

# Docker Compose 상태
docker-compose ps
```

#### 🔄 서비스 재시작
```bash
# 기존 컨테이너 정리
docker-compose down

# 새로운 컨테이너 시작
docker-compose up -d --build

# 로그 확인
docker-compose logs -f christmas-backend
```

### 5단계: 연결 테스트 (2분)

#### 🧪 서버 응답 테스트
```bash
# 로컬 테스트
curl http://localhost:8000/health

# 외부 접근 테스트
curl http://31.220.83.213:8000/health
```

#### ✅ 성공 기준
```json
{
  "status": "healthy",
  "timestamp": "2025-05-27T...",
  "database": "connected"
}
```

## 📊 데이터베이스 스키마 수정

### Supabase SQL Editor에서 실행

#### 🔗 접속 정보
- **URL**: https://supabase.com/dashboard/project/qehzzsxzjijfzqkysazc
- **메뉴**: SQL Editor

#### 📝 실행할 SQL
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
SELECT 'strategy_type column added successfully!' as message;
```

## 🌐 Netlify 환경변수 수정

### 프론트엔드 API URL 수정

#### 📱 Netlify 대시보드 접속
1. **URL**: https://app.netlify.com/
2. **사이트**: Christmas Trading (christmas-protocol.netlify.app)
3. **Site settings** → **Environment variables**

#### 🔧 수정할 환경변수
| 변수명 | 현재 값 | 수정할 값 |
|--------|---------|-----------|
| `VITE_API_BASE_URL` | `http://31.220.83.213` | `http://31.220.83.213:8000` |

#### 🔄 재배포
1. **Deploys** 탭 이동
2. **Trigger deploy** → **Deploy site**
3. 배포 완료 대기 (2-3분)

## 📋 전체 작업 체크리스트

### ✅ 서버 복구 체크리스트
- [ ] Supabase Service Role Key 확인
- [ ] SSH 접속 성공
- [ ] 환경변수 파일 수정
- [ ] Git 최신 코드 동기화
- [ ] Docker 컨테이너 재시작
- [ ] 서버 응답 테스트 성공

### ✅ 데이터베이스 수정 체크리스트
- [ ] Supabase SQL Editor 접속
- [ ] strategy_type 컬럼 추가 SQL 실행
- [ ] 성공 메시지 확인

### ✅ 프론트엔드 수정 체크리스트
- [ ] Netlify 환경변수 수정
- [ ] 재배포 실행
- [ ] 배포 완료 확인

## 🧪 최종 테스트

### 연결 테스트 순서
1. **백엔드 서버**: http://31.220.83.213:8000/health
2. **프론트엔드**: https://christmas-protocol.netlify.app
3. **로그인 테스트**: 실제 사용자 계정으로 로그인
4. **대시보드 확인**: 데이터 로딩 및 에러 메시지 확인

### 성공 기준
- [ ] 백엔드 서버 200 OK 응답
- [ ] 프론트엔드 로그인 성공
- [ ] 대시보드 데이터 로딩
- [ ] "strategy_type" 에러 사라짐
- [ ] API 연결 안정성 확인

## 🚨 문제 발생 시 대응

### 백엔드 서버가 여전히 응답하지 않는 경우
```bash
# Docker 로그 확인
docker-compose logs christmas-backend

# 환경변수 재확인
cat backend/.env | grep SUPABASE

# 포트 확인
netstat -tlnp | grep :8000

# 방화벽 확인
ufw status
```

### 데이터베이스 연결 실패 시
```bash
# Supabase 연결 테스트
curl -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
     "https://qehzzsxzjijfzqkysazc.supabase.co/rest/v1/users?select=*&limit=1"
```

## ⏰ 예상 소요 시간

- **총 소요 시간**: 25분
- **서버 작업**: 18분
- **데이터베이스 작업**: 3분
- **프론트엔드 작업**: 4분

---
**📅 작성일**: 2025-05-27 01:00  
**👤 작성자**: PM AI Assistant  
**🎯 우선순위**: Critical  
**�� 지원**: 실시간 모니터링 중 
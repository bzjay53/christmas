# 🚨 긴급 서버 복구 가이드 (2025-05-27)

## 📋 현재 상황 분석

### 🔴 Critical Issues
1. **백엔드 서버 무응답**: `http://31.220.83.213:8000` 타임아웃
2. **프론트엔드 연결 실패**: API 요청 모두 실패
3. **데이터베이스 스키마 문제**: `strategy_type` 컬럼 누락

### 🎯 긴급 복구 목표
- 백엔드 서버 즉시 복구
- 프론트엔드-백엔드 연결 복원
- 데이터베이스 스키마 수정

## 🚀 즉시 실행 가이드

### 1단계: 서버 SSH 접속 및 상태 확인 (2분)

```bash
# SSH 접속
ssh root@31.220.83.213

# 현재 디렉토리 확인
pwd
# 예상 결과: /root

# Christmas Trading 디렉토리로 이동
cd /root/christmas-trading

# Docker 컨테이너 상태 확인
docker ps -a

# Docker Compose 상태 확인
docker-compose ps
```

### 2단계: Docker 서비스 복구 (3분)

```bash
# 기존 컨테이너 정리
docker-compose down

# 컨테이너 강제 제거 (필요시)
docker container prune -f

# 이미지 재빌드 및 시작
docker-compose up -d --build

# 로그 확인
docker-compose logs -f christmas-backend
```

### 3단계: 포트 및 네트워크 확인 (1분)

```bash
# 포트 8000 사용 상태 확인
netstat -tlnp | grep :8000

# 방화벽 상태 확인
ufw status

# 포트 8000 열기 (필요시)
ufw allow 8000
```

### 4단계: 환경변수 확인 및 수정 (2분)

```bash
# 환경변수 파일 확인
cat backend/.env

# Supabase Service Key 확인
grep SUPABASE_SERVICE_KEY backend/.env

# 필요시 환경변수 수정
nano backend/.env
```

### 5단계: 서비스 재시작 및 테스트 (2분)

```bash
# 서비스 재시작
docker-compose restart

# 헬스체크 테스트
curl http://localhost:8000/health

# API 테스트
curl http://localhost:8000/api/health

# 외부 접근 테스트
curl http://31.220.83.213:8000/health
```

## 🔧 문제별 해결 방안

### 🐳 Docker 컨테이너 문제

#### 컨테이너가 시작되지 않는 경우
```bash
# 로그 확인
docker-compose logs christmas-backend

# 이미지 재빌드
docker-compose build --no-cache christmas-backend

# 강제 재시작
docker-compose up -d --force-recreate
```

#### 포트 충돌 문제
```bash
# 포트 8000 사용 프로세스 확인
lsof -i :8000

# 프로세스 종료 (PID 확인 후)
kill -9 <PID>

# Docker 네트워크 재설정
docker network prune -f
```

### 🗄️ 데이터베이스 연결 문제

#### Supabase 연결 실패
```bash
# 환경변수 확인
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_KEY

# 연결 테스트
curl -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
     "$SUPABASE_URL/rest/v1/users?select=*&limit=1"
```

### 🌐 네트워크 문제

#### 방화벽 설정
```bash
# UFW 상태 확인
ufw status verbose

# 포트 8000 허용
ufw allow 8000/tcp

# 방화벽 재시작
ufw reload
```

#### Nginx 프록시 문제
```bash
# Nginx 상태 확인
systemctl status nginx

# Nginx 설정 테스트
nginx -t

# Nginx 재시작
systemctl restart nginx
```

## 📊 데이터베이스 스키마 수정

### Supabase SQL 실행
```sql
-- 🚨 긴급 수정: strategy_type 컬럼 추가
ALTER TABLE ai_learning_data 
ADD COLUMN IF NOT EXISTS strategy_type VARCHAR(50) DEFAULT 'traditional';

-- 기존 NULL 데이터 업데이트
UPDATE ai_learning_data 
SET strategy_type = 'traditional' 
WHERE strategy_type IS NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_strategy_type 
ON ai_learning_data(strategy_type);

-- 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ai_learning_data' 
AND column_name = 'strategy_type';
```

## 🧪 복구 확인 체크리스트

### ✅ 서버 상태 확인
- [ ] SSH 접속 성공
- [ ] Docker 컨테이너 실행 중
- [ ] 포트 8000 리스닝
- [ ] 로그에 에러 없음

### ✅ API 연결 확인
- [ ] `curl http://localhost:8000/health` 응답 200
- [ ] `curl http://31.220.83.213:8000/health` 응답 200
- [ ] API 엔드포인트 정상 작동

### ✅ 데이터베이스 확인
- [ ] Supabase 연결 성공
- [ ] `strategy_type` 컬럼 존재
- [ ] 쿼리 정상 실행

### ✅ 프론트엔드 연결 확인
- [ ] Netlify 환경변수 업데이트
- [ ] 재배포 완료
- [ ] 로그인 성공
- [ ] 대시보드 데이터 로딩

## 🚨 응급 연락처

### 📞 서버 문제 발생 시
1. **Docker 서비스 재시작**: `docker-compose restart`
2. **전체 시스템 재부팅**: `reboot`
3. **Contabo 콘솔 접속**: https://my.contabo.com/

### 🔄 롤백 절차
```bash
# 이전 버전으로 롤백
git log --oneline -5
git checkout <previous-commit-hash>
docker-compose up -d --build

# 안정 버전으로 복구
git checkout main
git pull origin main
docker-compose up -d --build
```

## 📈 모니터링 설정

### 🎯 실시간 모니터링
```bash
# 서버 리소스 모니터링
htop

# Docker 컨테이너 모니터링
docker stats

# 로그 실시간 확인
docker-compose logs -f
```

### 📊 성능 지표
- CPU 사용률: < 70%
- 메모리 사용률: < 80%
- 디스크 사용률: < 90%
- 응답 시간: < 2초

---
**⏰ 예상 복구 시간**: 10분  
**🎯 우선순위**: Critical  
**👤 담당자**: PM AI Assistant  
**📅 작성일**: 2025-05-27 00:35 
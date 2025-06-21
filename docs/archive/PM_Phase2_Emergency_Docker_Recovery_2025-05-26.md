# 🚨 PM Phase 2 긴급 상황 - Docker 컨테이너 충돌 및 환경변수 이슈 (2025-05-26 20:45)

## 📋 현재 상황 요약

### 🔴 Critical Issue 발견
**문제**: Docker 컨테이너 이름 충돌 및 환경변수 누락
**위치**: 31.220.83.213 백엔드 서버
**영향**: 백엔드 서비스 완전 중단

### 🔍 근본 원인 분석

#### 1. Docker 컨테이너 충돌
```bash
Error: Conflict. The container name "/christmas-backend" is already in use
Container ID: ca6cb0044f0e4d23eee70b9dcd6577f7ba6ea20e37f349fdf57277cb7bde0052
```

#### 2. 환경변수 누락 경고
```bash
WARN: The "KIS_API_KEY" variable is not set. Defaulting to a blank string.
WARN: The "KIS_API_SECRET" variable is not set. Defaulting to a blank string.
WARN: The "OPENAI_API_KEY" variable is not set. Defaulting to a blank string.
```

#### 3. 핵심 문제점
- **SUPABASE_SERVICE_KEY**: `your-supabase-service-role-key` (플레이스홀더 값)
- **KIS API 키들**: 환경변수명 불일치 (`KIS_API_KEY` vs `KIS_DEMO_APP_KEY`)
- **OPENAI_API_KEY**: 완전 누락

## 🎯 해결 방안 (4단계)

### Phase 2A: Docker 컨테이너 정리 (5분)
**우선순위**: Critical
**담당**: PM 즉시 실행

#### Step 1: 기존 컨테이너 강제 제거
```bash
# 1. 실행 중인 컨테이너 확인
docker ps -a | grep christmas

# 2. 충돌 컨테이너 강제 제거
docker rm -f christmas-backend

# 3. 모든 Christmas 관련 컨테이너 정리
docker rm -f $(docker ps -aq --filter "name=christmas")

# 4. 사용하지 않는 이미지 정리
docker image prune -f
```

### Phase 2B: 환경변수 수정 (10분)
**우선순위**: Critical
**담당**: PM + 사용자 (Supabase 키 확인)

#### Step 1: .env 파일 수정 필요 항목
```bash
# 수정 필요한 환경변수들
SUPABASE_SERVICE_KEY=실제_서비스_롤_키
KIS_API_KEY=DEMO-your-demo-app-key  # KIS_DEMO_APP_KEY와 동일값
KIS_API_SECRET=your-demo-app-secret  # KIS_DEMO_APP_SECRET과 동일값
OPENAI_API_KEY=sk-proj-your-openai-key
```

### Phase 2C: Docker 재시작 (5분)
**우선순위**: High
**담당**: PM 자동화

#### Step 1: 안전한 재시작 절차
```bash
# 1. 네트워크 정리
docker network prune -f

# 2. 볼륨 확인 (데이터 보존)
docker volume ls | grep christmas

# 3. 새로운 빌드 및 시작
docker-compose up -d --build --force-recreate
```

### Phase 2D: 서비스 검증 (5분)
**우선순위**: High
**담당**: PM 자동화

## 📊 WBS 업데이트

### Phase 1: 긴급 시스템 복구 (100% 완료) ✅
- ✅ 프론트엔드 Supabase URL 수정
- ✅ CORS 에러 해결
- ✅ 기본 로그인 기능 복구

### Phase 2: 백엔드 서버 복구 (진행 중)
- 🔄 Docker 컨테이너 충돌 해결 (진행 예정)
- 🔄 환경변수 설정 수정 (진행 예정)
- 🔄 Supabase Service Key 업데이트 (사용자 액션 필요)
- 🔄 서비스 재시작 및 검증 (진행 예정)

### Phase 3: 데이터베이스 스키마 수정 (대기 중)
- ⏳ ai_learning_data.strategy_type 컬럼 추가
- ⏳ ai_strategy_performance.strategy_type 컬럼 추가

## 🔑 사용자 액션 필요 (5분)

### 1. Supabase Service Role Key 확인
1. **Supabase Dashboard 접속**: https://supabase.com/dashboard
2. **Christmas Trading 프로젝트 선택**
3. **Settings → API 메뉴**
4. **Service Role Key 복사** (secret 키)

### 2. 환경변수 업데이트 지시
```bash
# 31.220.83.213 서버에서 실행
cd /root/christmas-trading/backend
nano .env

# 다음 라인 수정:
SUPABASE_SERVICE_KEY=실제_복사한_서비스_롤_키
```

## 🚀 PM 즉시 실행 계획

### 🔧 Docker 정리 스크립트 생성
1. **컨테이너 충돌 해결 스크립트**
2. **환경변수 검증 스크립트**
3. **서비스 재시작 스크립트**

### 📊 모니터링 및 검증
1. **백엔드 Health Check**
2. **프론트엔드 연결 테스트**
3. **데이터베이스 연결 확인**

## 📈 성공 지표

### ✅ Phase 2 완료 기준
1. **Docker**: 모든 컨테이너 정상 실행
2. **환경변수**: 모든 필수 키 설정 완료
3. **백엔드**: Health Check 응답 성공
4. **프론트엔드**: "백엔드 연결됨" 상태 표시
5. **데이터베이스**: Supabase 연결 성공

## 🕐 예상 소요 시간

### 단계별 시간 배분
- **Docker 정리**: 5분 (PM 실행)
- **환경변수 수정**: 10분 (사용자 + PM)
- **서비스 재시작**: 5분 (PM 실행)
- **검증 및 테스트**: 5분 (PM 실행)
- **총 예상 시간**: 25분

## 📞 다음 단계 예고

### Phase 3: 데이터베이스 스키마 수정 (예상 15분)
1. **Supabase SQL 실행**: fix-supabase-schema.sql
2. **스키마 검증**: strategy_type 컬럼 확인
3. **전체 시스템 테스트**: 모든 페이지 데이터 로드 확인

### Phase 4: 비즈니스 로직 복원 (예상 2시간)
1. **쿠폰 시스템**: 할인 코드, 사용 제한, 유효기간
2. **리퍼럴 시스템**: 초대 코드, 보상 지급, 무료 기간 연장
3. **회원 등급**: 무료/프리미엄/라이프타임, 거래 제한
4. **수수료 시스템**: 등급별 수수료율, 계산 로직

---
**📅 최종 업데이트**: 2025-05-26 20:45  
**👤 작성자**: PM AI Assistant  
**🔄 버전**: v1.0  
**📊 상태**: Phase 2 긴급 복구 진행 중  
**📞 담당자**: PM (Docker 정리) + 사용자 (Supabase 키) 
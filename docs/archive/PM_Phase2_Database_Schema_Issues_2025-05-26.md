# 🚨 PM Phase 2 분석 - 데이터베이스 스키마 및 UI 이슈 (2025-05-26 20:15)

## 📋 현재 상황 요약

### ✅ 성공적 복구 완료
- **프론트엔드**: Supabase URL 수정으로 CORS 에러 해결
- **백엔드 연결**: 정상 복구 (우측 상단 메시지는 일시적 지연)
- **로그인 기능**: 정상 작동

### 🔴 새로 발견된 Critical Issues

#### 1. 데이터베이스 스키마 누락
**에러**: `column ai_learning_data.strategy_type does not exist`
**영향**: 모든 페이지에서 데이터 로드 실패
**근본 원인**: Supabase 테이블에 `strategy_type` 컬럼 누락

#### 2. UI 가시성 문제
**문제**: 요금제 페이지에서 글자색과 배경색 동일
**영향**: 사용자가 플랜 내용을 읽을 수 없음
**근본 원인**: 다크모드 CSS 스타일링 오류

#### 3. 백엔드 연결 상태 표시
**문제**: "백엔드 연결 끊김" 메시지 표시
**원인**: WebSocket 연결 지연 또는 Health Check 실패

## 🎯 해결 방안 (3단계)

### Phase 2A: 데이터베이스 스키마 수정 (15분)
**우선순위**: Critical
**담당**: PM + 사용자 (Supabase 접근)

#### Step 1: 누락된 컬럼 추가
```sql
-- Supabase SQL Editor에서 실행
ALTER TABLE ai_learning_data 
ADD COLUMN IF NOT EXISTS strategy_type VARCHAR(50) DEFAULT 'traditional';

ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS strategy_type VARCHAR(50) DEFAULT 'traditional';

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_strategy_type 
ON ai_learning_data(strategy_type);

CREATE INDEX IF NOT EXISTS idx_ai_strategy_performance_strategy_type 
ON ai_strategy_performance(strategy_type);
```

### Phase 2B: UI 스타일링 수정 (10분)
**우선순위**: High
**담당**: PM 즉시 실행

#### Step 1: 요금제 페이지 CSS 수정
- 다크모드에서 텍스트 가시성 개선
- 대비율 증가로 접근성 향상

#### Step 2: 백엔드 연결 상태 개선
- Health Check 로직 최적화
- 연결 상태 표시 개선

### Phase 2C: 백엔드 서버 최종 점검 (5분)
**우선순위**: Medium
**담당**: PM 자동화

## 📊 WBS 업데이트

### Phase 1: 긴급 시스템 복구 (100% 완료) ✅
- ✅ 프론트엔드 Supabase URL 수정
- ✅ CORS 에러 해결
- ✅ 기본 로그인 기능 복구

### Phase 2: 데이터베이스 및 UI 최적화 (0% → 진행 중)
- 🔄 데이터베이스 스키마 수정 (진행 예정)
- 🔄 UI 가시성 문제 해결 (진행 예정)
- 🔄 백엔드 연결 상태 최적화 (진행 예정)

### Phase 3: 비즈니스 로직 복원 (대기 중)
- ⏳ 쿠폰 시스템 복원
- ⏳ 리퍼럴 시스템 복원
- ⏳ 회원 등급 시스템 복원

## 🔍 근본 원인 분석

### 1. 데이터베이스 스키마 불일치
**문제**: 로컬 개발 환경과 Supabase 프로덕션 환경 간 스키마 차이
**원인**: MongoDB → Supabase 마이그레이션 시 일부 컬럼 누락
**해결**: 완전한 스키마 동기화 필요

### 2. 프론트엔드 코드와 DB 스키마 불일치
**문제**: 코드에서 존재하지 않는 컬럼 참조
**파일**: `web-dashboard/src/lib/supabase.js:527` (strategy_type 사용)
**해결**: 스키마 업데이트 후 코드 검증

### 3. CSS 다크모드 스타일링 미완성
**문제**: 요금제 페이지 텍스트 가시성
**원인**: 다크모드 전환 시 색상 대비 부족
**해결**: CSS 스타일 수정 필요

## 🚀 즉시 실행 계획

### 🔑 사용자 액션 필요 (5분)
1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - Christmas Trading 프로젝트 선택
   - SQL Editor 열기

2. **스키마 수정 SQL 실행**
   ```sql
   ALTER TABLE ai_learning_data 
   ADD COLUMN IF NOT EXISTS strategy_type VARCHAR(50) DEFAULT 'traditional';
   
   ALTER TABLE ai_strategy_performance 
   ADD COLUMN IF NOT EXISTS strategy_type VARCHAR(50) DEFAULT 'traditional';
   ```

### 🔧 PM 액션 (10분)
1. **UI 스타일링 수정**
   - 요금제 페이지 CSS 개선
   - 다크모드 텍스트 가시성 향상

2. **백엔드 연결 상태 최적화**
   - Health Check 로직 개선
   - 연결 상태 표시 업데이트

## 📈 성공 지표

### ✅ Phase 2 완료 기준
1. **데이터베이스**: 모든 페이지에서 데이터 로드 성공
2. **UI**: 요금제 페이지 텍스트 완전 가시
3. **연결 상태**: "백엔드 연결 끊김" 메시지 해결
4. **기능**: Analytics, 포트폴리오, 신호 등 모든 메뉴 정상 작동

## 🕐 예상 소요 시간

### 단계별 시간 배분
- **스키마 수정**: 5분 (사용자 액션)
- **UI 수정**: 10분 (PM 실행)
- **테스트 및 검증**: 5분
- **배포**: 5분
- **총 예상 시간**: 25분

## 📞 다음 단계 예고

### Phase 3: 비즈니스 로직 복원 (예상 2시간)
1. **쿠폰 시스템**: 할인 코드, 사용 제한, 유효기간
2. **리퍼럴 시스템**: 초대 코드, 보상 지급, 무료 기간 연장
3. **회원 등급**: 무료/프리미엄/라이프타임, 거래 제한
4. **수수료 시스템**: 등급별 수수료율, 계산 로직

---
**📅 최종 업데이트**: 2025-05-26 20:15  
**👤 작성자**: PM AI Assistant  
**🔄 버전**: v1.0  
**📊 상태**: Phase 2 진행 중  
**📞 담당자**: PM (UI 수정) + 사용자 (DB 스키마) 
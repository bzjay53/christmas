# 🗺️ Christmas Trading 프로젝트 문서 맵

## 📋 프로젝트 개요
- **프로젝트명**: Christmas Trading Platform
- **기술 스택**: React + Node.js + Supabase (PostgreSQL)
- **배포 환경**: 
  - 프론트엔드: Netlify (https://christmas-protocol.netlify.app/)
  - 백엔드: 31.220.83.213 Docker 서비스

## 📚 문서 카테고리별 분류

### 🎯 1. 프로젝트 관리 (PM) 문서
- `docs/PM_Current_Status_Phase1_Complete.md` - 현재 상황 분석 및 액션 플랜
- `docs/PM_Step1_Supabase_Tables_Creation.md` - Supabase 테이블 생성 가이드
- `docs/WBS_Christmas_Trading_Migration.md` - 마이그레이션 WBS
- `docs/PM_Project_Documentation_Map.md` - 이 문서 (문서 맵)

### 🏗️ 2. 아키텍처 및 설계 문서
- `docs/Project_Architecture.md` - 시스템 아키텍처
- `docs/Database_Schema.md` - 데이터베이스 스키마
- `docs/API_Documentation.md` - API 명세서
- **[생성 예정]** `docs/System_Architecture_Diagram.md` - 시스템 구조도
- **[생성 예정]** `docs/Data_Flow_Diagram.md` - 데이터 플로우 다이어그램

### 🔧 3. 개발 및 운영 문서
- **[생성 예정]** `docs/Development_Guidelines.md` - 개발 가이드라인
- **[생성 예정]** `docs/Code_Quality_Standards.md` - 코드 품질 표준
- **[생성 예정]** `docs/Dependency_Management.md` - 의존성 관리
- **[생성 예정]** `docs/Environment_Setup.md` - 환경 설정 가이드

### 🧪 4. 테스트 및 품질 보증
- **[생성 예정]** `docs/Testing_Strategy.md` - 테스트 전략
- **[생성 예정]** `docs/Test_Cases.md` - 테스트 케이스
- **[생성 예정]** `docs/Quality_Assurance.md` - 품질 보증 체크리스트

### 🚀 5. CI/CD 및 배포
- **[생성 예정]** `docs/CICD_Pipeline.md` - CI/CD 파이프라인
- **[생성 예정]** `docs/Deployment_Guide.md` - 배포 가이드
- **[생성 예정]** `docs/Docker_Configuration.md` - Docker 설정

### 🔒 6. 보안 및 성능
- **[생성 예정]** `docs/Security_Guidelines.md` - 보안 가이드라인
- **[생성 예정]** `docs/Performance_Optimization.md` - 성능 최적화
- **[생성 예정]** `docs/Security_Checklist.md` - 보안 체크리스트

### 👥 7. 팀 협업 및 프로세스
- **[생성 예정]** `docs/Team_Collaboration_Guide.md` - 팀 협업 가이드
- **[생성 예정]** `docs/Git_Workflow.md` - Git 워크플로우
- **[생성 예정]** `docs/Code_Review_Process.md` - 코드 리뷰 프로세스

### 📖 8. 지식 베이스 (RAG)
- **[생성 예정]** `docs/RAG_Knowledge_Base.md` - 프로젝트 지식 베이스
- **[생성 예정]** `docs/Technical_References.md` - 기술 참조 문서
- **[생성 예정]** `docs/Troubleshooting_Guide.md` - 문제 해결 가이드

### 🔄 9. 리팩토링 및 개선
- **[생성 예정]** `docs/Refactoring_Plan.md` - 리팩토링 계획
- **[생성 예정]** `docs/Technical_Debt.md` - 기술 부채 관리
- **[생성 예정]** `docs/Improvement_Roadmap.md` - 개선 로드맵

## 📁 스크립트 및 도구
- `scripts/create-supabase-tables.sql` - Supabase 테이블 생성
- `scripts/restart-backend-server.ps1` - 백엔드 서버 재시작
- `scripts/test-backend-status.ps1` - 백엔드 상태 테스트
- `scripts/validate-environment-en.ps1` - 환경변수 검증

## 🎯 현재 진행 상황 (Phase 1)

### ✅ 완료된 작업
1. **환경변수 설정**: SUPABASE_SERVICE_KEY 업데이트 완료
2. **프론트엔드**: Netlify 배포 안정적 운영
3. **백엔드**: Docker 컨테이너 구성 완료
4. **기본 문서**: 아키텍처, 스키마, API 문서 생성

### 🔄 현재 진행 중
1. **Supabase 테이블 생성**: 사용자가 수동으로 실행 필요
2. **백엔드 서버 재시작**: 31.220.83.213 서버 Docker 재시작
3. **API 검증**: Health Check 및 Signup API 테스트

### ⏳ 다음 단계 (Phase 2)
1. **필수 문서 11개 생성**: 개발 가이드라인부터 팀 협업까지
2. **비즈니스 로직 복원**: 쿠폰, 리퍼럴, 회원등급 시스템
3. **품질 보증 체계**: 테스트 자동화 및 CI/CD 구축

## 📊 문서 생성 우선순위

### 🔥 최우선 (Phase 2 시작 전 필수)
1. `docs/RAG_Knowledge_Base.md` - 프로젝트 지식 베이스
2. `docs/Development_Guidelines.md` - 개발 가이드라인
3. `docs/Code_Quality_Standards.md` - 코드 품질 표준
4. `docs/Testing_Strategy.md` - 테스트 전략

### ⚡ 긴급 (Phase 2 초기)
5. `docs/Security_Guidelines.md` - 보안 가이드라인
6. `docs/CICD_Pipeline.md` - CI/CD 파이프라인
7. `docs/Team_Collaboration_Guide.md` - 팀 협업 가이드
8. `docs/Dependency_Management.md` - 의존성 관리

### 📊 중요 (Phase 2 중기)
9. `docs/Performance_Optimization.md` - 성능 최적화
10. `docs/Refactoring_Plan.md` - 리팩토링 계획
11. `docs/Technical_References.md` - 기술 참조 문서

## 🔗 문서 간 연관관계

```
PM_Current_Status_Phase1_Complete.md
├── WBS_Christmas_Trading_Migration.md
├── PM_Step1_Supabase_Tables_Creation.md
└── PM_Project_Documentation_Map.md (이 문서)

Project_Architecture.md
├── Database_Schema.md
├── API_Documentation.md
└── System_Architecture_Diagram.md

Development_Guidelines.md
├── Code_Quality_Standards.md
├── Testing_Strategy.md
└── Team_Collaboration_Guide.md
```

## 📝 문서 작성 가이드라인

### 1. 문서 구조
- **제목**: 명확하고 구체적인 제목
- **개요**: 문서의 목적과 범위
- **상세 내용**: 단계별, 카테고리별 정리
- **예제**: 실제 사용 가능한 코드/명령어
- **체크리스트**: 확인 사항 및 검증 방법

### 2. 문서 품질 기준
- **정확성**: 최신 정보 반영
- **완성도**: 실행 가능한 수준의 상세함
- **일관성**: 용어 및 형식 통일
- **접근성**: 팀원 누구나 이해 가능

### 3. 문서 업데이트 주기
- **PM 문서**: 매일 업데이트
- **기술 문서**: 주요 변경 시 업데이트
- **가이드라인**: 월 1회 검토 및 업데이트

---
**PM 노트**: 이 문서 맵은 프로젝트의 모든 문서를 체계적으로 관리하기 위한 마스터 인덱스입니다. 새로운 문서 생성 시 반드시 이 맵을 업데이트해야 합니다. 
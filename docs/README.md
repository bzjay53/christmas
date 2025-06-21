# Christmas Trading - AI 기반 자동매매 시스템

## 📋 프로젝트 개요

Christmas Trading은 AI 기반의 클라우드 자동매매 플랫폼으로, OpenAI GPT-4와 전통적 기술적 지표를 결합한 혁신적인 투자 시스템입니다.

### 🎯 핵심 목표
- **100% Win-Rate**: 모든 거래에서 이익 실현을 목표
- **AI 학습 매매**: 개인화된 투자 전략 제공  
- **완전 클라우드**: 서버리스 아키텍처로 비용 최적화
- **실시간 알림**: Telegram 봇을 통한 즉시 피드백

### 🏗️ 기술 스택
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js + Docker
- **Database**: Supabase PostgreSQL
- **Deployment**: Netlify (Frontend) + Docker (Backend)
- **External APIs**: KIS API, Telegram Bot API, OpenAI API

## 📚 문서 구조

### 01_Project_Management/
프로젝트 관리 및 진행 상황 관련 문서
- `current_status.md` - 현재 프로젝트 진행 상황
- `project_plan.md` - 전체 프로젝트 계획
- `wbs.md` - 작업 분할 구조
- `document_map.md` - 문서 맵 및 가이드
- `final_report.md` - 최종 완료 보고서

### 02_Architecture/
시스템 아키텍처 및 설계 문서
- `system_architecture.md` - 전체 시스템 아키텍처
- `architecture_overview.md` - 아키텍처 현황 및 구조도
- `database_schema.md` - 데이터베이스 스키마 설계
- `api_documentation.md` - API 문서 및 명세
- `api/` - 상세 API 문서 디렉토리

### 03_Development/
개발 가이드라인 및 품질 관리
- `code_quality.md` - 코드 품질 가이드라인
- `test_strategy.md` - 테스트 전략 및 계획
- `refactoring_guide.md` - 코드 리팩토링 가이드
- `dependency_management.md` - 의존성 관리 문서
- `development_guidelines.md` - 개발 가이드라인

### 04_Operations/
운영, 배포 및 보안 관련
- `ci_cd_pipeline.md` - CI/CD 파이프라인 설정
- `security_guidelines.md` - 보안 가이드라인
- `deployment_guide.md` - 배포 가이드
- `monitoring_guide.md` - 모니터링 가이드
- `performance_optimization.md` - 성능 최적화 가이드

### 05_User_Guides/
사용자 및 설정 가이드
- `supabase_setup.md` - Supabase 설정 가이드
- `kis_api_guide.md` - KIS API 연동 가이드
- `telegram_bot_setup.md` - 텔레그램 봇 설정
- `environment_setup.md` - 환경 변수 설정
- `installation_guide.md` - 설치 가이드
- `troubleshooting_guide.md` - 문제 해결 가이드
- `usage_guide.md` - 사용자 매뉴얼
- `faq.md` - 자주 묻는 질문

### archive/
더 이상 사용하지 않는 중복 문서들

## 🚀 빠른 시작

1. **환경 설정**: `05_User_Guides/environment_setup.md` 참조
2. **데이터베이스 설정**: `05_User_Guides/supabase_setup.md` 참조
3. **API 연동**: `05_User_Guides/kis_api_guide.md` 참조
4. **배포**: `04_Operations/deployment_guide.md` 참조

## 📊 현재 상태 (2025년 6월 기준)

- **프로젝트 규모**: 대규모 AI 매매 플랫폼
- **개발 진행률**: 75% 완료
- **주요 성과**: MongoDB → Supabase 전환 완료
- **다음 단계**: AI 실제 매매 시스템 연동

## 🤝 기여하기

1. 문서 수정 시 해당 카테고리의 적절한 폴더에 위치
2. 새로운 문서 작성 시 README.md 업데이트
3. 중복 문서 생성 지양

## 📞 지원

문제 발생 시 `05_User_Guides/troubleshooting_guide.md`를 먼저 확인하세요.

---
*마지막 업데이트: 2025년 6월 10일*
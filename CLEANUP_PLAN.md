# 🧹 프로젝트 정리 계획

## 📅 **정리 일시**: 2025-06-23 18:50 UTC

---

## 🎯 **정리 원칙**
- ✅ **점진적 안전 정리**: 한 번에 하나씩 확인하며 삭제
- ✅ **현재 프로젝트 보호**: Vercel + Supabase 관련 파일 절대 보호
- ✅ **백업 우선**: 중요할 수 있는 내용은 통합 후 삭제

---

## 📋 **삭제 예정 문서 (Netlify 관련)**

### **Phase 1: Netlify 배포 관련 (안전 삭제)**
- ❌ `DEPLOYMENT_ISSUE_ANALYSIS.md` (Netlify 배포 문제 분석)
- ❌ `DEPLOYMENT_REALITY_ANALYSIS.md` (Netlify 실패 분석)
- ❌ `DEPLOYMENT_TRIGGER.md` (Netlify 트리거)
- ❌ `DEPLOYMENT_VERIFICATION_REPORT.md` (Netlify 검증)
- ❌ `DOMAIN_DEPLOYMENT_STATUS.md` (Netlify 도메인)
- ❌ `NETLIFY_FIX_REPORT.md` (Netlify 수정)
- ❌ `NETLIFY_ROOT_CAUSE_ANALYSIS.md` (Netlify 원인 분석)
- ❌ `FUNDAMENTAL_ISSUE_ANALYSIS.md` (Netlify 근본 문제)
- ❌ `netlify.toml` (Netlify 설정)

### **Phase 2: Firebase 관련 (신중 삭제)**
- ❌ `FIREBASE_SETUP_GUIDE.md` (Firebase → Supabase로 대체됨)
- ❌ `backend/` 전체 폴더 (Firebase + Docker 백엔드)
- ❌ `SERVER_BACKEND_ARCHITECTURE.md` (Firebase 기반, Supabase 문서로 대체)

### **Phase 3: 중복/과거 문서 (통합 후 삭제)**
- ❌ `STATIC_TEST_PROMOTION_PLAN.md` (완료된 작업)
- ❌ `STATIC_TO_DYNAMIC_MIGRATION.md` (완료된 작업)
- ❌ `REACT_MIGRATION_STRATEGY.md` (완료된 작업)
- ❌ `INTEGRATION_LOG.md` (로그 성격, 현재 불필요)

---

## ✅ **보존할 핵심 문서**

### **현재 프로젝트 핵심**
- ✅ `PROJECT_STATUS_SUMMARY.md` (프로젝트 상태)
- ✅ `VERCEL_SUPABASE_MIGRATION_PLAN.md` (현재 아키텍처)
- ✅ `SUPABASE_DATABASE_SCHEMA.md` (DB 설계)
- ✅ `DEVELOPMENT_ROADMAP.md` (로드맵, 업데이트 필요)
- ✅ `SAFE_MIGRATION_PLAN.md` (안전 원칙)
- ✅ `README.md` (프로젝트 소개)

### **기술 자산**
- ✅ `working-static-backup.html` (원본 백업)
- ✅ `sql/` 폴더 (데이터베이스 스크립트)
- ✅ `src/` 폴더 (React 앱)
- ✅ `vercel.json` (현재 배포 설정)

---

## 🔄 **정리 단계**

### **Step 1: Netlify 문서 제거**
```bash
# 안전한 Netlify 관련 파일 삭제
rm DEPLOYMENT_ISSUE_ANALYSIS.md
rm DEPLOYMENT_REALITY_ANALYSIS.md
rm DEPLOYMENT_TRIGGER.md
rm DEPLOYMENT_VERIFICATION_REPORT.md
rm DOMAIN_DEPLOYMENT_STATUS.md
rm NETLIFY_FIX_REPORT.md
rm NETLIFY_ROOT_CAUSE_ANALYSIS.md
rm FUNDAMENTAL_ISSUE_ANALYSIS.md
rm netlify.toml
```

### **Step 2: Firebase 백엔드 제거**
```bash
# Firebase 백엔드 완전 제거
rm -rf backend/
rm FIREBASE_SETUP_GUIDE.md
```

### **Step 3: 과거 문서 정리**
```bash
# 완료된 마이그레이션 문서들
rm STATIC_TEST_PROMOTION_PLAN.md
rm STATIC_TO_DYNAMIC_MIGRATION.md
rm REACT_MIGRATION_STRATEGY.md
rm INTEGRATION_LOG.md
```

### **Step 4: 문서 업데이트**
- `SERVER_BACKEND_ARCHITECTURE.md` → Supabase 기반으로 재작성
- `DEVELOPMENT_ROADMAP.md` → 현재 상황 반영 업데이트

---

## 🎯 **정리 후 상태**

### **깔끔한 프로젝트 구조**
```
📁 christmas-trading/
├── 📄 README.md (프로젝트 소개)
├── 📄 PROJECT_STATUS_SUMMARY.md (현재 상태)
├── 📄 VERCEL_SUPABASE_MIGRATION_PLAN.md (아키텍처)
├── 📄 SUPABASE_DATABASE_SCHEMA.md (DB 설계)
├── 📄 DEVELOPMENT_ROADMAP.md (로드맵)
├── 📄 SAFE_MIGRATION_PLAN.md (안전 원칙)
├── 📁 src/ (React 앱)
├── 📁 sql/ (DB 스크립트)
├── 📄 working-static-backup.html (원본 백업)
└── 📄 vercel.json (배포 설정)
```

### **예상 효과**
- 🧹 **깔끔한 구조**: 현재 사용하는 파일만 보존
- 🚀 **명확한 방향**: Vercel + Supabase 집중
- 📚 **정리된 문서**: 현재 상황에 맞는 문서만
- 🛡️ **안전성**: 핵심 기능 보호

---

**✅ 준비 완료 - 사용자 승인 후 단계적 정리 시작**
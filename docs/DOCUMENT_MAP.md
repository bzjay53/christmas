# 📚 Christmas Trading - 문서 맵 (바이낸스 암호화폐 거래 버전)

## 📅 **최종 업데이트**: 2025-06-28 UTC
## 🔄 **바이낸스 전환**: Phase 3 UI 완료 (frontend.png 100% 구현)

---

## 🗂️ **문서 구조 개요**

### **docs/ 폴더 구조**
```
docs/
├── 📁 architecture/          # 시스템 아키텍처 문서 (암호화폐 중심)
├── 📁 guides/                # 개발 가이드 및 튜토리얼 (바이낸스 API)
├── 📁 specifications/        # 기능 명세 및 요구사항 (암호화폐 거래)
├── 📁 planning/              # 프로젝트 계획 및 관리
├── 📁 reference/             # 참조 문서 및 레퍼런스
├── 📁 legacy/                # 기존 한국증권 관련 문서 보관
│   ├── 📁 architecture/      # 기존 한국 주식 DB 스키마
│   ├── 📁 guides/            # 기존 한국투자증권 API 가이드
│   └── 📁 specifications/    # 기존 한국 주식 거래 명세
└── 📄 DOCUMENT_MAP.md        # 이 파일 (문서 맵)
```

---

## 🔄 **바이낸스 전환 현황**

### **전환 단계**
- **Phase 1 (완료)**: 문서 구조 재편 및 백업 완료
- **Phase 2 (완료)**: API 및 데이터 구조 전환 완료
- **Phase 3 (완료)**: UI/UX frontend.png 100% 구현 완료

### **백업된 한국증권 문서 (docs/legacy/)**
- `KOREA_INVESTMENT_API_GUIDE.md` - 한국투자증권 API 연동 가이드
- `KOREAN_STOCK_TRADING_SPEC.md` - 한국 주식 거래 시스템 명세
- `KOREAN_STOCKS_DB_SCHEMA.md` - 한국 주식 데이터베이스 스키마
- `README_KOREAN_STOCKS.md` - 기존 한국 주식 프로젝트 README

---

## 📋 **문서별 상세 분류**

### **🏗️ Architecture (시스템 아키텍처)**
| 문서명 | 용도 | 상태 | 우선순위 |
|--------|------|------|----------|
| `SERVER_BACKEND_ARCHITECTURE.md` | Supabase 백엔드 아키텍처 설계 | ✅ 완료 | HIGH |
| `SUPABASE_DATABASE_SCHEMA.md` | 데이터베이스 스키마 설계 | ✅ 완료 | HIGH |

### **📖 Guides (개발 가이드)**
| 문서명 | 용도 | 상태 | 우선순위 |
|--------|------|------|----------|
| `API_INTEGRATION_GUIDE.md` | 바이낸스 API 연동 가이드 | 🔄 전환 중 | CRITICAL |
| `CODE_QUALITY_GUIDELINES.md` | 코드 품질 가이드라인 | ⏳ 예정 | MEDIUM |
| `TEST_STRATEGY.md` | 테스트 전략 문서 | ⏳ 예정 | MEDIUM |
| `CI_CD_PIPELINE.md` | CI/CD 파이프라인 가이드 | ⏳ 예정 | MEDIUM |
| `SECURITY_GUIDELINES.md` | 보안 가이드라인 | ⏳ 예정 | HIGH |
| `PERFORMANCE_OPTIMIZATION.md` | 성능 최적화 가이드 | ⏳ 예정 | MEDIUM |
| `TEAM_COLLABORATION.md` | 팀 협업 가이드 | ⏳ 예정 | LOW |

### **📋 Specifications (기능 명세)**
| 문서명 | 용도 | 상태 | 우선순위 |
|--------|------|------|----------|
| `RISK_MANAGEMENT_SPEC.md` | 동시 거래 방지 시스템 명세 | ✅ 완료 | CRITICAL |
| `TRADING_SYSTEM_SPEC.md` | 암호화폐 거래 시스템 명세 | 🔄 전환 중 | HIGH |
| `USER_AUTHENTICATION_SPEC.md` | 사용자 인증 시스템 명세 | ⏳ 예정 | HIGH |
| `AI_ALGORITHM_SPEC.md` | AI 알고리즘 명세 | ⏳ 예정 | MEDIUM |

### **📊 Planning (프로젝트 계획)**
| 문서명 | 용도 | 상태 | 우선순위 |
|--------|------|------|----------|
| `DEVELOPMENT_ROADMAP.md` | 백엔드 개발 로드맵 | ✅ 완료 | HIGH |
| `WBS_DETAILED.md` | 상세 작업 분해 구조 | ✅ 완료 | HIGH |
| `PROJECT_MANAGEMENT_REPORT.md` | PM 프로젝트 관리 보고서 | ✅ 완료 | HIGH |
| `VERCEL_SUPABASE_MIGRATION_PLAN.md` | Vercel+Supabase 마이그레이션 계획 | ✅ 완료 | MEDIUM |
| `SAFE_MIGRATION_PLAN.md` | 안전한 마이그레이션 계획 | ✅ 완료 | MEDIUM |

### **📚 Reference (참조 문서)**
| 문서명 | 용도 | 상태 | 우선순위 |
|--------|------|------|----------|
| `UNIFIED_PROJECT_VISION.md` | 통합 프로젝트 비전 | ✅ 완료 | HIGH |
| `MASTER_PROJECT_PLAN.md` | 마스터 프로젝트 계획 | ✅ 완료 | HIGH |

### **📄 Root Level (루트 레벨)**
| 문서명 | 용도 | 상태 | 우선순위 |
|--------|------|------|----------|
| `README.md` | 프로젝트 개요 및 시작 가이드 | ✅ 완료 | CRITICAL |
| `PROJECT_STATUS_SUMMARY.md` | 프로젝트 현재 상태 요약 | ✅ 완료 | HIGH |

---

## 🎯 **문서 우선순위 체계**

### **CRITICAL (즉시 필요)**
1. `README.md` - 프로젝트 첫인상
2. `API_INTEGRATION_GUIDE.md` - 핵심 기능 구현
3. `RISK_MANAGEMENT_SPEC.md` - 사용자 보호

### **HIGH (1주 내 완성)**
1. `TRADING_SYSTEM_SPEC.md` - 거래 시스템 명세
2. `USER_AUTHENTICATION_SPEC.md` - 사용자 인증 명세
3. `SECURITY_GUIDELINES.md` - 보안 가이드라인

### **MEDIUM (2주 내 완성)**
1. `CODE_QUALITY_GUIDELINES.md` - 코드 품질 관리
2. `TEST_STRATEGY.md` - 테스트 전략
3. `CI_CD_PIPELINE.md` - 배포 자동화
4. `PERFORMANCE_OPTIMIZATION.md` - 성능 최적화
5. `AI_ALGORITHM_SPEC.md` - AI 알고리즘 명세

### **LOW (향후 작성)**
1. `TEAM_COLLABORATION.md` - 팀 협업 가이드

---

## 📖 **문서 사용 가이드**

### **개발자 온보딩 순서**
1. `README.md` → 프로젝트 이해
2. `UNIFIED_PROJECT_VISION.md` → 전체 비전 파악
3. `SERVER_BACKEND_ARCHITECTURE.md` → 시스템 구조 이해
4. `API_INTEGRATION_GUIDE.md` → 개발 시작

### **기능 구현 시 참조 순서**
1. `WBS_DETAILED.md` → 작업 범위 확인
2. 해당 기능의 `*_SPEC.md` → 상세 요구사항
3. `CODE_QUALITY_GUIDELINES.md` → 코딩 표준 준수
4. `TEST_STRATEGY.md` → 테스트 계획

### **문제 해결 시 참조 순서**
1. `PROJECT_STATUS_SUMMARY.md` → 현재 상태 파악
2. `DEVELOPMENT_ROADMAP.md` → 계획 대비 진행 상황
3. 관련 가이드 문서 → 구체적 해결 방법

---

## 🔄 **문서 업데이트 정책**

### **실시간 업데이트 (매일)**
- `PROJECT_STATUS_SUMMARY.md`
- `PROJECT_MANAGEMENT_REPORT.md`

### **주간 업데이트 (매주)**
- `WBS_DETAILED.md`
- `DEVELOPMENT_ROADMAP.md`

### **마일스톤 업데이트 (Phase 완료 시)**
- 모든 아키텍처 문서
- 관련 가이드 문서

### **최종 업데이트 (프로젝트 완료 시)**
- `README.md`
- `UNIFIED_PROJECT_VISION.md`
- `MASTER_PROJECT_PLAN.md`

---

## 📊 **문서 품질 체크리스트**

### **필수 요소**
- [ ] 명확한 제목과 목적
- [ ] 작성일 및 최종 업데이트일
- [ ] 목차 (TOC)
- [ ] 코드 예시 (기술 문서의 경우)
- [ ] 체크리스트 또는 액션 아이템

### **권장 요소**
- [ ] 다이어그램 또는 플로우차트
- [ ] 예제 시나리오
- [ ] 트러블슈팅 섹션
- [ ] 관련 문서 링크

---

## 🔗 **문서 간 연관관계**

### **핵심 의존성**
```
UNIFIED_PROJECT_VISION.md
├── DEVELOPMENT_ROADMAP.md
├── WBS_DETAILED.md
└── SERVER_BACKEND_ARCHITECTURE.md
    ├── SUPABASE_DATABASE_SCHEMA.md
    └── API_INTEGRATION_GUIDE.md
        └── RISK_MANAGEMENT_SPEC.md
```

### **상호 참조**
- 모든 기술 문서는 `UNIFIED_PROJECT_VISION.md` 참조
- 모든 구현 가이드는 해당 `*_SPEC.md` 참조
- 모든 계획 문서는 `WBS_DETAILED.md` 참조

---

## 📝 **문서 작성 템플릿**

### **기술 문서 템플릿**
```markdown
# 🎯 [문서 제목]

## 📅 **작성일**: YYYY-MM-DD UTC

---

## 🎯 **목적 및 개요**
[문서의 목적과 전체 개요]

## 🏗️ **기술 스펙**
[상세 기술 사양]

## 🔧 **구현 가이드**
[단계별 구현 방법]

## 📋 **체크리스트**
[확인 사항 및 완료 기준]

---

*문서 작성 완료: YYYY-MM-DD UTC*
```

---

**🎯 목표: 체계적이고 일관성 있는 문서 관리**  
**📚 원칙: 찾기 쉽고, 이해하기 쉽고, 유지보수하기 쉬운 문서**  
**🔄 관리: 지속적인 업데이트와 품질 관리**

*문서 맵 완성: 2025-06-24 UTC*
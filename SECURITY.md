# 🔒 Christmas Trading 보안 가이드

## ⚠️ 중요한 보안 주의사항

### 환경변수 관리
- **절대로** 실제 API 키나 토큰을 코드에 하드코딩하지 마세요
- `.env` 파일은 Git에 커밋하지 마세요 (`.gitignore`에 포함됨)
- `env.example` 파일에는 예시 값만 포함하세요

### 민감한 정보 목록
다음 정보들은 절대로 공개 저장소에 노출되어서는 안 됩니다:

#### Supabase 관련
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY`: Supabase 익명 키
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 역할 키

#### API 키들
- `KIS_API_KEY`: 한국투자증권 API 키
- `KIS_API_SECRET`: 한국투자증권 API 시크릿
- `TELEGRAM_BOT_TOKEN`: 텔레그램 봇 토큰
- `OPENAI_API_KEY`: OpenAI API 키

#### 인증 관련
- `JWT_SECRET`: JWT 토큰 서명 키
- 각종 패스워드들

### 환경변수 설정 방법

1. **로컬 개발 환경**:
   ```bash
   cp env.example .env
   # .env 파일을 편집하여 실제 값 입력
   ```

2. **프로덕션 환경**:
   - Netlify: 사이트 설정 > Environment variables
   - Docker: `.env.docker` 파일 (서버에서만 관리)

### 보안 체크리스트

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는가?
- [ ] `env.example` 파일에 실제 값이 없는가?
- [ ] 스크립트 파일에 하드코딩된 키가 없는가?
- [ ] 프로덕션 환경변수가 안전하게 설정되어 있는가?

### 보안 사고 발생 시 대응

1. **즉시 조치**:
   - 노출된 키/토큰 무효화
   - 새로운 키 생성
   - Git 히스토리에서 민감한 정보 제거

2. **예방 조치**:
   - 정기적인 키 로테이션
   - 접근 권한 최소화
   - 모니터링 강화

### 연락처
보안 관련 문제 발견 시 즉시 프로젝트 관리자에게 연락하세요. 
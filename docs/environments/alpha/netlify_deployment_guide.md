# Netlify 배포 가이드

## 개요

이 문서는 Christmas 프로젝트의 웹 인터페이스를 Netlify 플랫폼에 서버리스 방식으로 배포하는 방법을 설명합니다. Netlify는 정적 사이트 호스팅과 서버리스 함수를 제공하여 Christmas 프로젝트의 웹 인터페이스를 효율적으로 배포할 수 있게 해줍니다.

## 사전 요구사항

- GitHub 계정 및 Christmas 프로젝트 리포지토리 접근 권한
- Netlify 계정 ([netlify.com](https://www.netlify.com)에서 무료 계정 생성 가능)
- Node.js 및 npm (로컬 테스트 및 배포 스크립트 실행용)
- Python 3.10 이상 (setup.py 스크립트 실행용)

## Netlify 배포 과정

### 1. GitHub 저장소 연동

1. Netlify 계정에 로그인
2. "Sites" 메뉴로 이동 후 "New site from Git" 버튼 클릭
3. GitHub을 Git 제공자로 선택
4. 권한 부여 후 Christmas 프로젝트 저장소 선택
5. 기본 설정:
   - Branch: main
   - Base directory: 비워두기 (프로젝트 루트)
   - Build command: `python setup.py`
   - Publish directory: `app/web/static`

### 2. 환경 변수 설정

Netlify 사이트 대시보드에서 다음과 같은 환경 변수를 설정합니다:

1. 사이트 대시보드 → Site settings → Build & deploy → Environment → Environment variables
2. 다음 환경 변수 추가:
   - `PYTHON_VERSION`: 3.10
   - `API_BASE_URL`: 백엔드 API URL (예: https://api.christmas.example.com)
   - 필요한 경우 추가 API 키 및 암호

### 3. Netlify 함수 설정

서버리스 함수는 `app/web/functions` 디렉토리에 있으며 자동으로 배포됩니다. `netlify.toml` 파일이 이미 함수 디렉토리를 지정하고 있어 추가 설정 없이 사용할 수 있습니다.

## 로컬 테스트 및 배포

### 로컬 테스트

1. Netlify CLI 설치 (아직 설치하지 않은 경우):
```bash
npm install -g netlify-cli
```

2. Netlify 계정에 로그인:
```bash
netlify login
```

3. 로컬 개발 서버 실행:
```bash
netlify dev
```

이 명령은 Netlify 함수와 함께 로컬 개발 서버를 시작하며, `http://localhost:8888`에서 웹 인터페이스를 테스트할 수 있습니다.

### 수동 배포

프로젝트 루트 디렉토리에서 다음 명령을 실행합니다:

1. PowerShell을 사용하는 경우:
```powershell
.\scripts\deploy_to_netlify.ps1 -Environment production
```

2. 또는 Netlify CLI 직접 사용:
```bash
# 환경 설정 스크립트 실행
python setup.py

# Netlify에 배포 (초안 버전)
netlify deploy

# 프로덕션 배포
netlify deploy --prod
```

## CI/CD 자동화

GitHub Actions를 통해 자동 배포가 구성되어 있습니다. `main` 브랜치에 변경사항이 푸시되면 자동으로 Netlify에 배포됩니다.

GitHub Actions 워크플로우 파일: `.github/workflows/netlify-deploy.yml`

### 필요한 GitHub Secrets

GitHub 저장소 설정 → Secrets and variables → Actions에서 다음 시크릿을 추가해야 합니다:

- `NETLIFY_AUTH_TOKEN`: Netlify 계정의 개인 액세스 토큰
- `NETLIFY_SITE_ID`: 배포할 Netlify 사이트의 ID

## 배포 후 검증

1. 배포 URL에서 웹 인터페이스 동작 확인
2. 서버리스 함수 테스트:
   - `/api/` 엔드포인트 호출 테스트
   - `/demo/` 모의투자 페이지 기능 테스트
3. 콘솔에서 오류 확인
4. 모바일 응답성 확인

## 문제 해결

### 함수 실행 오류

Netlify 대시보드의 Functions 섹션에서 함수 호출 로그를 확인할 수 있습니다. 일반적인 오류:

- 종속성 문제: `app/web/functions/package.json` 파일에 필요한 모든 종속성이 포함되어 있는지 확인
- 타임아웃: 함수 실행 시간이 10초를 초과하면 타임아웃 발생

### 배포 오류

- 빌드 로그 검토: Netlify 대시보드 → Deploys → 배포 선택 → Deploy log
- 정적 파일 경로 확인: `app/web/static` 디렉토리에 파일이 정확히 생성되었는지 확인

## 관련 문서

- [Netlify 공식 문서](https://docs.netlify.com/)
- [Netlify 함수 문서](https://docs.netlify.com/functions/overview/)
- [GitHub Actions 워크플로우 문서](../../26.%20cicd_pipeline.md)
- [프로젝트 구조도](../../09.%20christmas_project-structure.md)

## 변경 이력

| 날짜 | 변경 내용 | 작성자 |
|------|----------|-------|
| 2024-06-25 | 문서 초기 작성 | 개발팀 | 
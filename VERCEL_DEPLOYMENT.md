# Christmas 프로젝트 Vercel 배포 가이드

## 배포 준비 사항

1. **필요한 파일들**
   - `app/web/simple_test.py`: Vercel에서 실행할 Flask 애플리케이션 (엔트리 포인트)
   - `app/templates/dashboard.html`: 대시보드 UI 템플릿
   - `requirements-vercel.txt`: Vercel 배포에 필요한 패키지 목록
   - `vercel.json`: Vercel 배포 설정 파일

2. **환경 변수**
   - `CHRISTMAS_ENV`: 배포 환경 (production)
   - `FLASK_APP`: Flask 애플리케이션 경로 (app/web/simple_test.py)
   - `FLASK_ENV`: Flask 환경 설정 (production)

## 배포 방법

### 로컬 테스트

배포 전 로컬 환경에서 테스트가 필요합니다:

```bash
# 필요한 패키지 설치
pip install -r requirements-vercel.txt

# 애플리케이션 실행
python app/web/simple_test.py
```

브라우저에서 http://localhost:5000 에 접속하여 정상 작동 확인

### Vercel 배포

1. **Vercel CLI 설치**

```bash
npm install -g vercel
```

2. **Vercel 로그인**

```bash
vercel login
```

3. **프로젝트 배포**

```bash
vercel
```

배포 과정에서 다음과 같은 질문이 나옵니다:
- 설정 가져오시겠습니까? → 이미 `.vercel` 폴더가 있으면 'y'
- 프로젝트 경로 → 현재 경로 (Enter)
- 프로젝트 이름 → christmas (또는 원하는 이름)
- 프레임워크 프리셋 → Python (Other)
- 빌드 명령어 → 기본값 (Enter)
- 출력 디렉토리 → 기본값 (Enter)
- 개발 명령어 → 기본값 (Enter)
- 타임스크립트 설정 → 필요 없음 (n)

4. **프로덕션 배포**

```bash
vercel --prod
```

## 배포 후 확인

배포가 완료되면 다음 URL에서 접근 가능합니다:
- 기본 페이지: https://[project-name].vercel.app/
- 대시보드: https://[project-name].vercel.app/dashboard
- 데모 페이지: https://[project-name].vercel.app/demo
- API 엔드포인트: 
  - https://[project-name].vercel.app/api/stats
  - https://[project-name].vercel.app/api/performance

## 주의사항

1. Vercel에서 Python 애플리케이션은 서버리스 함수로 실행됩니다.
2. 파일 시스템 접근이나 장기 실행 프로세스는 지원되지 않습니다.
3. API 응답 시간이 10초를 초과하면 타임아웃됩니다.
4. 메모리 사용량이 1GB를 초과하면 실행이 중단됩니다.

## 트러블슈팅

1. **500 에러 발생 시**
   - 로그 확인: `vercel logs [project-name].vercel.app`
   - 문제 해결 후 재배포: `vercel --prod`

2. **Python 패키지 문제**
   - requirements-vercel.txt 파일 확인
   - 불필요한 패키지 제거
   - 버전 호환성 확인

3. **디버깅**
   - 로컬에서 문제 재현 및 해결 후 재배포
   - 필요한 경우 다음 환경 변수 추가: `DEBUG=True` 
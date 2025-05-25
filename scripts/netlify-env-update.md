# Netlify 환경 변수 업데이트 실행 가이드

## 🚨 즉시 실행 필요

현재 Netlify 프론트엔드가 `localhost:8000`을 바라보고 있어 "인증 실패" 오류가 발생합니다.
아래 단계를 따라 환경 변수를 업데이트해주세요.

## 📋 실행 단계

### 1단계: Netlify 대시보드 접속
1. 브라우저에서 https://app.netlify.com/ 접속
2. Christmas Trading 사이트 선택
3. **Site settings** 클릭
4. 좌측 메뉴에서 **Environment variables** 클릭

### 2단계: 기존 변수 수정
다음 변수들을 찾아서 값을 변경하세요:

| 변수명 | 변경할 값 |
|--------|-----------|
| `VITE_API_BASE_URL` | `http://31.220.83.213` |
| `VITE_NODE_ENV` | `production` |

### 3단계: 새로운 변수 추가
**Add a variable** 버튼을 클릭하여 다음 변수들을 추가하세요:

```
VITE_APP_NAME=Christmas Trading
VITE_APP_VERSION=2.0.0
VITE_API_TIMEOUT=30000
VITE_ENABLE_DEV_TOOLS=false
VITE_DEBUG_MODE=false
VITE_ENABLE_DEMO_MODE=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_REAL_TRADING=false
VITE_ENABLE_KIS_API=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_NOTIFICATION_TIMEOUT=3000
```

### 4단계: 재배포 실행
1. **Deploys** 탭으로 이동
2. **Trigger deploy** 버튼 클릭
3. **Deploy site** 선택
4. 배포 완료까지 대기 (약 2-3분)

### 5단계: 연동 테스트
1. https://christmas-trading.netlify.app 접속
2. 로그인 시도
3. "백엔드 연결 성공" 메시지 확인

## ✅ 성공 확인 방법

### 개발자 도구로 확인
1. F12 키로 개발자 도구 열기
2. Network 탭 선택
3. 로그인 시도
4. API 요청이 `31.220.83.213`으로 전송되는지 확인

### 예상 결과
- ✅ 로그인 성공
- ✅ 대시보드 정상 로딩
- ✅ "인증 실패" 오류 해결

## 🔧 문제 발생 시

### CORS 오류
- 백엔드에서 이미 Netlify 도메인을 허용하도록 설정됨
- 추가 조치 불필요

### 연결 타임아웃
- `VITE_API_TIMEOUT=60000`으로 증가

### 여전히 localhost 요청
- 브라우저 캐시 삭제 (Ctrl+Shift+R)
- 시크릿 모드에서 테스트

---

**중요**: 이 작업은 수동으로 Netlify 대시보드에서 진행해야 합니다.
환경 변수 업데이트 후 반드시 재배포를 실행해주세요! 
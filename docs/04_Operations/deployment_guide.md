# Christmas Trading 프로덕션 배포 및 동기화 가이드

## 📋 문서 개요
이 문서는 Christmas Trading 프로젝트의 로컬 개발 환경과 프로덕션 환경 간의 동기화 및 배포 프로세스를 정의합니다.

## 🌐 현재 환경 구성

### 🖥️ 로컬 개발 환경
- **프론트엔드**: http://localhost:3000 (Vite 개발 서버)
- **백엔드**: http://localhost:8000 (Node.js Express 서버)
- **데이터베이스**: Supabase 클라우드 (공유)

### 🚀 프로덕션 환경
- **프론트엔드**: https://christmas-protocol.netlify.app/ (Netlify 서버리스)
- **백엔드**: http://31.220.83.213:8000 (Docker 컨테이너)
- **데이터베이스**: Supabase 클라우드 (공유)

## 🔍 현재 상태 진단 (2024-12-25)

### ❌ 발견된 문제점
1. **프로덕션 백엔드 서버 연결 불가**
   - 상태: 31.220.83.213:8000 응답 없음
   - 원인: Docker 서비스 중단 또는 네트워크 문제
   - 영향: 프론트엔드에서 API 호출 실패

2. **로컬-프로덕션 코드 동기화 부족**
   - 로컬에서 구현한 KIS API, 텔레그램 봇 기능이 프로덕션에 미반영
   - 최신 API 서비스 개선사항 누락

### ✅ 정상 작동 중인 부분
1. **로컬 개발 환경**: 모든 서비스 정상 작동
2. **프론트엔드 배포**: Netlify에서 정상 서비스
3. **Supabase 데이터베이스**: 클라우드 서비스 정상

## 🛠️ 해결 단계별 계획

### 1단계: 프로덕션 백엔드 서버 복구 (긴급)
- [ ] Docker 서비스 상태 확인
- [ ] 컨테이너 재시작 또는 재배포
- [ ] 네트워크 및 포트 설정 확인
- [ ] 헬스 체크 엔드포인트 복구 확인

### 2단계: 코드 동기화 (높음)
- [ ] 로컬 최신 코드를 Git에 커밋
- [ ] 프로덕션 서버에 최신 코드 배포
- [ ] 환경 변수 설정 동기화
- [ ] API 엔드포인트 테스트

### 3단계: 배포 자동화 개선 (중간)
- [ ] Docker 이미지 자동 빌드 설정
- [ ] CI/CD 파이프라인 구축
- [ ] 배포 스크립트 작성
- [ ] 모니터링 시스템 구축

## 📋 체크리스트

### 🔧 백엔드 서버 복구 체크리스트
- [ ] SSH 접속 확인: `ssh user@31.220.83.213`
- [ ] Docker 서비스 상태: `docker ps`
- [ ] 컨테이너 로그 확인: `docker logs christmas-backend`
- [ ] 포트 8000 바인딩 확인: `netstat -tulpn | grep 8000`
- [ ] 방화벽 설정 확인: `ufw status`

### 📦 코드 동기화 체크리스트
- [ ] Git 상태 확인: `git status`
- [ ] 변경사항 커밋: `git add . && git commit -m "..."`
- [ ] 원격 저장소 푸시: `git push origin main`
- [ ] 프로덕션 서버에서 풀: `git pull origin main`
- [ ] 의존성 업데이트: `npm install`
- [ ] 서비스 재시작: `docker-compose restart`

### 🧪 테스트 체크리스트
- [ ] 헬스 체크: `curl http://31.220.83.213:8000/health`
- [ ] KIS API 상태: `curl http://31.220.83.213:8000/api/kis/status`
- [ ] 텔레그램 API 상태: `curl http://31.220.83.213:8000/api/telegram/validate-token`
- [ ] 프론트엔드 연동: Netlify에서 API 호출 테스트

## 🔄 배포 프로세스

### 📝 표준 배포 절차
1. **로컬 개발 완료**
   ```bash
   # 로컬 테스트
   npm test
   npm run build
   ```

2. **Git 커밋 및 푸시**
   ```bash
   git add .
   git commit -m "feat: 새로운 기능 추가"
   git push origin main
   ```

3. **프로덕션 배포**
   ```bash
   # SSH 접속
   ssh user@31.220.83.213
   
   # 코드 업데이트
   cd /path/to/christmas
   git pull origin main
   
   # Docker 재빌드 및 재시작
   docker-compose down
   docker-compose build
   docker-compose up -d
   ```

4. **배포 검증**
   ```bash
   # 서비스 상태 확인
   docker ps
   curl http://31.220.83.213:8000/health
   ```

## 🚨 긴급 복구 절차

### 🔥 서버 다운 시 긴급 복구
1. **즉시 확인사항**
   - 서버 접속 가능 여부
   - Docker 서비스 상태
   - 디스크 용량 및 메모리 상태

2. **복구 명령어**
   ```bash
   # Docker 서비스 재시작
   sudo systemctl restart docker
   
   # 컨테이너 강제 재시작
   docker-compose down --remove-orphans
   docker-compose up -d --force-recreate
   
   # 로그 확인
   docker-compose logs -f
   ```

3. **백업에서 복구**
   ```bash
   # 백업 이미지에서 복구
   docker load < christmas-backend-backup.tar
   docker run -d -p 8000:8000 christmas-backend:backup
   ```

## 📊 모니터링 및 알림

### 📈 모니터링 지표
- **서버 응답 시간**: < 2초
- **API 성공률**: > 99%
- **메모리 사용량**: < 80%
- **디스크 사용량**: < 90%

### 🔔 알림 설정
- **서버 다운**: 즉시 텔레그램 알림
- **API 오류율 증가**: 5분 내 알림
- **리소스 임계치 초과**: 10분 내 알림

## 📚 관련 문서 링크
- [프로젝트 관리 가이드](./46.%20프로젝트%20관리%20및%20서버%20이전%20가이드.md)
- [프로젝트 구조도](./47.%20프로젝트%20구조도.md)
- [보안 가이드라인](./49.%20보안%20가이드라인.md)
- [테스트 전략 문서](./50.%20테스트%20전략%20문서.md)

## 📝 업데이트 이력
- 2024-12-25: 초기 문서 생성 및 현재 상태 진단
- 향후 업데이트 예정

---
**⚠️ 중요**: 프로덕션 환경 변경 시 반드시 백업을 생성하고, 단계별로 검증하며 진행해야 합니다. 
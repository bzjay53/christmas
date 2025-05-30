# Christmas 알파 테스터 온보딩 가이드

## 1. 소개

Christmas 알파 테스트에 참여해 주셔서 감사합니다. 본 가이드는 Christmas 초단타 자동 매매 플랫폼의 알파 버전을 테스트하는 데 필요한 정보를 제공합니다.

## 2. 테스트 목적

알파 테스트의 주요 목적은 다음과 같습니다:
- 핵심 기능의 작동 검증
- 사용자 경험 개선을 위한 피드백 수집
- 성능 및 안정성 평가
- 실제 사용 환경에서의 문제점 발견

## 3. 테스트 환경 설정

### 3.1 접속 정보
- 테스트 서버 URL: https://alpha.christmas-trading.com
- 사용자 계정: 이메일로 개별 전송됨
- 접속 기간: 2025-05-20 ~ 2025-06-05

### 3.2 필요 사항
- 최신 버전의 Chrome, Firefox, Safari 또는 Edge 브라우저
- 모바일 테스트를 위한 스마트폰/태블릿
- 안정적인 인터넷 연결

### 3.3 로컬 환경 설정 (선택 사항)
개발자 및 고급 사용자를 위한 로컬 환경 설정:
```bash
# 리포지토리 클론
git clone https://github.com/christmas-trading/christmas.git

# 환경 설정
cd christmas
cp environments/alpha/.env.example environments/alpha/.env

# Docker 컨테이너 실행
docker-compose -f environments/alpha/docker-compose.yml up -d
```

## 4. 주요 테스트 영역

### 4.1 핵심 기능
- 사용자 인증 및 관리
- 시장 데이터 수집 및 표시
- 전략 설정 및 실행
- 백테스팅 및 결과 분석
- 위험 관리 설정
- RAG 시스템 활용
- 모니터링 및 알림

### 4.2 성능 및 안정성
- 데이터 로딩 및 처리 속도
- 동시 사용자 처리
- 장시간 운영 안정성
- 오류 발생 시 복구 능력

### 4.3 사용자 인터페이스
- 대시보드 사용성
- 모바일 환경 반응성
- 정보 구조 및 탐색 편의성
- 시각화 차트 및 그래프 가독성

## 5. 테스트 시나리오

다음은 테스트해 볼 수 있는 주요 시나리오입니다:

### 5.1 기본 워크플로우
1. 로그인 및 대시보드 확인
2. 시장 데이터 조회 및 필터링
3. 기본 전략 설정 및 백테스팅
4. 전략 최적화 및 재테스트
5. 모의 실행 시작 및 모니터링
6. 결과 분석 및 보고서 생성

### 5.2 고급 시나리오
1. 복합 전략 구성 및 테스트
2. 여러 자산에 대한 동시 전략 적용
3. 시장 변동성에 따른 위험 관리 테스트
4. RAG 시스템을 통한 문서 검색 및 질의
5. 시스템 부하 상황에서의 성능 테스트

## 6. 피드백 제출 방법

### 6.1 일반 피드백
- 웹 인터페이스 내 피드백 버튼 활용
- 이메일: feedback@christmas-trading.com
- 정기 화상 회의 참여 (매주 화요일 오후 2시)

### 6.2 버그 보고
버그 발견 시 다음 정보를 포함하여 보고해 주세요:
- 발생 일시 및 환경 (브라우저, OS)
- 재현 단계
- 예상 결과 vs 실제 결과
- 스크린샷 또는 비디오 (가능한 경우)
- 오류 메시지 (있는 경우)

### 6.3 설문조사
테스트 기간 중 중간 및 최종 설문조사에 응답해 주세요:
- 중간 설문: 2025-05-27
- 최종 설문: 2025-06-05

## 7. 지원 및 소통

### 7.1 지원 채널
- Slack 채널: #christmas-alpha-test
- 이메일: support@christmas-trading.com
- 긴급 지원: 010-1234-5678 (평일 9AM-6PM)

### 7.2 정기 미팅
- 주간 상태 회의: 매주 화요일 오후 2시
- Q&A 세션: 매주 목요일 오후 4시
- 1:1 인터뷰: 개별 일정 조율

## 8. 알파 테스트 타임라인

- 테스트 시작: 2025-05-20
- 중간 피드백 수집: 2025-05-27
- 주요 업데이트 배포: 2025-05-30
- 최종 피드백 수집: 2025-06-05
- 테스트 종료 및 결과 분석: 2025-06-10

## 9. 유의사항

- 알파 버전은 실제 거래가 아닌 모의 거래만 지원합니다.
- 일부 기능은 제한적으로 구현되었거나 변경될 수 있습니다.
- 테스트 데이터는 정기적으로 초기화될 수 있습니다.
- 테스트 과정에서 발견한 모든 문제는 최대한 자세히 보고해 주세요.
- 비밀번호 및 접속 정보는 외부에 공유하지 마세요.

---

알파 테스트 참여에 관한 질문이나 우려 사항이 있으시면 언제든지 alpha-manager@christmas-trading.com으로 문의해 주세요. 
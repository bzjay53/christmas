# Christmas API 버전 관리 전략

이 문서는 Christmas API의 버전 관리 전략과 가이드라인을 설명합니다.

## 버전 관리 원칙

Christmas API는 다음 원칙에 따라 버전을 관리합니다:

1. **하위 호환성 유지**: 가능한 한 기존 API 소비자의 코드가 계속 작동하도록 유지
2. **명확한 버전 전환**: 새 버전 출시 시 명확한 마이그레이션 경로 제공
3. **적절한 수명주기 관리**: 각 API 버전의 수명주기 단계를 명확하게 정의
4. **클라이언트 통지**: 버전 변경 및 사용 중단 계획에 대한 충분한 사전 통지

## 버전 관리 방식

Christmas API는 URL 경로 기반 버전 관리를 사용합니다.

### URL 구조

```
https://api.christmas-trading.com/v{major_version}/{resource_path}
```

예:
- `https://api.christmas-trading.com/v1/market/prices`
- `https://api.christmas-trading.com/v2/market/prices`

### 버전 명명 규칙

메이저 버전만 URL에 포함합니다. 마이너 버전과 패치 버전은 내부적으로 관리되며 API 응답 헤더에 포함됩니다.

```
X-API-Version: 1.2.3
```

여기서:
- 1: 메이저 버전 (호환성이 깨지는 변경)
- 2: 마이너 버전 (하위 호환성을 유지하는 기능 추가)
- 3: 패치 버전 (버그 수정)

## 버전 업그레이드 기준

### 메이저 버전 업그레이드 (v1 → v2)

메이저 버전은 다음과 같은 경우에 증가:

- 기존 엔드포인트 제거
- 필수 요청 매개변수 추가
- 응답 구조의 중요 필드 제거 또는 변경
- 요청/응답 형식의 근본적인 변경

### 마이너 버전 업그레이드 (v1.1 → v1.2)

마이너 버전은 다음과 같은 경우에 증가:

- 새로운 엔드포인트 추가
- 선택적 요청 매개변수 추가
- 응답에 새 필드 추가
- 하위 호환성을 유지하는 다른 개선

### 패치 버전 업그레이드 (v1.1.1 → v1.1.2)

패치 버전은 다음과 같은 경우에 증가:

- 버그 수정
- 성능 개선
- 문서 개선
- 기능 변경이 없는 내부 변경

## API 버전 수명주기

각 API 버전은 다음과 같은 수명주기 단계를 거칩니다:

1. **활성(Active)**: 완전히 지원됨, 새 기능이 추가될 수 있음
2. **유지보수(Maintenance)**: 버그 수정만 이루어지고 새 기능은 추가되지 않음
3. **사용 중단 예정(Deprecated)**: 향후 사용 중단 예정이며 마이그레이션 권장
4. **사용 중단(Sunset)**: 더 이상 지원되지 않으며 사용할 수 없음

### 버전 지원 정책

- 각 메이저 버전은 최소 12개월 동안 활성 상태 유지
- 새 메이저 버전 출시 후 6개월 동안 이전 버전 유지보수
- 사용 중단 예정 상태는 최소 6개월 지속 (충분한 마이그레이션 시간 제공)

## 버전 마이그레이션 가이드

### API 소비자를 위한 마이그레이션 단계

1. 변경 로그 및 마이그레이션 가이드 검토
2. 테스트 환경에서 새 버전 테스트
3. 점진적으로 새 버전으로 트래픽 이동
4. 모니터링 및 문제 해결
5. 완전한 마이그레이션 완료

### 마이그레이션 도구

- 버전 간 차이점 표시 도구
- 코드 마이그레이션 도우미 스크립트
- 동시 버전 클라이언트 라이브러리

## 버전 커뮤니케이션

### 버전 변경 알림

다음 채널을 통해 버전 변경 알림:

- API 개발자 포털 공지
- 이메일 뉴스레터
- API 응답의 사용 중단 헤더:
  ```
  Deprecation: true
  Sunset: Sat, 31 Dec 2023 23:59:59 GMT
  Link: <https://api.christmas-trading.com/v2/market/prices>; rel="successor-version"
  ```

### 변경 로그

모든 API 버전 변경은 CHANGELOG.md 파일과 개발자 포털에 문서화됩니다.

## 현재 활성 버전

| 버전 | 상태 | 출시일 | 유지보수 시작 | 사용 중단 예정 | 사용 중단 |
|------|------|--------|--------------|--------------|----------|
| v1   | 활성 | 2023-06-01 | - | - | - |
| v0   | 사용 중단 예정 | 2022-12-01 | 2023-06-01 | 2023-12-01 | 2024-06-01 |

## 버전 역호환성 지원

새 버전이 필요하지만 이전 클라이언트를 지원하려는 경우를 위한 전략:

### 요청 변환 계층

API 게이트웨이는 이전 버전의 요청을 자동으로 새 버전의 형식으로 변환합니다.

### 응답 버전 매핑

응답 데이터 구조는 요청된 버전에 맞게 변환됩니다.

## 모범 사례

API 소비자를 위한 권장 사항:

1. 항상 가장 최신의 안정적인 API 버전 사용
2. 사용 중인 API 버전의 사용 중단 알림 모니터링
3. 정기적인 API 업그레이드 일정 계획
4. 버전 관리 정보를 요청 및 기록하는 클라이언트 구현

## API 버전 이슈 및 피드백

API 버전 관련 문제나 질문이 있는 경우 다음 채널을 통해 연락:

- 개발자 포럼: [forum.christmas-trading.com](https://forum.christmas-trading.com)
- 이메일: api-support@christmas-trading.com
- 지원 티켓: [support.christmas-trading.com](https://support.christmas-trading.com) 
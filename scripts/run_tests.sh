#!/bin/bash
# Christmas 프로젝트 - 테스트 실행 스크립트

set -e # 오류 발생 시 스크립트 중단

# 로깅 설정
LOG_DIR="logs"
mkdir -p $LOG_DIR
LOG_FILE="$LOG_DIR/tests_$(date +%Y%m%d_%H%M%S).log"

# 로그 함수
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

# 사용법 표시
usage() {
    echo "사용법: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --all                 모든 테스트 실행"
    echo "  --unit                단위 테스트 실행"
    echo "  --integration         통합 테스트 실행"
    echo "  --performance         성능 테스트 실행"
    echo "  --security            보안 테스트 실행"
    echo "  --coverage            테스트 커버리지 리포트 생성"
    echo "  --verbose             상세 출력"
    echo "  --module <module>     특정 모듈만 테스트 (예: app.auth)"
    echo "  --help                이 도움말 표시"
    echo ""
    echo "Examples:"
    echo "  $0 --unit             # 단위 테스트만 실행"
    echo "  $0 --all --coverage   # 모든 테스트 실행 및 커버리지 리포트 생성"
    echo "  $0 --unit --module app.auth  # 인증 모듈 단위 테스트만 실행"
    exit 1
}

# 매개변수가 없으면 사용법 표시
if [ $# -eq 0 ]; then
    usage
fi

# 기본 설정
RUN_UNIT=false
RUN_INTEGRATION=false
RUN_PERFORMANCE=false
RUN_SECURITY=false
GENERATE_COVERAGE=false
VERBOSE=""
SPECIFIC_MODULE=""

# 매개변수 파싱
while [ $# -gt 0 ]; do
    case "$1" in
        --all)
            RUN_UNIT=true
            RUN_INTEGRATION=true
            RUN_PERFORMANCE=true
            RUN_SECURITY=true
            shift
            ;;
        --unit)
            RUN_UNIT=true
            shift
            ;;
        --integration)
            RUN_INTEGRATION=true
            shift
            ;;
        --performance)
            RUN_PERFORMANCE=true
            shift
            ;;
        --security)
            RUN_SECURITY=true
            shift
            ;;
        --coverage)
            GENERATE_COVERAGE=true
            shift
            ;;
        --verbose)
            VERBOSE="-v"
            shift
            ;;
        --module)
            SPECIFIC_MODULE="$2"
            shift 2
            ;;
        --help)
            usage
            ;;
        *)
            echo "알 수 없는 옵션: $1"
            usage
            ;;
    esac
done

# 테스트 실행 전 환경 설정
log "테스트 환경 설정 중..."

# 가상 환경 활성화 (필요한 경우)
if [ -d "venv" ] || [ -d ".venv" ]; then
    if [ -d "venv" ]; then
        source venv/bin/activate
    else
        source .venv/bin/activate
    fi
    log "가상 환경 활성화됨"
fi

# Poetry 환경 확인 (선택적)
if command -v poetry &> /dev/null; then
    USING_POETRY=true
    log "Poetry 환경 감지됨"
else
    USING_POETRY=false
fi

# 테스트 디렉토리 설정
TEST_DIR="tests"
TEST_RESULTS_DIR="test_results"
mkdir -p $TEST_RESULTS_DIR

# 테스트 코드 존재 확인
if [ ! -d "$TEST_DIR" ]; then
    log "에러: 테스트 디렉토리($TEST_DIR)를 찾을 수 없습니다"
    exit 1
fi

# 단위 테스트 실행
run_unit_tests() {
    log "단위 테스트 실행 중..."
    
    MODULE_OPTION=""
    if [ -n "$SPECIFIC_MODULE" ]; then
        MODULE_OPTION="-k $SPECIFIC_MODULE"
    fi
    
    COVERAGE_OPTION=""
    if [ "$GENERATE_COVERAGE" = true ]; then
        COVERAGE_OPTION="--cov=app --cov-report=html:$TEST_RESULTS_DIR/coverage --cov-report=term"
    fi
    
    if [ "$USING_POETRY" = true ]; then
        RESULT=$(poetry run pytest $TEST_DIR/unit $VERBOSE $MODULE_OPTION $COVERAGE_OPTION -xvs 2>&1) || true
    else
        RESULT=$(python -m pytest $TEST_DIR/unit $VERBOSE $MODULE_OPTION $COVERAGE_OPTION -xvs 2>&1) || true
    fi
    
    echo "$RESULT" | tee -a "$LOG_FILE"
    
    # 결과 파일 생성
    echo "$RESULT" > "$TEST_RESULTS_DIR/unit_test_results.txt"
    
    # 성공 여부 확인
    if echo "$RESULT" | grep -q "failed"; then
        log "단위 테스트 실패"
        UNIT_TESTS_PASSED=false
    else
        log "단위 테스트 성공"
        UNIT_TESTS_PASSED=true
    fi
}

# 통합 테스트 실행
run_integration_tests() {
    log "통합 테스트 실행 중..."
    
    MODULE_OPTION=""
    if [ -n "$SPECIFIC_MODULE" ]; then
        MODULE_OPTION="-k $SPECIFIC_MODULE"
    fi
    
    if [ "$USING_POETRY" = true ]; then
        RESULT=$(poetry run pytest $TEST_DIR/integration $VERBOSE $MODULE_OPTION -xvs 2>&1) || true
    else
        RESULT=$(python -m pytest $TEST_DIR/integration $VERBOSE $MODULE_OPTION -xvs 2>&1) || true
    fi
    
    echo "$RESULT" | tee -a "$LOG_FILE"
    
    # 결과 파일 생성
    echo "$RESULT" > "$TEST_RESULTS_DIR/integration_test_results.txt"
    
    # 성공 여부 확인
    if echo "$RESULT" | grep -q "failed"; then
        log "통합 테스트 실패"
        INTEGRATION_TESTS_PASSED=false
    else
        log "통합 테스트 성공"
        INTEGRATION_TESTS_PASSED=true
    fi
}

# 성능 테스트 실행
run_performance_tests() {
    log "성능 테스트 실행 중..."
    
    # 성능 테스트 디렉토리 확인
    if [ ! -d "$TEST_DIR/performance" ]; then
        log "성능 테스트 디렉토리가 존재하지 않습니다. 건너뜁니다."
        return
    fi
    
    if [ "$USING_POETRY" = true ]; then
        RESULT=$(poetry run pytest $TEST_DIR/performance $VERBOSE -xvs 2>&1) || true
    else
        RESULT=$(python -m pytest $TEST_DIR/performance $VERBOSE -xvs 2>&1) || true
    fi
    
    echo "$RESULT" | tee -a "$LOG_FILE"
    
    # 결과 파일 생성
    echo "$RESULT" > "$TEST_RESULTS_DIR/performance_test_results.txt"
    
    log "성능 테스트 완료"
}

# 보안 테스트 실행
run_security_tests() {
    log "보안 테스트 실행 중..."
    
    # 보안 테스트 디렉토리 확인
    if [ ! -d "$TEST_DIR/security" ]; then
        log "보안 테스트 디렉토리가 존재하지 않습니다. 건너뜁니다."
        return
    fi
    
    # Bandit 등의 보안 스캔 도구를 사용할 경우
    if command -v bandit &> /dev/null; then
        log "Bandit 보안 스캔 실행 중..."
        BANDIT_RESULT=$(bandit -r app/ -f txt -o "$TEST_RESULTS_DIR/bandit_results.txt" 2>&1) || true
        echo "$BANDIT_RESULT" | tee -a "$LOG_FILE"
    fi
    
    # 사용자 정의 보안 테스트 실행
    if [ "$USING_POETRY" = true ]; then
        RESULT=$(poetry run pytest $TEST_DIR/security $VERBOSE -xvs 2>&1) || true
    else
        RESULT=$(python -m pytest $TEST_DIR/security $VERBOSE -xvs 2>&1) || true
    fi
    
    echo "$RESULT" | tee -a "$LOG_FILE"
    
    # 결과 파일 생성
    echo "$RESULT" > "$TEST_RESULTS_DIR/security_test_results.txt"
    
    log "보안 테스트 완료"
}

# 선택된 테스트 실행
if [ "$RUN_UNIT" = true ]; then
    run_unit_tests
fi

if [ "$RUN_INTEGRATION" = true ]; then
    run_integration_tests
fi

if [ "$RUN_PERFORMANCE" = true ]; then
    run_performance_tests
fi

if [ "$RUN_SECURITY" = true ]; then
    run_security_tests
fi

# 테스트 요약 보고
log "===== 테스트 실행 요약 ====="

if [ "$RUN_UNIT" = true ]; then
    if [ "$UNIT_TESTS_PASSED" = true ]; then
        log "단위 테스트: 성공"
    else
        log "단위 테스트: 실패"
    fi
fi

if [ "$RUN_INTEGRATION" = true ]; then
    if [ "$INTEGRATION_TESTS_PASSED" = true ]; then
        log "통합 테스트: 성공"
    else
        log "통합 테스트: 실패"
    fi
fi

if [ "$RUN_PERFORMANCE" = true ]; then
    log "성능 테스트: 완료"
fi

if [ "$RUN_SECURITY" = true ]; then
    log "보안 테스트: 완료"
fi

if [ "$GENERATE_COVERAGE" = true ]; then
    log "커버리지 리포트 생성됨: $TEST_RESULTS_DIR/coverage"
fi

log "테스트 로그 파일: $LOG_FILE"
log "전체 테스트 결과: $TEST_RESULTS_DIR"
log "=============================" 
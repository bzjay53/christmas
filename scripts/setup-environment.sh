#!/bin/bash
# Christmas 프로젝트 - 환경 구성 관리 스크립트

set -e # 오류 발생 시 스크립트 중단

# 로깅 설정
LOG_FILE="logs/setup_env_$(date +%Y%m%d_%H%M%S).log"
mkdir -p logs

# 로그 함수
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

# 사용법 표시
usage() {
    echo "사용법: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  create <environment>    새 환경 생성"
    echo "  list                    환경 목록 표시"
    echo "  init <environment>      환경 초기화 (블루/그린 초기 구성)"
    echo "  export <environment>    환경 설정 내보내기"
    echo "  import <environment>    환경 설정 가져오기"
    echo ""
    echo "Options:"
    echo "  --template <template>   환경 생성 시 사용할 템플릿 지정"
    echo "  --file <file>           가져오기/내보내기할 파일 지정"
    echo ""
    echo "Examples:"
    echo "  $0 create production"
    echo "  $0 create staging --template production"
    echo "  $0 list"
    echo "  $0 export production --file prod_config.json"
    exit 1
}

# 명령행 인수가 없으면 사용법 표시
if [ $# -lt 1 ]; then
    usage
fi

# 명령 추출
COMMAND=$1
shift

# 명령에 따른 처리
case "$COMMAND" in
    create)
        # 환경 생성
        if [ $# -lt 1 ]; then
            log "에러: 환경 이름이 필요합니다."
            usage
        fi
        
        ENV_NAME=$1
        shift
        
        TEMPLATE=""
        
        # 추가 옵션 처리
        while [ $# -gt 0 ]; do
            case "$1" in
                --template)
                    TEMPLATE=$2
                    shift 2
                    ;;
                *)
                    log "에러: 알 수 없는 옵션: $1"
                    usage
                    ;;
            esac
        done
        
        # 환경 디렉토리 생성
        ENV_DIR="environments/$ENV_NAME"
        if [ -d "$ENV_DIR" ]; then
            log "경고: 환경 디렉토리가 이미 존재함: $ENV_DIR"
        else
            mkdir -p "$ENV_DIR"
            log "환경 디렉토리 생성됨: $ENV_DIR"
        fi
        
        # 템플릿 복사 (지정된 경우)
        if [ -n "$TEMPLATE" ]; then
            TEMPLATE_DIR="environments/$TEMPLATE"
            if [ ! -d "$TEMPLATE_DIR" ]; then
                log "에러: 템플릿 디렉토리가 존재하지 않음: $TEMPLATE_DIR"
                exit 1
            fi
            
            # 템플릿에서 환경 설정 파일 복사
            for CONFIG_FILE in "$TEMPLATE_DIR"/*.conf "$TEMPLATE_DIR"/*.yaml "$TEMPLATE_DIR"/*.json; do
                if [ -f "$CONFIG_FILE" ]; then
                    cp "$CONFIG_FILE" "$ENV_DIR/"
                    log "템플릿 파일 복사됨: $(basename "$CONFIG_FILE")"
                fi
            done
        fi
        
        # 기본 환경 설정 생성
        ENV_CONF="$ENV_DIR/environment.conf"
        if [ ! -f "$ENV_CONF" ]; then
            cat > "$ENV_CONF" << EOF
# Christmas 환경 설정 파일
# 환경: $ENV_NAME
# 생성 일시: $(date)

ENVIRONMENT=$ENV_NAME
CREATED_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
CREATED_BY=$USER
EOF
            log "환경 설정 파일 생성됨: $ENV_CONF"
        fi
        
        log "환경 생성 완료: $ENV_NAME"
        ;;
        
    list)
        # 환경 목록 표시
        ENV_DIR="environments"
        if [ ! -d "$ENV_DIR" ]; then
            log "경고: 환경 디렉토리가 존재하지 않음: $ENV_DIR"
            exit 0
        fi
        
        log "사용 가능한 환경 목록:"
        
        for ENV in "$ENV_DIR"/*; do
            if [ -d "$ENV" ]; then
                ENV_NAME=$(basename "$ENV")
                
                # 활성 환경 확인
                ACTIVE=""
                ACTIVE_ENV_FILE="$ENV/active_environment"
                if [ -f "$ACTIVE_ENV_FILE" ]; then
                    ACTIVE_ENV=$(cat "$ACTIVE_ENV_FILE")
                    ACTIVE=" (현재 활성: $ACTIVE_ENV)"
                fi
                
                # 생성 일자 확인
                CREATED=""
                ENV_CONF="$ENV/environment.conf"
                if [ -f "$ENV_CONF" ]; then
                    CREATED_DATE=$(grep CREATED_DATE "$ENV_CONF" | cut -d= -f2)
                    if [ -n "$CREATED_DATE" ]; then
                        CREATED=" [생성: $CREATED_DATE]"
                    fi
                fi
                
                echo "- $ENV_NAME$ACTIVE$CREATED"
            fi
        done
        ;;
        
    init)
        # 환경 초기화 (블루/그린 초기 구성)
        if [ $# -lt 1 ]; then
            log "에러: 환경 이름이 필요합니다."
            usage
        fi
        
        ENV_NAME=$1
        ENV_DIR="environments/$ENV_NAME"
        
        # 환경 디렉토리 확인
        if [ ! -d "$ENV_DIR" ]; then
            log "에러: 환경 디렉토리가 존재하지 않음: $ENV_DIR"
            log "먼저 'create' 명령으로 환경을 생성하세요."
            exit 1
        fi
        
        # blue/green 디렉토리 생성
        log "블루/그린 환경 초기화 중..."
        
        for COLOR in blue green; do
            COLOR_DIR="$ENV_DIR/$COLOR"
            if [ ! -d "$COLOR_DIR" ]; then
                mkdir -p "$COLOR_DIR"
                log "디렉토리 생성됨: $COLOR_DIR"
                
                # 기본 구성 파일 생성
                cat > "$COLOR_DIR/instance.conf" << EOF
# Christmas 인스턴스 설정 파일
# 환경: $ENV_NAME
# 인스턴스: $COLOR
# 생성 일시: $(date)

INSTANCE_NAME=$COLOR
ENVIRONMENT=$ENV_NAME
CREATED_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF
                log "인스턴스 설정 파일 생성됨: $COLOR/instance.conf"
            else
                log "디렉토리가 이미 존재함: $COLOR_DIR"
            fi
        done
        
        # 초기 활성 환경 설정 (blue)
        echo "blue" > "$ENV_DIR/active_environment"
        log "초기 활성 환경 설정: blue"
        
        # 이전 배포 정보 초기화
        echo "none" > "$ENV_DIR/previous_deploy"
        log "이전 배포 정보 초기화"
        
        log "환경 초기화 완료: $ENV_NAME"
        ;;
        
    export)
        # 환경 설정 내보내기
        if [ $# -lt 1 ]; then
            log "에러: 환경 이름이 필요합니다."
            usage
        fi
        
        ENV_NAME=$1
        shift
        
        OUTPUT_FILE="config/exported_${ENV_NAME}_$(date +%Y%m%d%H%M%S).json"
        
        # 추가 옵션 처리
        while [ $# -gt 0 ]; do
            case "$1" in
                --file)
                    OUTPUT_FILE=$2
                    shift 2
                    ;;
                *)
                    log "에러: 알 수 없는 옵션: $1"
                    usage
                    ;;
            esac
        done
        
        ENV_DIR="environments/$ENV_NAME"
        
        # 환경 디렉토리 확인
        if [ ! -d "$ENV_DIR" ]; then
            log "에러: 환경 디렉토리가 존재하지 않음: $ENV_DIR"
            exit 1
        fi
        
        # 설정 데이터 수집
        log "환경 설정 데이터 수집 중: $ENV_NAME"
        
        # JSON 형식으로 데이터 내보내기
        touch "$OUTPUT_FILE"
        echo "{" > "$OUTPUT_FILE"
        echo "  \"environment\": \"$ENV_NAME\"," >> "$OUTPUT_FILE"
        echo "  \"exported_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"," >> "$OUTPUT_FILE"
        echo "  \"exported_by\": \"$USER\"," >> "$OUTPUT_FILE"
        
        # 활성 환경 정보
        ACTIVE_ENV_FILE="$ENV_DIR/active_environment"
        if [ -f "$ACTIVE_ENV_FILE" ]; then
            ACTIVE_ENV=$(cat "$ACTIVE_ENV_FILE")
            echo "  \"active_environment\": \"$ACTIVE_ENV\"," >> "$OUTPUT_FILE"
        else
            echo "  \"active_environment\": null," >> "$OUTPUT_FILE"
        fi
        
        # 설정 파일 내용 추가
        echo "  \"config_files\": {" >> "$OUTPUT_FILE"
        
        FIRST_FILE=true
        for CONFIG_FILE in "$ENV_DIR"/*.conf "$ENV_DIR"/*.yaml "$ENV_DIR"/*.json; do
            if [ -f "$CONFIG_FILE" ]; then
                FILE_NAME=$(basename "$CONFIG_FILE")
                
                if [ "$FIRST_FILE" = true ]; then
                    FIRST_FILE=false
                else
                    echo "," >> "$OUTPUT_FILE"
                fi
                
                echo -n "    \"$FILE_NAME\": " >> "$OUTPUT_FILE"
                
                # 파일 내용을 JSON 문자열로 변환
                FILE_CONTENT=$(cat "$CONFIG_FILE" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')
                echo "\"$FILE_CONTENT\"" >> "$OUTPUT_FILE"
            fi
        done
        
        echo -n -e "\n  }" >> "$OUTPUT_FILE"
        echo -n -e "\n}" >> "$OUTPUT_FILE"
        
        log "환경 설정 내보내기 완료: $OUTPUT_FILE"
        ;;
        
    import)
        # 환경 설정 가져오기
        if [ $# -lt 1 ]; then
            log "에러: 환경 이름이 필요합니다."
            usage
        fi
        
        ENV_NAME=$1
        shift
        
        INPUT_FILE=""
        
        # 추가 옵션 처리
        while [ $# -gt 0 ]; do
            case "$1" in
                --file)
                    INPUT_FILE=$2
                    shift 2
                    ;;
                *)
                    log "에러: 알 수 없는 옵션: $1"
                    usage
                    ;;
            esac
        done
        
        if [ -z "$INPUT_FILE" ]; then
            log "에러: 입력 파일이 지정되지 않았습니다. --file 옵션을 사용하세요."
            usage
        fi
        
        if [ ! -f "$INPUT_FILE" ]; then
            log "에러: 입력 파일이 존재하지 않음: $INPUT_FILE"
            exit 1
        fi
        
        ENV_DIR="environments/$ENV_NAME"
        
        # 환경 디렉토리 생성
        if [ ! -d "$ENV_DIR" ]; then
            mkdir -p "$ENV_DIR"
            log "환경 디렉토리 생성됨: $ENV_DIR"
        fi
        
        # 설정 가져오기는 jq 도구 필요
        if ! command -v jq &> /dev/null; then
            log "에러: jq 도구가 필요합니다. 설치하려면: apt-get install jq"
            exit 1
        fi
        
        log "환경 설정 가져오기 중: $ENV_NAME (파일: $INPUT_FILE)"
        
        # 활성 환경 정보 가져오기
        ACTIVE_ENV=$(jq -r '.active_environment // "blue"' "$INPUT_FILE")
        echo "$ACTIVE_ENV" > "$ENV_DIR/active_environment"
        log "활성 환경 설정: $ACTIVE_ENV"
        
        # 설정 파일 가져오기
        jq -r '.config_files | keys[]' "$INPUT_FILE" | while read FILE_NAME; do
            FILE_CONTENT=$(jq -r ".config_files[\"$FILE_NAME\"]" "$INPUT_FILE")
            echo -e "$FILE_CONTENT" > "$ENV_DIR/$FILE_NAME"
            log "설정 파일 가져옴: $FILE_NAME"
        done
        
        log "환경 설정 가져오기 완료: $ENV_NAME"
        ;;
        
    *)
        log "에러: 알 수 없는 명령: $COMMAND"
        usage
        ;;
esac

exit 0 
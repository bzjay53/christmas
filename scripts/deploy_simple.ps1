# Christmas 프로젝트 간단 배포 스크립트
param(
    [string]$Action = "status",
    [switch]$DryRun = $false
)

Write-Host "Christmas Project Deployment Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

function Test-Prerequisites {
    Write-Host "사전 요구사항 검사 중..." -ForegroundColor Yellow
    
    # Docker 확인
    try {
        docker --version | Out-Null
        Write-Host "✓ Docker 설치됨" -ForegroundColor Green
    } catch {
        Write-Host "✗ Docker 누락" -ForegroundColor Red
        exit 1
    }
    
    # Docker Compose 확인
    try {
        docker-compose --version | Out-Null
        Write-Host "✓ Docker Compose 설치됨" -ForegroundColor Green
    } catch {
        Write-Host "✗ Docker Compose 누락" -ForegroundColor Red
        exit 1
    }
    
    # Docker 데몬 확인
    try {
        docker info | Out-Null
        Write-Host "✓ Docker 데몬 실행중" -ForegroundColor Green
    } catch {
        Write-Host "✗ Docker 데몬이 실행되지 않음" -ForegroundColor Red
        exit 1
    }
    
    # 환경 변수 파일 확인
    if (-not (Test-Path ".env.production")) {
        Write-Host "⚠ .env.production 파일이 없습니다" -ForegroundColor Yellow
        Write-Host "config/production.env.template을 복사하여 .env.production으로 만들어주세요" -ForegroundColor Yellow
    } else {
        Write-Host "✓ .env.production 파일 존재" -ForegroundColor Green
    }
}

function Show-Status {
    Write-Host "서비스 상태 확인 중..." -ForegroundColor Yellow
    try {
        docker-compose -f docker-compose.prod.yml ps
    } catch {
        Write-Host "docker-compose.prod.yml 파일을 찾을 수 없거나 오류가 발생했습니다" -ForegroundColor Red
    }
}

function Start-Deploy {
    if ($DryRun) {
        Write-Host "[DRY RUN] 배포 시뮬레이션 모드입니다" -ForegroundColor Cyan
        return
    }
    
    Write-Host "배포를 시작합니다..." -ForegroundColor Yellow
    
    # 기존 서비스 중지
    Write-Host "기존 서비스 중지 중..." -ForegroundColor Yellow
    try {
        docker-compose -f docker-compose.prod.yml down
        Write-Host "✓ 서비스 중지 완료" -ForegroundColor Green
    } catch {
        Write-Host "서비스 중지 중 오류 발생" -ForegroundColor Red
    }
    
    # 이미지 빌드
    Write-Host "Docker 이미지 빌드 중..." -ForegroundColor Yellow
    try {
        docker-compose -f docker-compose.prod.yml build
        Write-Host "✓ 이미지 빌드 완료" -ForegroundColor Green
    } catch {
        Write-Host "✗ 이미지 빌드 실패" -ForegroundColor Red
        exit 1
    }
    
    # 서비스 시작
    Write-Host "서비스 시작 중..." -ForegroundColor Yellow
    try {
        docker-compose -f docker-compose.prod.yml up -d
        Write-Host "✓ 서비스 시작 완료" -ForegroundColor Green
    } catch {
        Write-Host "✗ 서비스 시작 실패" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "배포 완료!" -ForegroundColor Green
    Write-Host "서비스 접근 정보:" -ForegroundColor Cyan
    Write-Host "  API: http://localhost:8000" -ForegroundColor White
    Write-Host "  Grafana: http://localhost:3000" -ForegroundColor White
    Write-Host "  Prometheus: http://localhost:9090" -ForegroundColor White
}

function Stop-Services {
    Write-Host "서비스 중지 중..." -ForegroundColor Yellow
    try {
        docker-compose -f docker-compose.prod.yml down
        Write-Host "✓ 서비스 중지 완료" -ForegroundColor Green
    } catch {
        Write-Host "서비스 중지 중 오류 발생" -ForegroundColor Red
    }
}

function Show-Logs {
    Write-Host "최근 로그 표시..." -ForegroundColor Yellow
    try {
        docker-compose -f docker-compose.prod.yml logs --tail=50
    } catch {
        Write-Host "로그 표시 중 오류 발생" -ForegroundColor Red
    }
}

# 메인 실행
switch ($Action.ToLower()) {
    "prereq" {
        Test-Prerequisites
    }
    "deploy" {
        Test-Prerequisites
        Start-Deploy
        Show-Status
    }
    "stop" {
        Stop-Services
    }
    "status" {
        Show-Status
    }
    "logs" {
        Show-Logs
    }
    default {
        Write-Host "사용법: .\scripts\deploy_simple.ps1 -Action <command>" -ForegroundColor Yellow
        Write-Host "가능한 명령어: prereq, deploy, stop, status, logs" -ForegroundColor Yellow
    }
} 
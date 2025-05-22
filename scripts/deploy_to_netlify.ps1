<#
.SYNOPSIS
  Christmas 프로젝트를 Netlify에 배포하는 스크립트
.DESCRIPTION
  이 스크립트는 Christmas 프로젝트 코드를 준비하고 Netlify CLI를 통해 배포합니다.
.PARAMETER Environment
  배포할 환경 (development, production)
.EXAMPLE
  .\deploy_to_netlify.ps1 -Environment development
#>

param (
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "production")]
    [string]$Environment = "development"
)

# 현재 디렉토리와 스크립트 디렉토리 확인
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Join-Path -Path $ScriptDir -ChildPath ".."
Set-Location -Path $ProjectRoot

# 함수: 오류 처리
function Handle-Error {
    param (
        [string]$ErrorMessage
    )
    Write-Host "오류: $ErrorMessage" -ForegroundColor Red
    exit 1
}

# Node.js와 npm 확인
try {
    $NodeVersion = node -v
    $NpmVersion = npm -v
    Write-Host "Node.js 버전: $NodeVersion" -ForegroundColor Green
    Write-Host "npm 버전: $NpmVersion" -ForegroundColor Green
} catch {
    Handle-Error "Node.js 또는 npm이 설치되어 있지 않습니다. Node.js를 설치해주세요."
}

# Netlify CLI 설치 확인
try {
    $NetlifyVersion = netlify -v
    Write-Host "Netlify CLI 버전: $NetlifyVersion" -ForegroundColor Green
} catch {
    Write-Host "Netlify CLI를 설치합니다..." -ForegroundColor Yellow
    npm install -g netlify-cli
    if (-not $?) {
        Handle-Error "Netlify CLI 설치에 실패했습니다."
    }
}

# Netlify 로그인 상태 확인
Write-Host "Netlify 로그인 상태를 확인합니다..." -ForegroundColor Yellow
netlify status
if (-not $?) {
    Write-Host "Netlify에 로그인해야 합니다..." -ForegroundColor Yellow
    netlify login
    if (-not $?) {
        Handle-Error "Netlify 로그인에 실패했습니다."
    }
}

# 배포 준비
Write-Host "배포 준비를 시작합니다..." -ForegroundColor Yellow

# Python 환경 준비
Write-Host "환경 설정 스크립트를 실행합니다..." -ForegroundColor Yellow
python setup.py
if (-not $?) {
    Handle-Error "환경 설정 스크립트 실행에 실패했습니다."
}

# 환경에 따른 배포 옵션 설정
$DeployOptions = ""
if ($Environment -eq "production") {
    $DeployOptions = "--prod"
    Write-Host "프로덕션 환경으로 배포합니다." -ForegroundColor Magenta
} else {
    Write-Host "개발 환경으로 배포합니다." -ForegroundColor Cyan
}

# Netlify 배포 실행
Write-Host "Netlify 배포를 시작합니다..." -ForegroundColor Yellow
netlify deploy $DeployOptions
if (-not $?) {
    Handle-Error "Netlify 배포에 실패했습니다."
}

Write-Host "배포가 완료되었습니다! 브라우저에서 배포된 사이트를 확인하세요." -ForegroundColor Green 
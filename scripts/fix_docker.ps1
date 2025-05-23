# Docker Desktop 문제 해결 스크립트
param(
    [string]$Action = "diagnose",
    [switch]$Force = $false
)

Write-Host "Docker Desktop 문제 해결 도구" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

function Test-DockerIssues {
    Write-Host "Docker 문제 진단 중..." -ForegroundColor Yellow
    
    # 1. WSL2 상태 확인
    Write-Host "`n1. WSL2 상태 확인:" -ForegroundColor Cyan
    try {
        $wslStatus = wsl --list --verbose
        Write-Host $wslStatus -ForegroundColor White
        
        if ($wslStatus -match "docker-desktop.*Stopped") {
            Write-Host "⚠️ docker-desktop WSL 배포판이 중지되어 있습니다" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ WSL 명령어 실행 실패" -ForegroundColor Red
    }
    
    # 2. Docker 프로세스 확인
    Write-Host "`n2. Docker 프로세스 확인:" -ForegroundColor Cyan
    $dockerProcesses = Get-Process -Name "*docker*" -ErrorAction SilentlyContinue
    if ($dockerProcesses) {
        $dockerProcesses | Format-Table ProcessName, Id, CPU, WorkingSet
    } else {
        Write-Host "❌ Docker 프로세스가 실행되지 않음" -ForegroundColor Red
    }
    
    # 3. Docker Desktop 설치 확인
    Write-Host "`n3. Docker Desktop 설치 확인:" -ForegroundColor Cyan
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Write-Host "✅ Docker Desktop 설치됨: $dockerPath" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker Desktop이 설치되지 않음" -ForegroundColor Red
    }
    
    # 4. 시스템 리소스 확인
    Write-Host "`n4. 시스템 리소스 확인:" -ForegroundColor Cyan
    $memory = Get-CimInstance -ClassName Win32_ComputerSystem
    $totalMemoryGB = [math]::Round($memory.TotalPhysicalMemory / 1GB, 2)
    Write-Host "💾 총 메모리: $totalMemoryGB GB" -ForegroundColor White
    
    if ($totalMemoryGB -lt 4) {
        Write-Host "⚠️ 메모리가 부족할 수 있습니다 (권장: 8GB 이상)" -ForegroundColor Yellow
    }
    
    # 5. Hyper-V 상태 확인
    Write-Host "`n5. Hyper-V 상태 확인:" -ForegroundColor Cyan
    try {
        $hyperv = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All
        Write-Host "Hyper-V 상태: $($hyperv.State)" -ForegroundColor White
    } catch {
        Write-Host "⚠️ Hyper-V 상태를 확인할 수 없습니다" -ForegroundColor Yellow
    }
}

function Stop-DockerServices {
    Write-Host "Docker 서비스 완전 종료 중..." -ForegroundColor Yellow
    
    # Docker Desktop 프로세스 종료
    $dockerProcesses = @("Docker Desktop", "com.docker.backend", "com.docker.build", "dockerd")
    foreach ($processName in $dockerProcesses) {
        $processes = Get-Process -Name $processName -ErrorAction SilentlyContinue
        foreach ($process in $processes) {
            try {
                Stop-Process -Id $process.Id -Force
                Write-Host "✅ $processName (PID: $($process.Id)) 종료됨" -ForegroundColor Green
            } catch {
                Write-Host "⚠️ $processName 종료 실패" -ForegroundColor Yellow
            }
        }
    }
    
    # WSL 종료
    try {
        wsl --shutdown
        Write-Host "✅ WSL 시스템 종료됨" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ WSL 종료 실패" -ForegroundColor Yellow
    }
}

function Reset-WSLDocker {
    Write-Host "WSL Docker 환경 재설정 중..." -ForegroundColor Yellow
    
    if (-not $Force) {
        $response = Read-Host "WSL Docker 환경을 재설정하시겠습니까? 기존 데이터가 손실될 수 있습니다. (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Host "작업이 취소되었습니다." -ForegroundColor Gray
            return
        }
    }
    
    try {
        # WSL 완전 종료
        wsl --shutdown
        Start-Sleep -Seconds 5
        
        # Docker WSL 배포판 제거
        wsl --unregister docker-desktop 2>$null
        wsl --unregister docker-desktop-data 2>$null
        
        Write-Host "✅ WSL Docker 환경 재설정 완료" -ForegroundColor Green
        Write-Host "ℹ️ Docker Desktop을 다시 시작하여 WSL 환경을 재생성하세요" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ WSL 재설정 실패: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Clear-DockerData {
    Write-Host "Docker Desktop 데이터 정리 중..." -ForegroundColor Yellow
    
    if (-not $Force) {
        $response = Read-Host "Docker Desktop 데이터를 정리하시겠습니까? 모든 컨테이너와 이미지가 삭제됩니다. (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Host "작업이 취소되었습니다." -ForegroundColor Gray
            return
        }
    }
    
    $dockerDataPaths = @(
        "$env:APPDATA\Docker",
        "$env:LOCALAPPDATA\Docker"
    )
    
    foreach ($path in $dockerDataPaths) {
        if (Test-Path $path) {
            try {
                Remove-Item -Path $path -Recurse -Force
                Write-Host "✅ 삭제됨: $path" -ForegroundColor Green
            } catch {
                Write-Host "⚠️ 삭제 실패: $path" -ForegroundColor Yellow
            }
        } else {
            Write-Host "ℹ️ 경로 없음: $path" -ForegroundColor Gray
        }
    }
}

function Start-DockerSafe {
    Write-Host "Docker Desktop 안전 모드로 시작 중..." -ForegroundColor Yellow
    
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (-not (Test-Path $dockerPath)) {
        Write-Host "❌ Docker Desktop이 설치되지 않음" -ForegroundColor Red
        return
    }
    
    try {
        # 확장 프로그램 없이 시작
        Start-Process $dockerPath -ArgumentList "--no-extensions", "--reset-to-factory" -WindowStyle Minimized
        Write-Host "✅ Docker Desktop 안전 모드로 시작됨" -ForegroundColor Green
        Write-Host "ℹ️ Docker Desktop이 완전히 시작될 때까지 2-3분 기다려주세요" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Docker Desktop 시작 실패: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Show-Solutions {
    Write-Host "`n🔧 Docker Desktop 오류 해결 방법:" -ForegroundColor Cyan
    Write-Host "1. 기본 해결책:" -ForegroundColor Yellow
    Write-Host "   - WSL 재시작: wsl --shutdown" -ForegroundColor White
    Write-Host "   - Docker Desktop 재시작" -ForegroundColor White
    Write-Host "   - 시스템 재부팅" -ForegroundColor White
    
    Write-Host "`n2. 고급 해결책:" -ForegroundColor Yellow
    Write-Host "   - WSL 환경 재설정: .\scripts\fix_docker.ps1 -Action reset-wsl" -ForegroundColor White
    Write-Host "   - Docker 데이터 정리: .\scripts\fix_docker.ps1 -Action clear-data" -ForegroundColor White
    Write-Host "   - 안전 모드 시작: .\scripts\fix_docker.ps1 -Action safe-start" -ForegroundColor White
    
    Write-Host "`n3. 최후 수단:" -ForegroundColor Yellow
    Write-Host "   - Docker Desktop 완전 재설치" -ForegroundColor White
    Write-Host "   - Windows 기능: Hyper-V, WSL2 재설치" -ForegroundColor White
    
    Write-Host "`n💡 대안:" -ForegroundColor Green
    Write-Host "   - 현재 사용 중인 Python 가상환경 계속 사용" -ForegroundColor White
    Write-Host "   - Podman 또는 다른 컨테이너 런타임 사용" -ForegroundColor White
}

# 메인 실행
switch ($Action.ToLower()) {
    "diagnose" {
        Test-DockerIssues
        Show-Solutions
    }
    "stop" {
        Stop-DockerServices
    }
    "reset-wsl" {
        Stop-DockerServices
        Reset-WSLDocker
    }
    "clear-data" {
        Stop-DockerServices
        Clear-DockerData
    }
    "safe-start" {
        Stop-DockerServices
        Start-Sleep -Seconds 5
        Start-DockerSafe
    }
    "full-reset" {
        Stop-DockerServices
        Clear-DockerData
        Reset-WSLDocker
        Start-DockerSafe
    }
    default {
        Write-Host "사용법: .\scripts\fix_docker.ps1 -Action <command>" -ForegroundColor Yellow
        Write-Host "가능한 명령어:" -ForegroundColor Yellow
        Write-Host "  diagnose   - Docker 문제 진단" -ForegroundColor White
        Write-Host "  stop       - Docker 서비스 완전 종료" -ForegroundColor White
        Write-Host "  reset-wsl  - WSL Docker 환경 재설정" -ForegroundColor White
        Write-Host "  clear-data - Docker 데이터 정리" -ForegroundColor White
        Write-Host "  safe-start - 안전 모드로 시작" -ForegroundColor White
        Write-Host "  full-reset - 완전 재설정 (위험)" -ForegroundColor White
    }
} 
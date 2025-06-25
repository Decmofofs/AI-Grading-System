# AI Grading System - PowerShell Start Script
# =============================================

Write-Host "AI Grading System - Start Script (PowerShell)" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Check if Node.js and npm are installed
function Test-Prerequisites {
    Write-Host "[CHECK] Checking prerequisites..." -ForegroundColor Yellow
    
    try {
        $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
        if (-not $nodeCmd) {
            throw "Node.js not installed"
        }
        $nodeVersion = & node --version
        Write-Host "[OK] Node.js installed: $nodeVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "[ERROR] Node.js not found, please install Node.js first" -ForegroundColor Red
        Read-Host "Press any key to exit"
        exit 1
    }

    try {
        $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
        if (-not $npmCmd) {
            throw "npm not installed"
        }
        $npmVersion = & npm --version
        Write-Host "[OK] npm installed: $npmVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "[ERROR] npm not found, please install npm first" -ForegroundColor Red
        Read-Host "Press any key to exit"
        exit 1
    }
    
    Write-Host ""
}

# Create logs directory
function Initialize-Directories {
    if (!(Test-Path "logs")) {
        New-Item -ItemType Directory -Path "logs" | Out-Null
        Write-Host "[CREATE] logs directory" -ForegroundColor Cyan
    }
}

# Start a single service
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [int]$Port
    )
    
    Write-Host "[START] $ServiceName (Port: $Port)..." -ForegroundColor Yellow
    
    $originalLocation = Get-Location
    
    try {
        # Switch to service directory
        Set-Location $ServicePath
        
        # Check if package.json exists
        if (!(Test-Path "package.json")) {
            throw "package.json not found in $ServicePath"
        }
        
        # Check if node_modules exists, install dependencies if not
        if (!(Test-Path "node_modules")) {
            Write-Host "[INSTALL] Installing $ServiceName dependencies..." -ForegroundColor Cyan
            & npm install
            if ($LASTEXITCODE -ne 0) {
                throw "$ServiceName dependency installation failed"
            }
        }
        
        # For TypeScript projects, build first
        if (Test-Path "tsconfig.json") {
            Write-Host "[BUILD] Building $ServiceName..." -ForegroundColor Cyan
            & npm run build
            if ($LASTEXITCODE -ne 0) {
                throw "$ServiceName build failed"
            }
        }
        
        # Start service (background)
        $processName = "AI-Grading-$ServiceName"
        Start-Process -FilePath "cmd" -ArgumentList "/c", "title $processName && npm run dev" -WindowStyle Normal
        
        Write-Host "[SUCCESS] $ServiceName started" -ForegroundColor Green
    }
    catch {
        Write-Host "[ERROR] $_" -ForegroundColor Red
        Set-Location $originalLocation
        Read-Host "Press any key to exit"
        exit 1
    }
    finally {
        Set-Location $originalLocation
    }
}

# Check service health
function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [string]$Url
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "[HEALTHY] $ServiceName : OK" -ForegroundColor Green
    }
    catch {
        Write-Host "[WARNING] $ServiceName : Unhealthy (may still be starting)" -ForegroundColor Yellow
    }
}

# Check if port is occupied
function Test-Port {
    param([int]$Port)
    
    try {
        # Try Get-NetTCPConnection first (Windows 8/2012+)
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        return $connection -ne $null
    }
    catch {
        try {
            # Fallback to netstat if Get-NetTCPConnection is not available
            $netstatOutput = & netstat -an | Select-String ":$Port "
            return $netstatOutput -ne $null
        }
        catch {
            # If all fails, return false (assume port is free)
            return $false
        }
    }
}

# Main execution flow
try {
    # Check prerequisites
    Test-Prerequisites
    
    # Initialize directories
    Initialize-Directories
    
    Write-Host "[PREPARE] Preparing to start services..." -ForegroundColor Yellow
    Write-Host ""
    
    # Check port occupation
    $ports = @(3000, 5001, 5173)
    $services = @("Grading Service", "Conversion Service", "Frontend")
    
    for ($i = 0; $i -lt $ports.Length; $i++) {
        if (Test-Port -Port $ports[$i]) {
            Write-Host "[WARNING] Port $($ports[$i]) is occupied ($($services[$i]))" -ForegroundColor Yellow
        }
    }
    
    # Start services
    Start-Service -ServiceName "Grading-Service" -ServicePath "grading" -Port 3000
    Start-Sleep -Seconds 3
    
    Start-Service -ServiceName "Conversion-Service" -ServicePath "conversion" -Port 5001
    Start-Sleep -Seconds 3
    
    Start-Service -ServiceName "Frontend" -ServicePath "frontend" -Port 5173
    
    Write-Host ""
    Write-Host "[COMPLETE] All services started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "[ADDRESSES] Service URLs:" -ForegroundColor Cyan
    Write-Host "   Grading Service:    http://localhost:3000" -ForegroundColor White
    Write-Host "   Conversion Service: http://localhost:5001" -ForegroundColor White
    Write-Host "   Frontend:           http://localhost:5173" -ForegroundColor White
    Write-Host ""
    
    Write-Host "[WAIT] Waiting for services to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8
    
    Write-Host ""
    Write-Host "[HEALTH] Checking service health..." -ForegroundColor Yellow
    
    # Check service health
    Test-ServiceHealth -ServiceName "Grading Service" -Url "http://localhost:3000/health"
    Test-ServiceHealth -ServiceName "Conversion Service" -Url "http://localhost:5001/health"
    
    Write-Host ""
    Write-Host "[ACCESS] Please visit in browser: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "[READY] System is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "[INFO] Instructions:" -ForegroundColor Cyan
    Write-Host "   - Closing this window will NOT stop services" -ForegroundColor Gray
    Write-Host "   - To stop all services, run stop.ps1" -ForegroundColor Gray
    Write-Host "   - Service logs are in their respective command windows" -ForegroundColor Gray
    Write-Host ""
    
    Read-Host "Press any key to exit"
}
catch {
    Write-Host "[ERROR] Error during startup: $_" -ForegroundColor Red
    Read-Host "Press any key to exit"
    exit 1
}

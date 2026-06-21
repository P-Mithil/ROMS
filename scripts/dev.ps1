#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "ROMS — starting development environment..." -ForegroundColor Cyan

# Check Docker
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Docker not running" }
} catch {
    Write-Error "Docker is not running. Start Docker Desktop and retry."
    exit 1
}

Write-Host "Starting PostgreSQL..." -ForegroundColor Yellow
docker compose up -d postgres

Write-Host "Waiting for database to be healthy..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
while ($attempt -lt $maxAttempts) {
    $health = docker inspect --format='{{.State.Health.Status}}' roms-postgres 2>$null
    if ($health -eq "healthy") {
        Write-Host "Database is ready." -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 2
    $attempt++
}

if ($attempt -ge $maxAttempts) {
    Write-Error "PostgreSQL did not become healthy in time."
    exit 1
}

if (-not (Test-Path ".env")) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

Write-Host "Running database migrations..." -ForegroundColor Yellow
pnpm db:migrate

Write-Host "Starting client and server..." -ForegroundColor Green
pnpm dev

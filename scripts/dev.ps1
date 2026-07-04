#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "ROMS — starting development environment..." -ForegroundColor Cyan

# Check PostgreSQL is listening on localhost:5432
Write-Host "Checking PostgreSQL on localhost:5432..." -ForegroundColor Yellow
$tcp = New-Object System.Net.Sockets.TcpClient
try {
    $tcp.Connect("localhost", 5432)
    $tcp.Close()
    Write-Host "PostgreSQL is reachable." -ForegroundColor Green
} catch {
    Write-Error @"
PostgreSQL is not reachable on localhost:5432.
Start the PostgreSQL Windows service (services.msc) and ensure the database exists.
See README.md for setup instructions.
"@
    exit 1
}

if (-not (Test-Path ".env")) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "Update DATABASE_URL in .env with your PostgreSQL password, then rerun this script." -ForegroundColor Yellow
    exit 0
}

Write-Host "Running database migrations..." -ForegroundColor Yellow
pnpm db:migrate

Write-Host "Starting client and server..." -ForegroundColor Green
pnpm dev

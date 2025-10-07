@echo off
REM Verbose Docker logging helper script for Windows
REM This script shows detailed logs from the BizGov Docker containers

echo =========================================
echo BizGov Verbose Docker Logs
echo =========================================
echo.

REM Check if containers are running
docker ps | find "bizgov" >nul
if errorlevel 1 (
    echo WARNING: No BizGov containers are running!
    echo.
    echo Start containers with:
    echo   docker-compose up -d
    echo.
    exit /b 1
)

echo Showing live logs from all containers...
echo Press Ctrl+C to stop
echo.

REM Follow logs from both containers with timestamps
docker-compose logs -f --timestamps --tail=100

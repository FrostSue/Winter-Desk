@echo off
title WinterDesk Launcher
cd /d "%~dp0"

if exist "release\WinterDesk-Portable-1.0.1.exe" (
    start "" "release\WinterDesk-Portable-1.0.1.exe"
    exit /b 0
)

if exist "release\WinterDesk-Setup-1.0.1.exe" (
    start "" "release\WinterDesk-Setup-1.0.1.exe"
    exit /b 0
)

if exist "node_modules\electron\dist\electron.exe" (
    start "" "node_modules\electron\dist\electron.exe" .
    exit /b 0
)

pause
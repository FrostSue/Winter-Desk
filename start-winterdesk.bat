@echo off
title WinterDesk Launcher
cd /d "%~dp0"

for /f "delims=" %%f in ('dir /b /a-d /o-d "release\WinterDesk-Portable-*.exe" 2^>nul') do (
    start "" "release\%%f"
    exit /b 0
)

for /f "delims=" %%f in ('dir /b /a-d /o-d "release\WinterDesk-Setup-*.exe" 2^>nul') do (
    start "" "release\%%f"
    exit /b 0
)

if exist "node_modules\electron\dist\electron.exe" (
    start "" "node_modules\electron\dist\electron.exe" .
    exit /b 0
)

pause
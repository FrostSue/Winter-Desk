@echo off
title WinterDesk Launcher
cd /d "%~dp0"

for %%f in ("release\WinterDesk-Portable-*.exe") do (
    start "" "%%~ff"
    exit /b 0
)

for %%f in ("release\WinterDesk-Setup-*.exe") do (
    start "" "%%~ff"
    exit /b 0
)

if exist "node_modules\electron\dist\electron.exe" (
    start "" "node_modules\electron\dist\electron.exe" .
    exit /b 0
)

pause
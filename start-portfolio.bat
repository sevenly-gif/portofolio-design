@echo off
cd /d "%~dp0"

where powershell.exe >nul 2>nul
if errorlevel 1 (
    echo Windows PowerShell is required to start the portfolio.
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-portfolio.ps1"
if errorlevel 1 (
    echo The portfolio could not start. Check the message above.
    pause
    exit /b 1
)
exit /b

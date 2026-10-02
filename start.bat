@echo off
title Saylani Mini Hackathon - Local Server
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo  Node.js is not installed. Install it from https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo  Starting local server... (do not close this window)
echo.

node server.js

pause

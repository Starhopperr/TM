@echo off
echo ===================================================
echo             TURING STUDIO LAUNCHER
echo ===================================================
start "Turing Studio Backend" cmd /k "%~dp0run_backend.bat"
timeout /t 2 /nobreak >nul
start "Turing Studio UI" cmd /k "%~dp0run_frontend.bat"
echo Services launched!

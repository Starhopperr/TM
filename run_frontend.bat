@echo off
echo Starting Turing Studio Desktop UI...
cd /d "%~dp0apps\desktop"
call npm run dev
pause

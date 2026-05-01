@echo off
REM Preview kitchen ticket layout offline — no server needed.
cd /d "%~dp0"
set "PRINT_AGENT_STATION=kitchen"
node print-agent.mjs --sample
pause

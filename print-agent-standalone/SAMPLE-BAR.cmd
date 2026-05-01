@echo off
REM Preview bar ticket layout offline — no server needed.
cd /d "%~dp0"
set "PRINT_AGENT_STATION=bar"
node print-agent.mjs --sample
pause

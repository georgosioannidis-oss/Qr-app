@echo off
REM Preview cold-kitchen ticket layout offline — no server needed.
cd /d "%~dp0"
set "PRINT_AGENT_STATION=cold-kitchen"
node print-agent.mjs --sample
pause

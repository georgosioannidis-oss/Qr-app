@echo off
REM ============================================================
REM  QR Menu — Cold Kitchen auto-print agent
REM  Requires: Node.js. Sends tickets via raw TCP to Ethernet printer.
REM  1) Run "npm install" once in this folder
REM  2) Double-click this file to start
REM  Keep this window open — closing it stops printing
REM ============================================================

cd /d "%~dp0"
call "%~dp0ENV-MOUSTAKALLIS.cmd"
set "PRINT_AGENT_STATION=cold-kitchen"
set "PRINT_AGENT_RAW_HOST=192.168.11.66"
set "PRINT_AGENT_RAW_PORT=9100"
set "PRINT_COMMAND=""C:\Users\%USERNAME%\AppData\Local\SumatraPDF\SumatraPDF.exe"" -print-to-default -silent {file}"

echo.
echo  =============================================
echo   QR Menu — COLD KITCHEN auto-print agent
echo   Raw print: %PRINT_AGENT_RAW_HOST%:%PRINT_AGENT_RAW_PORT%
echo   PDFs saved to: %USERPROFILE%\print-agent-pdfs
echo  =============================================
echo.

call npm start
if errorlevel 1 pause

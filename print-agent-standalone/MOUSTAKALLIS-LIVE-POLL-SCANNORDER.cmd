@echo off
REM =============================================================================
REM  Moustakallis — live poll scannorder.ink (all stations, PDF only, no printer)
REM  Double-click this file. Place a real order from another phone on scannorder.ink.
REM  PDFs: %USERPROFILE%\print-agent-pdfs
REM  Close the window to stop.
REM =============================================================================
cd /d "%~dp0"

set "PRINT_AGENT_BASE_URL=https://scannorder.ink"
set "PRINT_AGENT_API_SECRET=fHt+Oz12X7yywZf/Y34nQpyFVMzZ2AN4ZnE+nuDRwIOrlDUOKvJ4tfACj3koMDR0"
set "PRINT_AGENT_RESTAURANT_SLUG=moustakallis"
set "PRINT_AGENT_STATION=all"
set "PRINT_AGENT_POLL_MS=5000"
set "PRINT_AGENT_PDF_DIR=%USERPROFILE%\print-agent-pdfs"
set "PRINT_AGENT_FONT_PATH=C:\Windows\Fonts\arial.ttf"

REM PDF-only test: do not send to network printer or Sumatra
set "PRINT_AGENT_RAW_HOST="
set "PRINT_COMMAND="

echo.
echo  Moustakallis live print-agent (PDF only)
echo  Site:    %PRINT_AGENT_BASE_URL%
echo  Slug:    %PRINT_AGENT_RESTAURANT_SLUG%
echo  Poll:    every %PRINT_AGENT_POLL_MS% ms  stations: ALL
echo  PDF dir: %PRINT_AGENT_PDF_DIR%
echo.
echo  Server must have the SAME PRINT_AGENT_API_SECRET in .env
echo.

node print-agent.mjs
if errorlevel 1 pause

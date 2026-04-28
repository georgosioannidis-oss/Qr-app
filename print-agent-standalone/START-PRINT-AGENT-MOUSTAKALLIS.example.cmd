@echo off
REM ============================================================
REM  QR Menu — Moustakallis kitchen auto-print agent
REM  Polls scannorder.ink and sends tickets to thermal printer (TCP 9100).
REM
REM  1) Copy this file to START-PRINT-AGENT-MOUSTAKALLIS.cmd (same folder).
REM  2) Edit PRINT_AGENT_API_SECRET — must match PRINT_AGENT_API_SECRET on the server.
REM  3) Run "npm install" once in this folder (or let the script try on first run).
REM  4) Double-click the .cmd. Keep the window open while printing should work.
REM
REM  Do NOT commit a .cmd that contains your real secret.
REM ============================================================

cd /d "%~dp0"

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

set "PRINT_AGENT_BASE_URL=https://scannorder.ink"
set "PRINT_AGENT_API_SECRET=PASTE_SAME_SECRET_AS_SERVER_DOT_ENV"
set "PRINT_AGENT_RESTAURANT_SLUG=moustakallis"
set "PRINT_AGENT_STATION=kitchen"
set "PRINT_AGENT_PDF_DIR=%USERPROFILE%\print-agent-pdfs"
set "PRINT_AGENT_FONT_PATH=C:\Windows\Fonts\arial.ttf"
set "PRINT_AGENT_RAW_HOST=192.168.11.66"
set "PRINT_AGENT_RAW_PORT=9100"
REM Optional: send paper cut after each ticket (set to 1 if your printer supports it)
REM set "PRINT_AGENT_RAW_CUT=1"

echo.
echo  =============================================
echo   QR Menu — Moustakallis KITCHEN print agent
echo   Site:     %PRINT_AGENT_BASE_URL%
echo   Printer:  %PRINT_AGENT_RAW_HOST%:%PRINT_AGENT_RAW_PORT% ^(TCP^)
echo   PDFs:     %PRINT_AGENT_PDF_DIR%
echo  =============================================
echo.

call npm start
if errorlevel 1 pause

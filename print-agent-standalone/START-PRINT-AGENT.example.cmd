@echo off
REM QR Menu print agent — Windows easy start
REM 1) Copy this file to START-PRINT-AGENT.cmd (same folder).
REM 2) Edit ONLY the four values under "EDIT BELOW" (ask your tech person for them).
REM 3) In this folder, run "npm install" once (in a terminal).
REM 4) Double-click START-PRINT-AGENT.cmd to run. Leave the window open.

cd /d "%~dp0"

REM ---------- EDIT BELOW (4 lines) ----------
set "PRINT_AGENT_BASE_URL=https://YOUR-SITE.com"
set "PRINT_AGENT_API_SECRET=PASTE-THE-SAME-SECRET-AS-ON-THE-SERVER"
set "PRINT_AGENT_RESTAURANT_SLUG=your-dashboard-slug"
set "PRINT_AGENT_STATION=kitchen"
REM Station must be exactly: bar   OR   cold-kitchen   OR   kitchen

REM ---------- Usually leave these as-is ----------
set "PRINT_AGENT_PDF_DIR=%USERPROFILE%\print-agent-pdfs"
REM To send each ticket to a printer automatically, uncomment and fix the next line
REM (see full QR Menu repo .env.example). {file} = path to the PDF.
REM set "PRINT_COMMAND=SumatraPDF.exe -print-to-default -silent {file}"

echo.
echo Starting print agent... (close this window to stop)
echo.

call npm start
if errorlevel 1 pause

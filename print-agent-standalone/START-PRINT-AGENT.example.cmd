@echo off
REM QR Menu print agent — Windows easy start
REM 1) Copy this file to START-<STATION>.cmd (same folder).
REM 2) Edit the values under "EDIT BELOW" (ask your tech person for the secret).
REM 3) In this folder, run "npm install" once (in a terminal).
REM 4) Double-click the .cmd file to run. Leave the window open.
REM TIP: Download a pre-filled version of this file from Dashboard → Options → Auto-print.

cd /d "%~dp0"

REM ---------- EDIT BELOW ----------
set "PRINT_AGENT_BASE_URL=https://YOUR-SITE.com"
set "PRINT_AGENT_API_SECRET=PASTE-THE-SAME-SECRET-AS-ON-THE-SERVER"
set "PRINT_AGENT_RESTAURANT_SLUG=your-dashboard-slug"
set "PRINT_AGENT_STATION=all"
REM PRINT_AGENT_STATION: use "all" to catch every station, or the slug of one station.
REM The slug is the station name in lowercase with spaces replaced by hyphens.
REM Example: station "Cold Kitchen" → cold-kitchen   |   "Grill" → grill
REM Download a pre-filled script per station from Dashboard → Options → Auto-print.

REM ---------- Usually leave these as-is ----------
set "PRINT_AGENT_PDF_DIR=%USERPROFILE%\print-agent-pdfs"
REM To send each ticket to a printer automatically, uncomment and fix the next line
REM (see README.txt). {file} = path to the PDF.
REM set "PRINT_COMMAND=SumatraPDF.exe -print-to-default -silent {file}"

echo.
echo Starting print agent... (close this window to stop)
echo.

call npm start
if errorlevel 1 pause

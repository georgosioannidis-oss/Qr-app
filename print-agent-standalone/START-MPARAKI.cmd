@echo off
REM QR Menu print agent — MPARAKI station — Giorgos Tavern
REM 1) Place this file in your print-agent-standalone folder (next to print-agent.mjs).
REM 2) Fill in PRINT_AGENT_API_SECRET below (same value set on the server).
REM 3) In the print-agent-standalone folder, run "npm install" once in a terminal.
REM 4) Double-click this file to start. Leave the window open.

REM ---------- EDIT BELOW (1 line — the secret) ----------
set "PRINT_AGENT_API_SECRET=PASTE-THE-SAME-SECRET-AS-ON-THE-SERVER"

REM ---------- Pre-filled for Giorgos Tavern — MPARAKI ----------
set "PRINT_AGENT_BASE_URL=https://scannorder.ink"
set "PRINT_AGENT_RESTAURANT_SLUG=giorgos-tavern"
set "PRINT_AGENT_STATION=mparaki"

REM ---------- Usually leave these as-is ----------
set "PRINT_AGENT_PDF_DIR=%USERPROFILE%\print-agent-pdfs"
REM To send each ticket to a printer automatically, uncomment and fix the next line:
REM set "PRINT_COMMAND=SumatraPDF.exe -print-to-default -silent {file}"

echo.
echo Starting print agent for MPARAKI... (close this window to stop)
echo.

node "%~dp0print-agent.mjs"
pause
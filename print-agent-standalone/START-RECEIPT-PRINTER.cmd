@echo off
REM QR Menu receipt printer — Aparto Bistro
REM Prints a full customer receipt (all items + total) for every new order.
REM 1) Place this file in your print-agent-standalone folder (next to print-agent.mjs).
REM 2) In the print-agent-standalone folder, run "npm install" once in a terminal.
REM 3) Double-click this file to start. Leave the window open.

REM ---------- Pre-filled — no editing needed ----------
set "PRINT_AGENT_API_SECRET=fHt+Oz12X7yywZf/Y34nQpyFVMzZ2AN4ZnE+nuDRwIOrlDUOKvJ4tfACj3koMDR0"
set "PRINT_AGENT_BASE_URL=https://scannorder.ink"
set "PRINT_AGENT_RESTAURANT_SLUG=aparto-bistro"
set "PRINT_AGENT_STATION=receipt"

REM ---------- Usually leave these as-is ----------
set "PRINT_AGENT_PDF_DIR=%USERPROFILE%\print-agent-pdfs"
REM To send each receipt to a printer automatically, uncomment and fix the next line:
REM set "PRINT_COMMAND=SumatraPDF.exe -print-to-default -silent {file}"

echo.
echo Starting receipt printer for Aparto Bistro... (close this window to stop)
echo.

node "%~dp0print-agent.mjs"
pause